import React, { useState, useEffect } from 'react';
import { Folder } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface FolderActionModalProps {
  folder: Folder | null;
  onClose: () => void;
  onSave: (idOrName: string, nameOrIcon: string, icon?: string) => void;
}

export const FolderActionModal: React.FC<FolderActionModalProps> = ({ folder, onClose, onSave }) => {
  const { t } = useLocalization();
  const [name, setName] = useState(folder?.name || '');
  const [icon, setIcon] = useState(folder?.icon || '📁');
  const [isVisible, setIsVisible] = useState(false);

  const isNew = folder === null;
  const title = isNew ? t('newFolderName') : t('editFolderName');

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSave = () => {
    if (name.trim()) {
      if (isNew) {
        onSave(name.trim(), icon);
      } else {
        onSave(folder.id, name.trim(), icon);
      }
    }
    handleClose();
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
      if (event.key === 'Enter') handleSave();
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
      <div className={`modal-dialog modal-dialog-sm ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col gap-4`}>
        <h2 className="text-xl font-bold text-[var(--text-color)]">{title}</h2>
        
        <div>
          <label className="text-sm font-medium text-[var(--text-color-secondary)] mb-1 block">{t('iconEmoji')}</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="input-glass"
            maxLength={2}
            placeholder="📁"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-color-secondary)] mb-1 block">{t('folderName')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-glass"
            placeholder={t('folderName')}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={handleClose} className="px-4 py-2 rounded-[var(--radius-2xl)] font-semibold glass-pane border-none text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10">
            {t('cancel')}
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-[var(--radius-2xl)] font-semibold bg-[var(--accent-color)] text-white transition-transform hover:scale-105">
            {t('save')}
          </button>
        </div>
      </div>
    </>
  );
};
