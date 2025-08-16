import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';

interface UpdateNoticeModalProps {
  versionInfo: {
    version: string;
    releaseDate: string;
    notes: {
      [key: string]: string[];
    };
  };
  onClose: () => void;
}

export const UpdateNoticeModal: React.FC<UpdateNoticeModalProps> = ({ versionInfo, onClose }) => {
  const { t, language } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);

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

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const releaseNotes = versionInfo.notes[language] || versionInfo.notes['en'];

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col max-w-md`}>
        <div className="flex items-center justify-center mb-4 flex-shrink-0 text-center">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-green-500/20 rounded-full mb-2">
              <Icon icon="gift" className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-color)]">{t('updateAvailable')}!</h2>
            <p className="text-sm text-[var(--text-color-secondary)]">Version {versionInfo.version} - {versionInfo.releaseDate}</p>
          </div>
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4 pb-4 text-base">
          <h3 className="font-bold mb-2">{t('releaseNotes')}:</h3>
          <ul className="space-y-2">
            {releaseNotes.map((note, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-shrink-0 pt-4">
          <button 
            onClick={handleClose} 
            className="btn-primary w-full"
          >
            {t('gotIt')}
          </button>
        </div>
      </div>
    </>
  );
};