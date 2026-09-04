import { useEffect, useRef, useState } from 'react';

const WIDTH_KEY = 'echo-sidebar-width';
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 180;
const MAX_WIDTH = 480;

// Manages sidebar width, persisted across launches, plus the drag-to-resize
// handle logic. Width is always clamped to [MIN_WIDTH, MAX_WIDTH] — dragging
// can never shrink the sidebar away entirely.
export function useSidebarWidth() {
  const [width, setWidth] = useState(() => {
    const stored = Number(localStorage.getItem(WIDTH_KEY));
    return stored >= MIN_WIDTH && stored <= MAX_WIDTH ? stored : DEFAULT_WIDTH;
  });
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(WIDTH_KEY, String(width));
  }, [width]);

  const startResize = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);

    const handleMove = (moveEvent) => {
      if (!draggingRef.current) return;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, moveEvent.clientX)));
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

  return { width, dragging, startResize };
}
