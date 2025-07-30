import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, TranslationHistoryItem } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import { ComboBox } from './ComboBox';
import { supportedLanguages } from '../data/languages';
import { detectLanguage, translateText } from '../services/geminiService';
import { readAloud } from '../services/ttsService';
import { TranslationHistoryModal } from './TranslationHistoryModal';
import { loadCustomLanguages, saveCustomLanguages } from '../services/storageService';

interface TranslateViewProps {
  settings: Settings;
  onClose: () => void;
  history: TranslationHistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<TranslationHistoryItem[]>>;
}

const TranslateView: React.FC<TranslateViewProps> = ({ settings, onClose, history, setHistory }) => {
  const { t } = useLocalization();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [mode, setMode] = useState<'natural' | 'literal'>('natural');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [customLanguages, setCustomLanguages] = useState<{code: string, name: string}[]>([]);

  useEffect(() => {
    setCustomLanguages(loadCustomLanguages());
  }, []);

  useEffect(() => {
    saveCustomLanguages(customLanguages);
  }, [customLanguages]);

  const allLanguageOptions = useMemo(() => {
    const combined = [...supportedLanguages, ...customLanguages];
    const uniqueCodes = new Set<string>();
    return combined.filter(lang => {
        if (uniqueCodes.has(lang.code)) return false;
        uniqueCodes.add(lang.code);
        return true;
    }).map(l => ({ value: l.code, label: t(l.code as any) || l.name }));
  }, [customLanguages, t]);

  const sourceLangOptions = useMemo(() => allLanguageOptions, [allLanguageOptions]);
  const targetLangOptions = useMemo(() => allLanguageOptions.filter(l => l.value !== 'auto'), [allLanguageOptions]);

  const handleTranslate = async () => {
    if (!sourceText.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setTranslatedText('');

    try {
        const apiKeys = settings.apiKey && settings.apiKey.length > 0
            ? settings.apiKey
            : (process.env.API_KEY ? [process.env.API_KEY] : []);
        
        let finalSourceLang = sourceLang;
        if (sourceLang === 'auto') {
            finalSourceLang = await detectLanguage(apiKeys, settings.languageDetectionModel, sourceText);
        }

        const result = await translateText(apiKeys, settings.defaultModel, sourceText, finalSourceLang, targetLang, mode);
        setTranslatedText(result);
        
        const newHistoryItem: TranslationHistoryItem = { id: crypto.randomUUID(), sourceLang, targetLang, sourceText, translatedText: result, timestamp: Date.now(), mode };
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));

    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLanguageChange = (value: string, type: 'source' | 'target') => {
    const isExisting = allLanguageOptions.some(opt => opt.value === value || opt.label === value);
    
    if (!isExisting) { // It's a new custom language
        const name = value.trim();
        if (!name) return;
        const code = name.toLowerCase().replace(/\s+/g, '-');
        
        // Add to custom list if it doesn't already exist
        if (!allLanguageOptions.some(opt => opt.value === code)) {
            setCustomLanguages(prev => [...prev, { code, name }]);
        }

        if (type === 'source') setSourceLang(code);
        else setTargetLang(code);
    } else { // It's an existing language
        // Find by value first, then by label
        const selectedOption = allLanguageOptions.find(opt => opt.value === value) || allLanguageOptions.find(opt => opt.label === value);
        if (selectedOption) {
            if (type === 'source') setSourceLang(selectedOption.value);
            else setTargetLang(selectedOption.value);
        }
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto' || targetLang === 'auto') return;
    const tempSource = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempSource);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };
  
  const handleHistoryClick = (item: TranslationHistoryItem) => {
      setSourceLang(item.sourceLang);
      setTargetLang(item.targetLang);
      setSourceText(item.sourceText);
      setTranslatedText(item.translatedText);
      setMode(item.mode);
      setIsHistoryOpen(false);
  }

  const handleRead = async (text: string, langCode: string) => {
    if (!text.trim()) return;
    let langToRead = langCode;
    if (langCode === 'auto') {
        try {
            const apiKeys = settings.apiKey || [];
             if (apiKeys.length === 0 && !process.env.API_KEY) {
                throw new Error("API key not set.");
            }
            langToRead = await detectLanguage(apiKeys, settings.languageDetectionModel, text);
        } catch(e) {
            alert(`Could not auto-detect language: ${(e as Error).message}. Please select a language manually.`);
            return;
        }
    }
    readAloud(text, langToRead);
  };

  const handlePaste = async () => {
      try {
          const text = await navigator.clipboard.readText();
          setSourceText(text);
      } catch (err) {
          console.error('Failed to read clipboard contents: ', err);
      }
  };

  return (
    <main className="glass-pane rounded-[var(--radius-2xl)] flex flex-col h-full overflow-hidden relative p-4 md:p-6">
      <header className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-[var(--text-color)]">{t('translator')}</h2>
         <div className="flex items-center gap-2">
            <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('translationHistory')} data-tooltip-placement="bottom"><Icon icon="history" className="w-5 h-5"/></button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><Icon icon="close" className="w-5 h-5"/></button>
         </div>
      </header>
      <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className='flex items-center justify-center gap-2'>
              <ComboBox options={sourceLangOptions} value={sourceLang} onSelect={(val) => handleLanguageChange(val, 'source')} allowCustom className="flex-1"/>
              <button onClick={handleSwapLanguages} disabled={sourceLang === 'auto' || targetLang === 'auto'} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" data-tooltip={t('swapLanguages')} data-tooltip-placement="top"><Icon icon="swap-horizontal" className="w-5 h-5"/></button>
              <ComboBox options={targetLangOptions} value={targetLang} onSelect={(val) => handleLanguageChange(val, 'target')} allowCustom className="flex-1"/>
          </div>
          <div className="p-1 rounded-full glass-pane flex items-center self-center">
            <button onClick={() => setMode('natural')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'natural' ? 'bg-[var(--accent-color)] text-white' : ''}`}>{t('natural')}</button>
            <button onClick={() => setMode('literal')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'literal' ? 'bg-[var(--accent-color)] text-white' : ''}`}>{t('literal')}</button>
          </div>
          <div className="flex flex-col gap-4 flex-grow min-h-[200px]">
            <div className="flex-1 flex flex-col rounded-[var(--radius-2xl)] glass-pane p-1">
                <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder={t('enterText')} className="bg-transparent w-full h-full flex-grow resize-none p-3 focus:outline-none"/>
                <div className="flex items-center gap-2 p-2">
                    <button onClick={handlePaste} className="action-btn" data-tooltip={t('paste')}><Icon icon="clipboard" className="w-4 h-4"/></button>
                    <button onClick={() => handleRead(sourceText, sourceLang)} className="action-btn" data-tooltip={t('read')}><Icon icon="volume-2" className="w-4 h-4"/></button>
                    <button onClick={() => setSourceText('')} className="action-btn ml-auto" data-tooltip={t('clear')}><Icon icon="delete" className="w-4 h-4"/></button>
                </div>
            </div>
            <div className="flex-1 flex flex-col rounded-[var(--radius-2xl)] glass-pane p-1">
                 <textarea value={isLoading ? t('translating') : translatedText} readOnly placeholder="..." className="bg-transparent w-full h-full flex-grow resize-none p-3 focus:outline-none"/>
                <div className="flex items-center gap-2 p-2">
                     <button onClick={() => navigator.clipboard.writeText(translatedText)} className="action-btn" data-tooltip={t('copy')}><Icon icon="copy" className="w-4 h-4"/></button>
                    <button onClick={() => handleRead(translatedText, targetLang)} className="action-btn" data-tooltip={t('read')}><Icon icon="volume-2" className="w-4 h-4"/></button>
                    <button onClick={() => setTranslatedText('')} className="action-btn ml-auto" data-tooltip={t('clear')}><Icon icon="delete" className="w-4 h-4"/></button>
                </div>
            </div>
          </div>
          <button onClick={handleTranslate} disabled={isLoading || !sourceText.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-lg font-semibold bg-[var(--accent-color)] text-white rounded-[var(--radius-2xl)] transition-transform hover:scale-105 active:scale-100 disabled:opacity-50">
            {isLoading ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <Icon icon="translate-logo" className="w-6 h-6"/>}
            <span>{isLoading ? t('translating') : t('translate')}</span>
          </button>
        </div>
        <div className="w-full md:w-1/3 flex-col min-h-0 hidden md:flex">
          <h3 className="text-lg font-bold mb-2">{t('translationHistory')}</h3>
           <div className="flex-grow overflow-y-auto -mr-4 pr-4">
              {history.length > 0 ? history.map(item => (
                  <div key={item.id} onClick={() => handleHistoryClick(item)} className="p-3 rounded-[var(--radius-2xl)] mb-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-[var(--glass-border)] transition-colors">
                      <p className="font-semibold text-sm truncate">{item.sourceText}</p>
                      <p className="text-sm text-[var(--text-color-secondary)] truncate">{item.translatedText}</p>
                  </div>
              )) : (
                 <div className="flex items-center justify-center h-full text-center text-[var(--text-color-secondary)]">
                     <p>Your recent translations will appear here.</p>
                 </div>
              )}
           </div>
        </div>
      </div>
      {isHistoryOpen && <TranslationHistoryModal history={history} onSelect={handleHistoryClick} onClear={() => setHistory([])} onClose={() => setIsHistoryOpen(false)} />}
    </main>
  );
};

export default TranslateView;