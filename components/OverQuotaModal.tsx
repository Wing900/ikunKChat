import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { useUIState } from '../contexts/UIStateContext';

export const OverQuotaModal: React.FC = () => {
  const { isOverQuotaModalOpen, overQuotaMessage, hideOverQuotaModal } = useUIState();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOverQuotaModalOpen) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOverQuotaModalOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    if (isOverQuotaModalOpen) {
        window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOverQuotaModalOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(hideOverQuotaModal, 300);
  };

  if (!isOverQuotaModalOpen) {
    return null;
  }

  const messageParts = overQuotaMessage.split('\n').filter(part => part.trim() !== '');

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog modal-dialog-md ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col`}>
        <div className="flex items-center justify-center mb-4 flex-shrink-0 text-center">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-yellow-500/20 rounded-full mb-2">
              <Icon icon="sparkles" className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-color)]">{messageParts[0]}</h2>
          </div>
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4 pb-4 text-base text-[var(--text-color-secondary)]">
          <div className="space-y-3">
            {messageParts.slice(1).map((part, index) => (
                <p key={index}>{part}</p>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 pt-4">
          <button
            onClick={handleClose}
            className={'w-full px-3 py-2 text-sm text-white bg-[var(--md-sys-color-primary)] rounded-lg'}
          >
            我明白了
          </button>
        </div>
      </div>
    </>
  );
};
