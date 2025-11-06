import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface InfoModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ title, message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog modal-dialog-md ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-8 flex flex-col gap-6`}>
        <h2 className="text-2xl font-bold text-[var(--text-color)] text-center">{title}</h2>
        
        <div className="text-[var(--text-color-secondary)] whitespace-pre-line leading-relaxed text-center">
          {message}
        </div>

        <div className="flex justify-center mt-2">
          <button 
            onClick={handleClose}
            className="px-6 py-2.5 rounded-[var(--radius-2xl)] font-semibold bg-[var(--accent-color)] text-white transition-transform hover:scale-105"
          >
            我知道了
          </button>
        </div>
      </div>
    </>
  );
};