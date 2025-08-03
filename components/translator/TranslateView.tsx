import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, TranslationHistoryItem } from '../../types';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useToast } from '../../contexts/ToastContext';
import { ComboBox } from '../ComboBox';
import { supportedLanguages as defaultLanguages } from '../../data/supportedLanguages';
import { detectLanguage, translateText } from '../../services/geminiService';
import { readAloud } from '../../services/ttsService';
import { TranslationHistoryModal } from './TranslationHistoryModal';
import { loadCustomLanguages, saveCustomLanguages } from '../../services/storageService';
import { TranslationBox } from './TranslationBox';

interface TranslateViewProps {
  settings: Settings;
  onClose: () => void;
  history: TranslationHistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<TranslationHistoryItem[]>>;
}

const TranslateView: React.FC<TranslateViewProps> = ({ settings, onClose, history, setHistory }) => {
  const { t } = useLocalization();
  const { addToast } = useToast();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [mode, setMode] = useState<'natural' | 'literal'>('natural');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [customLanguages, setCustomLanguages] = useState<{code: string, name: string}[]>([]);

  useEffect(() => { setCustomLanguages(loadCustomLanguages()); }, []);
  useEffect(() => { saveCustomLanguages(customLanguages); }, [customLanguages]);

  const allLanguageOptions = useMemo(() => {
    const combined = [...defaultLanguages, ...customLanguages];
    const uniqueCodes = new Set<string>();
    return combined.filter(l => !uniqueCodes.has(l.code) && uniqueCodes.add(l.code)).map(l => ({ value: l.code, label: t(l.code as any) || l.name }));
  }, [customLanguages, t]);

  const sourceLangOptions = useMemo(() => allLanguageOptions, [allLanguageOptions]);
  const targetLangOptions = useMemo(() => allLanguageOptions.filter(l => l.value !== 'auto'), [allLanguageOptions]);

  const handleTranslate = async () => {
    if (!sourceText.trim() || isLoading) return;
    setIsLoading(true);
    setTranslatedText('');

    try {
        const apiKeys = settings.apiKey?.length ? settings.apiKey : (process.env.API_KEY ? [process.env.API_KEY] : []);
        if (apiKeys.length === 0) throw new Error("API key not configured in Settings.");
        
        let finalSourceLang = sourceLang === 'auto' ? await detectLanguage(apiKeys, settings.languageDetectionModel, sourceText, settings) : sourceLang;
        const result = await translateText(apiKeys, settings.defaultModel, sourceText, finalSourceLang, targetLang, mode, settings);
        setTranslatedText(result);
        
        const newHistoryItem: TranslationHistoryItem = { id: crypto.randomUUID(), sourceLang, targetLang, sourceText, translatedText: result, timestamp: Date.now(), mode };
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
    } catch (e: any) {
      addToast(e.message || "An unknown error occurred during translation.", 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLanguageChange = (value: string, type: 'source' | 'target') => {
    const isExisting = allLanguageOptions.some(opt => opt.value === value || opt.label === value);
    if (!isExisting) {
        const name = value.trim();
        if (!name) return;
        const code = name.toLowerCase().replace(/\s+/g, '-');
        if (!allLanguageOptions.some(opt => opt.value === code)) setCustomLanguages(prev => [...prev, { code, name }]);
        if (type === 'source') setSourceLang(code); else setTargetLang(code);
    } else {
        const selectedOption = allLanguageOptions.find(opt => opt.value === value || opt.label === value);
        if (selectedOption) {
            if (type === 'source') setSourceLang(selectedOption.value); else setTargetLang(selectedOption.value);
        }
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto' || targetLang === 'auto') return;
    setSourceLang(targetLang); setTargetLang(sourceLang);
    setSourceText(translatedText); setTranslatedText(sourceText);
  };
  
  const handleHistoryModalClose = (item: TranslationHistoryItem | null) => {
      setIsHistoryOpen(false);
      if (item) {
        setSourceLang(item.sourceLang); setTargetLang(item.targetLang);
        setSourceText(item.sourceText); setTranslatedText(item.translatedText);
        setMode(item.mode);
      }
  }
  
  const handleRead = async (text: string, langCode: string) => {
    if (!text.trim()) return;
    try {
        const apiKeys = settings.apiKey || [];
        if (apiKeys.length === 0 && !process.env.API_KEY) throw new Error("API key not set.");
        const langToRead = langCode === 'auto' ? await detectLanguage(apiKeys, settings.languageDetectionModel, text, settings) : langCode;
        await readAloud(text, langToRead);
    } catch(e) {
        addToast(`Could not read aloud: ${(e as Error).message}.`, 'error');
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
      <div className="flex-grow flex flex-col gap-4 min-h-0">
          <div className='flex items-center justify-center gap-2'>
              <ComboBox options={sourceLangOptions} value={sourceLang} onSelect={(val) => handleLanguageChange(val, 'source')} allowCustom className="flex-1"/>
              <button onClick={handleSwapLanguages} disabled={sourceLang === 'auto'} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" data-tooltip={t('swapLanguages')} data-tooltip-placement="top"><Icon icon="swap-horizontal" className="w-5 h-5"/></button>
              <ComboBox options={targetLangOptions} value={targetLang} onSelect={(val) => handleLanguageChange(val, 'target')} allowCustom className="flex-1"/>
          </div>
          <div className="p-1 rounded-full glass-pane flex items-center self-center">
            <button onClick={() => setMode('natural')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'natural' ? 'bg-[var(--accent-color)] text-white' : ''}`}>{t('natural')}</button>
            <button onClick={() => setMode('literal')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'literal' ? 'bg-[var(--accent-color)] text-white' : ''}`}>{t('literal')}</button>
          </div>
          <div className="flex flex-col md:flex-row gap-4 flex-grow min-h-[200px]">
              <TranslationBox text={sourceText} setText={setSourceText} onRead={() => handleRead(sourceText, sourceLang)} placeholder={t('enterText')} isSource />
              <TranslationBox text={isLoading ? t('translating') + '...' : translatedText} onRead={() => handleRead(translatedText, targetLang)} setText={setTranslatedText} readOnly />
          </div>
          <button onClick={handleTranslate} disabled={isLoading || !sourceText.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-lg font-semibold bg-[var(--accent-color)] text-white rounded-[var(--radius-2xl)] transition-transform hover:scale-105 active:scale-100 disabled:opacity-50">
            {isLoading ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <Icon icon="translate-logo" className="w-6 h-6"/>}
            <span>{isLoading ? t('translating') : t('translate')}</span>
          </button>
      </div>
      {isHistoryOpen && <TranslationHistoryModal history={history} onClear={() => setHistory([])} onDeleteItem={(id) => setHistory(p => p.filter(i => i.id !== id))} onClose={handleHistoryModalClose} />}
    </main>
  );
};

export default TranslateView;