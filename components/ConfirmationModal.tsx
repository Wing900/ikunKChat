import React, { useState, useEffect } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { Icon } from './Icon';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onClose, onConfirm }) => {
  const { t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to finish
  };

  const handleConfirm = () => {
    onConfirm();
    // The parent component is responsible for closing the modal after confirm
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog modal-dialog-sm ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col gap-4 text-center`}>
        <h2 className="text-xl font-bold text-[var(--text-color)]">{title}</h2>
        
        <p className="text-[var(--text-color-secondary)]">{message}</p>

        <div className="flex justify-center gap-3 mt-4">
          <button 
            onClick={handleClose}
            className="px-4 py-2 rounded-[var(--radius-2xl)] font-semibold glass-pane border-none text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10"
          >
            {t('cancel')}
          </button>
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 rounded-[var(--radius-2xl)] font-semibold bg-[var(--danger-color)] text-white transition-transform hover:scale-105"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </>
  );
};
