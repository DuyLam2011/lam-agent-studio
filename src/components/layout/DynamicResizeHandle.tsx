import React from 'react';

interface DynamicResizeHandleProps {
  onResize: (deltaX: number) => void;
}

export const DynamicResizeHandle: React.FC<DynamicResizeHandleProps> = ({ onResize }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      onResize(deltaX);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-2.5 my-4 z-20 shrink-0 cursor-col-resize hover:bg-white/10 flex items-center justify-center transition-colors group rounded-full select-none"
      title="Drag to resize panels"
    >
      <div className="w-1 h-8 bg-white/20 rounded-full group-hover:bg-primary group-hover:h-12 transition-all duration-200" />
    </div>
  );
};
