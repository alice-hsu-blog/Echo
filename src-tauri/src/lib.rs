use rusqlite::{params, Connection};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::sync::Mutex;
use tauri::menu::{CheckMenuItemBuilder, MenuItemBuilder, MenuItemKind, PredefinedMenuItem, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Manager, State};

struct DbState(Mutex<Connection>);

fn db_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("echo.db"))
}

// Normalized schema: quotes -> scenarios -> practices, plus a flat
// folders table that quotes optionally reference. `seq` (not `id`, which
// is the caller-supplied uid()) is what preserves display order, since
// rows are re-inserted in array order on every echo_save.
fn init_schema(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS folders (
            seq        INTEGER PRIMARY KEY AUTOINCREMENT,
            id         TEXT NOT NULL UNIQUE,
            name       TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS quotes (
            seq        INTEGER PRIMARY KEY AUTOINCREMENT,
            id         TEXT NOT NULL UNIQUE,
            text       TEXT NOT NULL,
            source     TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            folder_id  TEXT REFERENCES folders(id) ON DELETE SET NULL,
            deleted_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS scenarios (
            seq        INTEGER PRIMARY KEY AUTOINCREMENT,
            id         TEXT NOT NULL UNIQUE,
            quote_id   TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
            scenario   TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS practices (
            seq         INTEGER PRIMARY KEY AUTOINCREMENT,
            id          TEXT NOT NULL UNIQUE,
            scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
            text        TEXT NOT NULL,
            date        TEXT NOT NULL,
            created_at  INTEGER NOT NULL
        );
        ",
    )?;

    // quotes.deleted_at was added after the initial release; back-fill it
    // onto any existing database whose quotes table predates the column.
    let has_deleted_at: bool = conn
        .prepare("SELECT COUNT(*) FROM pragma_table_info('quotes') WHERE name = 'deleted_at'")?
        .query_row([], |row| row.get::<_, i64>(0))?
        > 0;
    if !has_deleted_at {
        conn.execute("ALTER TABLE quotes ADD COLUMN deleted_at INTEGER", [])?;
    }

    Ok(())
}

#[tauri::command]
fn echo_load(state: State<DbState>) -> Result<Value, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    echo_load_impl(&conn)
}

fn echo_load_impl(conn: &Connection) -> Result<Value, String> {
    let mut practices_by_scenario: HashMap<String, Vec<Value>> = HashMap::new();
    {
        let mut stmt = conn
            .prepare("SELECT id, scenario_id, text, date, created_at FROM practices ORDER BY seq")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(1)?,
                    json!({
                        "id": row.get::<_, String>(0)?,
                        "text": row.get::<_, String>(2)?,
                        "date": row.get::<_, String>(3)?,
                        "createdAt": row.get::<_, i64>(4)?,
                    }),
                ))
            })
            .map_err(|e| e.to_string())?;
        for r in rows {
            let (scenario_id, practice) = r.map_err(|e| e.to_string())?;
            practices_by_scenario.entry(scenario_id).or_default().push(practice);
        }
    }

    let mut scenarios_by_quote: HashMap<String, Vec<Value>> = HashMap::new();
    {
        let mut stmt = conn
            .prepare("SELECT id, quote_id, scenario, created_at FROM scenarios ORDER BY seq")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                ))
            })
            .map_err(|e| e.to_string())?;
        for r in rows {
            let (quote_id, id, scenario, created_at) = r.map_err(|e| e.to_string())?;
            let practices = practices_by_scenario.remove(&id).unwrap_or_default();
            scenarios_by_quote.entry(quote_id).or_default().push(json!({
                "id": id,
                "scenario": scenario,
                "createdAt": created_at,
                "practices": practices,
            }));
        }
    }

    let mut quotes = Vec::new();
    {
        let mut stmt = conn
            .prepare("SELECT id, text, source, created_at, folder_id, deleted_at FROM quotes ORDER BY seq")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, Option<String>>(4)?,
                    row.get::<_, Option<i64>>(5)?,
                ))
            })
            .map_err(|e| e.to_string())?;
        for r in rows {
            let (id, text, source, created_at, folder_id, deleted_at) = r.map_err(|e| e.to_string())?;
            let scenarios = scenarios_by_quote.remove(&id).unwrap_or_default();
            quotes.push(json!({
                "id": id,
                "text": text,
                "source": source,
                "createdAt": created_at,
                "folderId": folder_id,
                "deletedAt": deleted_at,
                "scenarios": scenarios,
            }));
        }
    }

    let mut folders = Vec::new();
    {
        let mut stmt = conn
            .prepare("SELECT id, name, created_at FROM folders ORDER BY seq")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok(json!({
                    "id": row.get::<_, String>(0)?,
                    "name": row.get::<_, String>(1)?,
                    "createdAt": row.get::<_, i64>(2)?,
                }))
            })
            .map_err(|e| e.to_string())?;
        for r in rows {
            folders.push(r.map_err(|e| e.to_string())?);
        }
    }

    Ok(json!({ "quotes": quotes, "folders": folders }))
}

