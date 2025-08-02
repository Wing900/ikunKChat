import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TranslationHistoryItem } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';

interface TranslationHistoryModalProps {
  history: TranslationHistoryItem[];
  onClose: (item: TranslationHistoryItem | null) => void;
  onClear: () => void;
  onDeleteItem: (id: string) => void;
}

export const TranslationHistoryModal: React.FC<TranslationHistoryModalProps> = ({ history, onClose, onClear, onDeleteItem }) => {
  const { t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isClearing, setIsClearing] = useState(false);

  const filteredHistory = useMemo(() => {
      const hasQuery = !!searchQuery.trim();
      if (!hasQuery) return history.map(item => ({...item, isHiding: false}));

      const lowerQuery = searchQuery.toLowerCase();
      return history.map(item => ({
        ...item,
        isHiding: !(item.sourceText.toLowerCase().includes(lowerQuery) || item.translatedText.toLowerCase().includes(lowerQuery))
      }));
  }, [history, searchQuery]);

  const hasVisibleHistory = useMemo(() => filteredHistory.some(item => !item.isHiding), [filteredHistory]);

  const handleClose = useCallback((item: TranslationHistoryItem | null = null) => {
    setIsVisible(false);
    setTimeout(() => onClose(item), 300);
  }, [onClose]);
  
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
  }, [handleClose]);

  const handleClearClick = () => {
    if (history.length === 0 || isClearing) return;
    setIsClearing(true);
    const animationTime = Math.min(1000, history.length * 30 + 350);
    setTimeout(() => {
        onClear();
        setIsClearing(false);
    }, animationTime);
  };

  const handleDeleteItemClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeletingIds(prev => new Set(prev).add(id));
      setTimeout(() => {
          onDeleteItem(id);
      }, 350);
  };

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={() => handleClose()}></div>
      <div className={`modal-dialog modal-dialog-lg ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-4">
          <h2 className="text-xl font-bold text-[var(--text-color)]">{t('translationHistory')}</h2>
          <div className="flex items-center gap-2">
            <div className="sidebar-search-wrapper max-w-xs">
              <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
              <input type="text" placeholder={t('searchHistory')} className="sidebar-search-input !py-2 !text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            {history.length > 0 && (
                <button onClick={handleClearClick} className="action-btn danger" data-tooltip={t('clearHistory')}><Icon icon="delete" className="w-4 h-4"/></button>
            )}
            <button onClick={() => handleClose()} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2"><Icon icon="close" className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4">
            {hasVisibleHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredHistory.map((item, index) => (
                        <div 
                            key={item.id} 
                            onClick={() => !(deletingIds.has(item.id) || isClearing) && handleClose(item)}
                            className={`group flex items-center gap-2 p-3 rounded-[var(--radius-2xl)] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-[var(--glass-border)] transition-all duration-200 translation-history-item ${item.isHiding ? 'hiding' : ''} ${(deletingIds.has(item.id) || isClearing) ? 'leaving' : ''}`}
                            style={{ animationDelay: isClearing ? `${index * 30}ms` : '0ms' }}
                        >
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-sm truncate">{item.sourceText}</p>
                                <p className="text-sm text-[var(--text-color-secondary)] truncate">{item.translatedText}</p>
                                <div className="text-xs text-[var(--text-color-secondary)] mt-2 opacity-75">
                                    {t((item.sourceLang || 'auto') as any) || item.sourceLang} -&gt; {t(item.targetLang as any) || item.targetLang}
                                </div>
                            </div>
                             <button 
                                onClick={(e) => handleDeleteItemClick(e, item.id)} 
                                className="action-btn danger ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                aria-label="Delete entry"
                                data-tooltip={t('delete')}
                                data-tooltip-placement="left"
                            >
                                <Icon icon="delete" className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-color-secondary)]">
                    <Icon icon="history" className="w-16 h-16 opacity-50 mb-4" />
                    <h3 className="text-xl font-semibold text-[var(--text-color)]">{searchQuery ? 'No Results Found' : 'No Translation History'}</h3>
                    <p>{searchQuery ? 'Try a different search term.' : 'Your recent translations will appear here.'}</p>
                </div>
            )}
        </div>
      </div>
    </>
  );
};