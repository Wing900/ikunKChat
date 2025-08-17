import React, { useState, useEffect } from 'react';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';

interface UpdateSettingsProps {
  versionInfo: { version: string } | null;
  updateAvailable: boolean;
  isCheckingUpdate: boolean;
  onClose: () => void;
  onCheckUpdate: () => void;
  onUpdateNow: () => void;
}

export const UpdateSettings: React.FC<UpdateSettingsProps> = ({
  versionInfo,
  updateAvailable,
  isCheckingUpdate,
  onClose,
  onCheckUpdate,
  onUpdateNow
}) => {
  const { t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKeyDown); };
  }, []);

  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 300); };

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog modal-dialog-md ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-4">
          <h2 className="text-xl font-bold text-[var(--text-color)]">{t('update')}</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2">
            <Icon icon="close" className="w-5 h-5"/>
          </button>
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4 pb-4">
          <div className="space-y-4">
            <button
              onClick={onCheckUpdate}
              disabled={isCheckingUpdate}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[var(--accent-color)] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon icon="download" className={`w-5 h-5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span>{isCheckingUpdate ? t('checkingUpdate') : t('checkForUpdate')}</span>
            </button>

            {updateAvailable && (
              <button
                onClick={onUpdateNow}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Icon icon="download" className="w-5 h-5" />
                <span>{t('updateNow')}</span>
              </button>
            )}
            <p className="text-center text-xs text-[var(--text-color-secondary)] mt-4">
              {t('currentVersion')}: {versionInfo?.version || '...'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};