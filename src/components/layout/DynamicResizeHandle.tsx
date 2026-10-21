import React from 'react';
import clsx from 'clsx';

interface DynamicResizeHandleProps {
  orientation?: 'vertical' | 'horizontal';
  onResize: (delta: number) => void;
}

export const DynamicResizeHandle: React.FC<DynamicResizeHandleProps> = ({ orientation = 'vertical', onResize }) => {
  const isHorizontal = orientation === 'horizontal';

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startPos = isHorizontal ? e.clientY : e.clientX;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentPos = isHorizontal ? moveEvent.clientY : moveEvent.clientX;
      const delta = currentPos - startPos;
      onResize(delta);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = isHorizontal ? 'row-resize' : 'col-resize';
  };

  if (isHorizontal) {
    return (
      <div
        onMouseDown={handleMouseDown}
        className="h-2 mx-4 z-20 shrink-0 cursor-row-resize hover:bg-white/10 flex items-center justify-center transition-colors group rounded-full select-none"
        title="Drag up/down to resize bottom drawer"
      >
        <div className="h-0.5 w-16 bg-white/20 rounded-full group-hover:bg-primary group-hover:w-24 transition-all duration-200" />
      </div>
    );
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className={clsx(
        "w-2.5 my-4 z-20 shrink-0 cursor-col-resize hover:bg-white/10 flex items-center justify-center transition-colors group rounded-full select-none"
      )}
      title="Drag left/right to resize panels"
    >
      <div className="w-1 h-8 bg-white/20 rounded-full group-hover:bg-primary group-hover:h-12 transition-all duration-200" />
    </div>
  );
};
