import { useEffect, useRef, useState } from 'react';

const WIDTH_KEY = 'echo-sidebar-width';
const COLLAPSED_KEY = 'echo-sidebar-collapsed';
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 180;
const MAX_WIDTH = 480;
// Dragging the handle past this point (in px from the window's left edge)
// auto-collapses the sidebar instead of just shrinking it further.
const COLLAPSE_THRESHOLD = 120;

// Manages sidebar width + collapsed state, persisted across launches, plus
// the drag-to-resize handle logic (drag far enough left and it snaps shut).
export function useSidebarWidth() {
  const [width, setWidth] = useState(() => {
    const stored = Number(localStorage.getItem(WIDTH_KEY));
    return stored >= MIN_WIDTH && stored <= MAX_WIDTH ? stored : DEFAULT_WIDTH;
  });
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true');
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(WIDTH_KEY, String(width));
  }, [width]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const startResize = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);

    const handleMove = (moveEvent) => {
      if (!draggingRef.current) return;
      const x = moveEvent.clientX;
      if (x < COLLAPSE_THRESHOLD) {
        setCollapsed(true);
        return;
      }
      setCollapsed(false);
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, x)));
    };
    const handleUp = () => {
      draggingRef.current = false;
      setDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const toggleCollapsed = () => setCollapsed((c) => !c);

  return { width, collapsed, dragging, startResize, toggleCollapsed };
}
