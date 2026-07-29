import { useEffect, useRef, useState } from 'react';

// Gear-icon dropdown shared by quote / scenario / practice rows.
export default function ItemMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <div className="item-menu" ref={ref}>
      <button
        className="menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        ⚙
      </button>
      <div className={`menu-dropdown ${open ? '' : 'hidden'}`}>
        <button
          className="menu-edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            onEdit();
          }}
        >
          編輯
        </button>
        <button
          className="menu-delete-btn danger-item"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            onDelete();
          }}
        >
          刪除
        </button>
      </div>
    </div>
  );
}
