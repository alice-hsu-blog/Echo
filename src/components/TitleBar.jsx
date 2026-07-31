import SidebarToggleButton from './SidebarToggleButton.jsx';

// Sits in the macOS overlay title bar (see titleBarStyle/hiddenTitle in
// src-tauri/tauri.conf.json), to the right of the traffic lights, in place
// of the native window title. `data-tauri-drag-region` lets the window still
// be dragged from empty space here; the button itself stays clickable since
// it doesn't carry that attribute.
export default function TitleBar({ onToggleSidebar }) {
  return (
    <div className="app-titlebar" data-tauri-drag-region>
      <SidebarToggleButton collapsed={false} onClick={onToggleSidebar} />
    </div>
  );
}