// Replaces the entire contents of every table in one transaction, in the
// array order the frontend sent, so seq (and therefore display order) is
// rebuilt to match. Mirrors the old whole-file overwrite, just against
// SQLite rows instead of a JSON blob.
#[tauri::command]
fn echo_save(state: State<DbState>, data: Value) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    echo_save_impl(&mut conn, data)
}

fn echo_save_impl(conn: &mut Connection, data: Value) -> Result<(), String> {
    let quotes = data
        .get("quotes")
        .and_then(|v| v.as_array())
        .ok_or("invalid format")?;
    let no_folders: Vec<Value> = Vec::new();
    let folders = data
        .get("folders")
        .and_then(|v| v.as_array())
        .unwrap_or(&no_folders);

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM practices", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM scenarios", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM quotes", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM folders", []).map_err(|e| e.to_string())?;

    for f in folders {
        tx.execute(
            "INSERT INTO folders (id, name, created_at) VALUES (?1, ?2, ?3)",
            params![
                f.get("id").and_then(|v| v.as_str()).ok_or("folder missing id")?,
                f.get("name").and_then(|v| v.as_str()).ok_or("folder missing name")?,
                f.get("createdAt").and_then(|v| v.as_i64()).ok_or("folder missing createdAt")?,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    let no_scenarios: Vec<Value> = Vec::new();
    let no_practices: Vec<Value> = Vec::new();

    for q in quotes {
        let qid = q.get("id").and_then(|v| v.as_str()).ok_or("quote missing id")?;
        tx.execute(
            "INSERT INTO quotes (id, text, source, created_at, folder_id, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                qid,
                q.get("text").and_then(|v| v.as_str()).ok_or("quote missing text")?,
                q.get("source").and_then(|v| v.as_str()).ok_or("quote missing source")?,
                q.get("createdAt").and_then(|v| v.as_i64()).ok_or("quote missing createdAt")?,
                q.get("folderId").and_then(|v| v.as_str()),
                q.get("deletedAt").and_then(|v| v.as_i64()),
            ],
        )
        .map_err(|e| e.to_string())?;

        let scenarios = q.get("scenarios").and_then(|v| v.as_array()).unwrap_or(&no_scenarios);
        for sc in scenarios {
            let sid = sc.get("id").and_then(|v| v.as_str()).ok_or("scenario missing id")?;
            tx.execute(
                "INSERT INTO scenarios (id, quote_id, scenario, created_at) VALUES (?1, ?2, ?3, ?4)",
                params![
                    sid,
                    qid,
                    sc.get("scenario").and_then(|v| v.as_str()).ok_or("scenario missing scenario")?,
                    sc.get("createdAt").and_then(|v| v.as_i64()).ok_or("scenario missing createdAt")?,
                ],
            )
            .map_err(|e| e.to_string())?;

            let practices = sc.get("practices").and_then(|v| v.as_array()).unwrap_or(&no_practices);
            for p in practices {
                tx.execute(
                    "INSERT INTO practices (id, scenario_id, text, date, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![
                        p.get("id").and_then(|v| v.as_str()).ok_or("practice missing id")?,
                        sid,
                        p.get("text").and_then(|v| v.as_str()).ok_or("practice missing text")?,
                        p.get("date").and_then(|v| v.as_str()).ok_or("practice missing date")?,
                        p.get("createdAt").and_then(|v| v.as_i64()).ok_or("practice missing createdAt")?,
                    ],
                )
                .map_err(|e| e.to_string())?;
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_nested_data_through_sqlite() {
        let mut conn = Connection::open_in_memory().unwrap();
        init_schema(&conn).unwrap();

        let data = json!({
            "folders": [
                { "id": "f1", "name": "散文", "createdAt": 1000 }
            ],
            "quotes": [
                {
                    "id": "q1",
                    "text": "山不在高，有仙則名",
                    "source": "陋室銘",
                    "createdAt": 2000,
                    "folderId": "f1",
                    "deletedAt": null,
                    "scenarios": [
                        {
                            "id": "s1",
                            "scenario": "開場白",
                            "createdAt": 3000,
                            "practices": [
                                { "id": "p1", "text": "練習一", "date": "2026-07-30", "createdAt": 4000 }
                            ]
                        }
                    ]
                },
                {
                    "id": "q2",
                    "text": "無主的引言",
                    "source": "",
                    "createdAt": 2500,
                    "folderId": null,
                    "deletedAt": 3500,
                    "scenarios": []
                }
            ]
        });

        echo_save_impl(&mut conn, data.clone()).unwrap();
        let loaded = echo_load_impl(&conn).unwrap();
        assert_eq!(loaded, data);

        // Deleting the folder's quote's scenario's practice via a full
        // resave should cascade cleanly and not resurrect anything.
        let data2 = json!({ "folders": [], "quotes": [] });
        echo_save_impl(&mut conn, data2.clone()).unwrap();
        let loaded2 = echo_load_impl(&conn).unwrap();
        assert_eq!(loaded2, data2);
    }
}

// Writes an export backup to a path the user picked via the native save
// dialog (frontend calls `dialog.save()` for the path, then this command
// for the actual write) — a plain JSON snapshot for portability/backup,
// independent of how the live data is stored.
#[tauri::command]
fn echo_export_backup(path: String, data: Value) -> Result<(), String> {
    let body = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, body).map_err(|e| e.to_string())
}

// Reads a backup JSON file picked via the native open dialog (frontend calls
// `dialog.open()` for the path, then this command for the actual read) — the
// counterpart to echo_export_backup, used by the native "匯入備份"/"Import
// Backup" menu item since that flow has no <input type="file"> to read from
// directly.
#[tauri::command]
fn echo_read_backup_file(path: String) -> Result<Value, String> {
    let body = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&body).map_err(|e| e.to_string())
}

// Current state of the native menu's own toggles (theme + UI language), kept
// server-side so the whole menu can be torn down and rebuilt from scratch
// (see install_menu) without losing which items should render checked.
struct MenuPrefs {
    theme: String,
    language: String,
}

struct MenuState(Mutex<MenuPrefs>);

// Labels for the custom menu items, in each supported UI language. The
// language names themselves ("English" / "繁體中文") are deliberately NOT
// translated — every app lists language choices in their own language so
// users can find their language regardless of what's currently selected.
struct MenuLabels {
    appearance: &'static str,
    theme_system: &'static str,
    theme_light: &'static str,
    theme_dark: &'static str,
    export_backup: &'static str,
    import_backup: &'static str,
    preferences: &'static str,
    language: &'static str,
}

fn menu_labels(language: &str) -> MenuLabels {
    if language == "en" {
        MenuLabels {
            appearance: "Appearance",
            theme_system: "System",
            theme_light: "Light",
            theme_dark: "Dark",
            export_backup: "Export Backup…",
            import_backup: "Import Backup…",
            preferences: "Preferences",
            language: "Language",
        }
    } else {
        MenuLabels {
            appearance: "外觀",
            theme_system: "跟隨系統",
            theme_light: "淺色",
            theme_dark: "深色",
            export_backup: "匯出備份…",
            import_backup: "匯入備份…",
            preferences: "偏好設定",
            language: "語言",
        }
    }
}

// Adds an "外觀"/"Appearance" submenu under the platform's default "View"
// menu, with three mutually-exclusive check items for light/dark/system
// theme; "匯出備份"/"匯入備份" items prepended to the platform's default
// "File" menu (replacing the equivalent buttons that used to live in the
// sidebar footer, see Toolbar.jsx); and a top-level "偏好設定"/"Preferences"
// menu holding a "語言"/"Language" submenu with English/繁體中文 check items.
// Clicking a theme item emits `echo-set-theme`; a backup item emits
// `echo-export-backup`/`echo-import-backup`; a language item emits
// `echo-set-language` — the frontend (src/hooks/useTheme.js,
// src/hooks/useMenuBackup.js, src/hooks/useLanguage.js) listens for these
// and does the actual work, this is just the native-menu entry point.
//
// Rebuilt from scratch (rather than mutated in place) on every theme or
// language change, since changing the UI language also means re-labeling
// every custom item — `prefs` carries forward the current theme/language so
// the correct items still render checked after a rebuild.
fn install_menu(app: &AppHandle, prefs: &MenuPrefs) -> tauri::Result<()> {
    let labels = menu_labels(&prefs.language);
    let menu = tauri::menu::Menu::default(app)?;

    let theme_system = CheckMenuItemBuilder::with_id("theme-system", labels.theme_system)
        .checked(prefs.theme == "system")
        .build(app)?;
    let theme_light = CheckMenuItemBuilder::with_id("theme-light", labels.theme_light)
        .checked(prefs.theme == "light")
        .build(app)?;
    let theme_dark = CheckMenuItemBuilder::with_id("theme-dark", labels.theme_dark)
        .checked(prefs.theme == "dark")
        .build(app)?;

    let appearance = SubmenuBuilder::new(app, labels.appearance)
        .item(&theme_system)
        .item(&theme_light)
        .item(&theme_dark)
        .build()?;

    let export_backup = MenuItemBuilder::with_id("export-backup", labels.export_backup).build(app)?;
    let import_backup = MenuItemBuilder::with_id("import-backup", labels.import_backup).build(app)?;
    let backup_separator = PredefinedMenuItem::separator(app)?;

    let lang_en = CheckMenuItemBuilder::with_id("lang-en", "English")
        .checked(prefs.language == "en")
        .build(app)?;
    let lang_zh = CheckMenuItemBuilder::with_id("lang-zh", "繁體中文")
        .checked(prefs.language == "zh")
        .build(app)?;

    let language_menu = SubmenuBuilder::new(app, labels.language)
        .item(&lang_en)
        .item(&lang_zh)
        .build()?;
    let preferences = SubmenuBuilder::new(app, labels.preferences)
        .item(&language_menu)
        .build()?;

    for item in menu.items()? {
        if let MenuItemKind::Submenu(sub) = item {
            let text = sub.text()?;
            if text.eq_ignore_ascii_case("view") {
                sub.append(&appearance)?;
            } else if text.eq_ignore_ascii_case("file") {
                sub.prepend_items(&[&export_backup, &import_backup, &backup_separator])?;
            }
        }
    }
    menu.append(&preferences)?;

    app.set_menu(menu)?;

    Ok(())
}

// Called once by the frontend on startup (src/hooks/useLanguage.js), after it
// has resolved the UI language to use (a stored preference, or the OS locale
// on first run — see detectLanguage in useLanguage.js). Re-labels the native
// menu's custom items to match, without touching the current theme selection.
#[tauri::command]
fn echo_set_menu_language(
    app: AppHandle,
    state: State<MenuState>,
    language: String,
) -> Result<(), String> {
    let mut prefs = state.0.lock().map_err(|e| e.to_string())?;
    prefs.language = language;
    install_menu(&app, &prefs).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            let path = db_path(app.handle()).expect("failed to resolve app data dir");
            let conn = Connection::open(&path).expect("failed to open database");
            init_schema(&conn).expect("failed to initialize database schema");
            app.manage(DbState(Mutex::new(conn)));

            let initial_prefs = MenuPrefs {
                theme: "system".to_string(),
                language: "zh".to_string(),
            };
            install_menu(app.handle(), &initial_prefs)?;
            app.manage(MenuState(Mutex::new(initial_prefs)));

            app.on_menu_event(|app_handle, event| {
                let clicked_id = event.id().0.as_str();
                let state = app_handle.state::<MenuState>();
                let mut prefs = match state.0.lock() {
                    Ok(p) => p,
                    Err(_) => return,
                };
                match clicked_id {
                    "theme-system" | "theme-light" | "theme-dark" => {
                        prefs.theme = match clicked_id {
                            "theme-system" => "system",
                            "theme-light" => "light",
                            _ => "dark",
                        }
                        .to_string();
                        let _ = install_menu(app_handle, &prefs);
                        let _ = app_handle.emit("echo-set-theme", prefs.theme.clone());
                    }
                    "lang-en" | "lang-zh" => {
                        prefs.language = if clicked_id == "lang-en" { "en" } else { "zh" }.to_string();
                        let _ = install_menu(app_handle, &prefs);
                        let _ = app_handle.emit("echo-set-language", prefs.language.clone());
                    }
                    "export-backup" => {
                        let _ = app_handle.emit("echo-export-backup", ());
                    }
                    "import-backup" => {
                        let _ = app_handle.emit("echo-import-backup", ());
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            echo_load,
            echo_save,
            echo_export_backup,
            echo_read_backup_file,
            echo_set_menu_language
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
