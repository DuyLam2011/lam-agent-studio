import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';

interface DynamicResizeHandleProps {
  orientation?: 'vertical' | 'horizontal';
  onResize: (delta: number) => void;
  onReset?: () => void;
}

export const DynamicResizeHandle: React.FC<DynamicResizeHandleProps> = ({
  orientation = 'vertical',
  onResize,
  onReset
}) => {
  const isHorizontal = orientation === 'horizontal';
  const onResizeRef = useRef(onResize);
  const activeOverlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onResizeRef.current = onResize;
  });

  useEffect(() => {
    return () => {
      if (activeOverlayRef.current && activeOverlayRef.current.parentNode) {
        activeOverlayRef.current.parentNode.removeChild(activeOverlayRef.current);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let lastPos = isHorizontal ? e.clientY : e.clientX;

    // Create a temporary full-screen transparent overlay to capture all mouse events smoothly
    // and prevent Monaco Editor, Xterm, or iframes from stealing pointer events during drag
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '999999';
    overlay.style.cursor = isHorizontal ? 'row-resize' : 'col-resize';
    overlay.style.userSelect = 'none';
    document.body.appendChild(overlay);
    activeOverlayRef.current = overlay;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const currentPos = isHorizontal ? moveEvent.clientY : moveEvent.clientX;
      const delta = currentPos - lastPos;
      if (delta !== 0) {
        lastPos = currentPos;
        onResizeRef.current(delta);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      activeOverlayRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = isHorizontal ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReset?.();
  };

  if (isHorizontal) {
    return (
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="h-3 -my-0.5 mx-4 z-20 shrink-0 cursor-row-resize hover:bg-white/10 flex items-center justify-center transition-colors group rounded-full select-none"
        title="Drag up/down to resize • Double-click to auto-reset"
      >
        <div className="h-0.5 w-16 bg-white/20 rounded-full group-hover:bg-primary group-hover:w-24 transition-all duration-200" />
      </div>
    );
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className={clsx(
        "w-3 -mx-0.5 my-4 z-20 shrink-0 cursor-col-resize hover:bg-white/10 flex items-center justify-center transition-colors group rounded-full select-none"
      )}
      title="Drag left/right to resize • Double-click to auto-reset"
    >
      <div className="w-1 h-8 bg-white/20 rounded-full group-hover:bg-primary group-hover:h-12 transition-all duration-200" />
    </div>
  );
};
