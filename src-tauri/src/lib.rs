use serde_json::{json, Value};
use std::fs;
use tauri::{AppHandle, Manager};

fn data_file_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("writing_material_data.json"))
}

// Mirrors electron/main.cjs's one-time migration: if this is the first run
// (no data file yet in Tauri's app-data dir), pull existing data from
// wherever it already lives, in priority order:
//   1. Electron's app-data dir (same OS config-dir convention, app name
//      "Echo") — most likely to hold real data if Echo has been run as an
//      Electron app before.
//   2. The repo-root writing_material_data.json (only true when running
//      unpackaged on this dev machine, same as server.py/electron use).
fn migrate_legacy_data_if_needed(app: &AppHandle, data_file: &std::path::Path) {
    if data_file.exists() {
        return;
    }

    if let Ok(config_dir) = app.path().config_dir() {
        let electron_file = config_dir.join("Echo").join("writing_material_data.json");
        if electron_file.exists() && fs::copy(&electron_file, data_file).is_ok() {
            return;
        }
    }

    // CARGO_MANIFEST_DIR is baked in at compile time as src-tauri/'s path on
    // the machine that built this binary. In dev, that's this repo, so its
    // parent is the repo root server.py/electron also read the legacy file
    // from. In a real distributed build that path won't exist on the user's
    // machine, so this is a no-op there — same behavior as electron/main.cjs.
    let repo_root_file = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("writing_material_data.json");
    if repo_root_file.exists() {
        let _ = fs::copy(&repo_root_file, data_file);
    }
}

#[tauri::command]
fn echo_load(app: AppHandle) -> Result<Value, String> {
    let data_file = data_file_path(&app)?;
    migrate_legacy_data_if_needed(&app, &data_file);

    if !data_file.exists() {
        return Ok(json!({ "quotes": [] }));
    }
    let raw = fs::read_to_string(&data_file).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
fn echo_save(app: AppHandle, data: Value) -> Result<(), String> {
    if !data.is_object() || data.get("quotes").is_none() {
        return Err("invalid format".into());
    }
    let data_file = data_file_path(&app)?;
    let tmp = data_file.with_extension("json.tmp");
    let body = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&tmp, body).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &data_file).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![echo_load, echo_save])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
