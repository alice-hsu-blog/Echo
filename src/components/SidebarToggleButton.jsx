export default function SidebarToggleButton({ collapsed, onClick }) {
  return (
    <button
      className="icon-btn sidebar-toggle-btn"
      onClick={onClick}
      title={collapsed ? 'Show Sidebar' : 'Hide Sidebar'}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="2.5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1.9" y="3.4" width="3.4" height="9.2" rx="1" fill="currentColor" />
      </svg>
    </button>
  );
}
