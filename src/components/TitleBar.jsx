// Sits in the macOS overlay title bar (see titleBarStyle/hiddenTitle in
// src-tauri/tauri.conf.json), in place of the native window title.
// `data-tauri-drag-region` lets the window still be dragged from here.
export default function TitleBar() {
  return <div className="app-titlebar" data-tauri-drag-region />;
}
