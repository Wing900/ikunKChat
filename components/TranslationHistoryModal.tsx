import React, { useState, useEffect } from 'react';
import { TranslationHistoryItem } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';

interface TranslationHistoryModalProps {
  history: TranslationHistoryItem[];
  onClose: () => void;
  onSelect: (item: TranslationHistoryItem) => void;
  onClear: () => void;
}

export const TranslationHistoryModal: React.FC<TranslationHistoryModalProps> = ({ history, onClose, onSelect, onClear }) => {
  const { t } = useLocalization();
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
      <div className={`modal-dialog modal-dialog-lg ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--text-color)]">{t('translationHistory')}</h2>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
                <button onClick={onClear} className="action-btn danger" data-tooltip={t('clear')}><Icon icon="delete" className="w-4 h-4"/></button>
            )}
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2"><Icon icon="close" className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4">
            {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {history.map(item => (
                        <div key={item.id} onClick={() => onSelect(item)} className="p-3 rounded-[var(--radius-2xl)] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-[var(--glass-border)] transition-colors">
                            <p className="font-semibold text-sm truncate">{item.sourceText}</p>
                            <p className="text-sm text-[var(--text-color-secondary)] truncate">{item.translatedText}</p>
                            <div className="text-xs text-[var(--text-color-secondary)] mt-2 opacity-75">
                                {t(item.sourceLang as any)} -&gt; {t(item.targetLang as any)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-color-secondary)]">
                    <Icon icon="history" className="w-16 h-16 opacity-50 mb-4" />
                    <p>Your recent translations will appear here.</p>
                </div>
            )}
        </div>
      </div>
    </>
  );
};
