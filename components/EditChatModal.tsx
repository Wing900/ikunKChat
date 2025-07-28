import React, { useState, useEffect } from 'react';
import { ChatSession } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface EditChatModalProps {
  chat: ChatSession;
  onClose: () => void;
  onSave: (id: string, title: string, icon: string) => void;
}

export const EditChatModal: React.FC<EditChatModalProps> = ({ chat, onClose, onSave }) => {
  const { t } = useLocalization();
  const [title, setTitle] = useState(chat.title);
  const [icon, setIcon] = useState(chat.icon || '💬');
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to finish
  };

  const handleSave = () => {
    if (title.trim()) {
      onSave(chat.id, title.trim(), icon);
    }
    handleClose();
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
      <div className={`modal-dialog modal-dialog-sm ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col gap-4`}>
        <h2 className="text-xl font-bold text-[var(--text-color)]">{t('editChat')}</h2>
        
        <div>
          <label className="text-sm font-medium text-[var(--text-color-secondary)] mb-1 block">{t('iconEmoji')}</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="input-glass"
            maxLength={2}
            placeholder="💬"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-color-secondary)] mb-1 block">{t('title')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-glass"
            placeholder="Conversation Title"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button 
            onClick={handleClose}
            className="px-4 py-2 rounded-[var(--radius-2xl)] font-semibold glass-pane border-none text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10"
          >
            {t('cancel')}
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-[var(--radius-2xl)] font-semibold bg-[var(--accent-color)] text-white transition-transform hover:scale-105"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </>
  );
};
