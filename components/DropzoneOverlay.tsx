import React from 'react';
import { Icon } from './Icon';

interface DropzoneOverlayProps {
  isActive: boolean;
}

export const DropzoneOverlay: React.FC<DropzoneOverlayProps> = ({ isActive }) => {
  return (
    <div 
      className={`absolute inset-0 z-20 bg-[var(--glass-bg)] bg-opacity-80 backdrop-blur-md transition-all duration-300 flex items-center justify-center p-4 ${
        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
      }`}
    >
      <div className="text-center text-[var(--text-color)] w-full h-full flex flex-col items-center justify-center border-4 border-dashed border-[var(--accent-color)] rounded-[var(--radius-2xl)]">
        <Icon icon="upload" className="w-16 h-16 mx-auto text-[var(--accent-color)]" />
        <p className="mt-4 text-2xl font-bold">Drop files here</p>
        <p className="text-[var(--text-color-secondary)]">to add them to your message</p>
      </div>
    </div>
  );
};
