import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Settings } from '../types';
import { Icon } from './Icon';
import { CustomSelect, SelectOption } from './CustomSelect';
import { useLocalization, translations } from '../contexts/LocalizationContext';
import { formatModelName } from '../utils/textUtils';
import { SettingsItem } from './SettingsItem';
import { Switch } from './Switch';

interface SettingsModalProps {
  settings: Settings;
  onClose: () => void;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onExportSettings: () => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  availableModels: string[];
}

const isApiKeySetByEnv = !!process.env.API_KEY;

type SearchableItem = { id: string; texts: string[], section: string };
type SectionVisibility = { [key: string]: boolean };
const sections = ['general', 'behavior', 'advanced', 'data'];

export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const { settings, onClose, onSettingsChange, onExportSettings, onExportAll, onImport, onClearAll, availableModels } = props;
  const { t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const modelOptions: SelectOption[] = availableModels.map(m => ({ value: m, label: formatModelName(m) }));
  const languageOptions: SelectOption[] = [{ value: 'en', label: t('english') }, { value: 'zh', label: t('chinese') }];
  
  const searchableSettings: SearchableItem[] = useMemo(() => [
    // General
    { id: 'language', section: 'general', texts: [t('language'), t('languageDesc'), translations.zh.language, translations.zh.languageDesc] },
    { id: 'theme', section: 'general', texts: [t('theme'), t('themeDesc'), translations.zh.theme, translations.zh.themeDesc] },
    
    // Behavior
    { id: 'autoTitleGeneration', section: 'behavior', texts: [t('autoTitleGeneration'), t('autoTitleGenerationDesc'), translations.zh.autoTitleGeneration, translations.zh.autoTitleGenerationDesc] },
    { id: 'titleGenModel', section: 'behavior', texts: [t('titleGenModel'), t('titleGenModelDesc'), translations.zh.titleGenModel, translations.zh.titleGenModelDesc] },
    { id: 'suggestions', section: 'behavior', texts: [t('suggestions'), t('suggestionsDesc'), translations.zh.suggestions, translations.zh.suggestionsDesc] },
    { id: 'suggestionModel', section: 'behavior', texts: [t('suggestionModel'), t('suggestionModelDesc'), translations.zh.suggestionModel, translations.zh.suggestionModelDesc] },
    { id: 'defaultSearch', section: 'behavior', texts: [t('defaultSearch'), t('defaultSearchDesc'), t('useSearchOptimizerPrompt'), t('useSearchOptimizerPromptDesc'), translations.zh.defaultSearch, translations.zh.defaultSearchDesc, translations.zh.useSearchOptimizerPrompt, translations.zh.useSearchOptimizerPromptDesc] },
    { id: 'showThoughts', section: 'behavior', texts: [t('showThoughts'), t('showThoughtsDesc'), translations.zh.showThoughts, translations.zh.showThoughtsDesc] },

    // Advanced
    { id: 'apiKey', section: 'advanced', texts: [t('apiKey'), t('apiKeyDesc'), translations.zh.apiKey, translations.zh.apiKeyDesc] },
    { id: 'globalSystemPrompt', section: 'advanced', texts: [t('globalSystemPrompt'), t('globalSystemPromptDesc'), translations.zh.globalSystemPrompt, translations.zh.globalSystemPromptDesc] },
    { id: 'optimizeFormatting', section: 'advanced', texts: [t('optimizeFormatting'), t('optimizeFormattingDesc'), translations.zh.optimizeFormatting, translations.zh.optimizeFormattingDesc] },
    { id: 'thinkDeeper', section: 'advanced', texts: [t('thinkDeeper'), t('thinkDeeperDesc'), translations.zh.thinkDeeper, translations.zh.thinkDeeperDesc] },
    { id: 'langDetectModel', section: 'advanced', texts: [t('langDetectModel'), t('langDetectModelDesc'), translations.zh.langDetectModel, translations.zh.langDetectModelDesc] },
    
    // Data
    { id: 'dataManagement', section: 'data', texts: [t('importData'), t('exportSettings'), t('exportData'), t('clearHistory'), translations.zh.importData, translations.zh.exportSettings, translations.zh.exportData, translations.zh.clearHistory] },
  ], [t]);

  const { visibleSettingIds, sectionVisibility } = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    if (!lowerQuery) {
        const allVisible = new Set(searchableSettings.map(s => s.id));
        const allSectionsVisible = sections.reduce((acc, sec) => ({...acc, [sec]: true}), {});
        return { visibleSettingIds: allVisible, sectionVisibility: allSectionsVisible as SectionVisibility };
    }
    
    const visibleIds = new Set<string>();
    const visibleSections = sections.reduce((acc, sec) => ({...acc, [sec]: false}), {});

    searchableSettings.forEach(item => {
        if (item.texts.some(text => text.toLowerCase().includes(lowerQuery))) {
            visibleIds.add(item.id);
            (visibleSections as any)[item.section] = true;
        }
    });

    return { visibleSettingIds: visibleIds, sectionVisibility: visibleSections as SectionVisibility };
  }, [searchQuery, searchableSettings]);


  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 300); };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKeyDown); };
  }, []);
  
  const handleImportClick = () => importFileRef.current?.click();
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) onImport(e.target.files[0]); };
  const handleClear = () => onClearAll();
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const keys = e.target.value
      .split(/[\n,]+/) // Split by newlines or commas
      .map(k => k.trim())
      .filter(Boolean);
    onSettingsChange({ apiKey: keys });
  };

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog modal-dialog-md ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-4">
          <h2 className="text-xl font-bold text-[var(--text-color)]">{t('settings')}</h2>
          <div className="sidebar-search-wrapper max-w-xs">
              <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
              <input type="text" placeholder="Search settings..." className="sidebar-search-input !py-2 !text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2"><Icon icon="close" className="w-5 h-5"/></button>
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4 pb-4">
          {sectionVisibility.general && <h3 className="settings-section-title">{t('general')}</h3>}
          {visibleSettingIds.has('language') && <SettingsItem label={t('language')} description={t('languageDesc')}>
            <CustomSelect options={languageOptions} selectedValue={settings.language} onSelect={(value) => onSettingsChange({ language: value as 'en' | 'zh' })} className="w-36" />
          </SettingsItem>}
          {visibleSettingIds.has('theme') && <SettingsItem label={t('theme')} description={t('themeDesc')}>
             <div className="flex items-center p-1 rounded-full glass-pane">
                <button onClick={() => onSettingsChange({ theme: 'light' })} className={`p-2 rounded-full transition-colors ${settings.theme === 'light' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-white/20'}`}><Icon icon="sun" className="w-5 h-5" /></button>
                <button onClick={() => onSettingsChange({ theme: 'dark' })} className={`p-2 rounded-full transition-colors ${settings.theme === 'dark' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-black/20'}`}><Icon icon="moon" className="w-5 h-5" /></button>
            </div>
          </SettingsItem>}

          {sectionVisibility.behavior && <h3 className="settings-section-title">{t('behavior')}</h3>}
          {visibleSettingIds.has('autoTitleGeneration') && <SettingsItem label={t('autoTitleGeneration')} description={t('autoTitleGenerationDesc')}>
            <Switch size="sm" checked={settings.autoTitleGeneration} onChange={e => onSettingsChange({ autoTitleGeneration: e.target.checked })} />
          </SettingsItem>}
          {visibleSettingIds.has('titleGenModel') && <SettingsItem label={t('titleGenModel')} description={t('titleGenModelDesc')} isDisabled={!settings.autoTitleGeneration}>
            <CustomSelect options={modelOptions} selectedValue={settings.titleGenerationModel} onSelect={(value) => onSettingsChange({ titleGenerationModel: value })} className="w-48" disabled={!settings.autoTitleGeneration}/>
          </SettingsItem>}
           {visibleSettingIds.has('suggestions') && <SettingsItem label={t('suggestions')} description={t('suggestionsDesc')}>
            <Switch size="sm" checked={settings.showSuggestions} onChange={e => onSettingsChange({ showSuggestions: e.target.checked })} />
          </SettingsItem>}
          {visibleSettingIds.has('suggestionModel') && <SettingsItem label={t('suggestionModel')} description={t('suggestionModelDesc')} isDisabled={!settings.showSuggestions}>
            <CustomSelect options={modelOptions} selectedValue={settings.suggestionModel} onSelect={(value) => onSettingsChange({ suggestionModel: value })} className="w-48" disabled={!settings.showSuggestions} />
          </SettingsItem>}
          {visibleSettingIds.has('defaultSearch') && <div className="flex flex-col">
            <SettingsItem label={t('defaultSearch')} description={t('defaultSearchDesc')}>
                <Switch size="sm" checked={settings.defaultSearch} onChange={e => onSettingsChange({ defaultSearch: e.target.checked })} />
            </SettingsItem>
            <div className={`collapsible-section ${settings.defaultSearch ? 'expanded' : ''}`}>
                <div className="pb-2 pl-4">
                  <SettingsItem label={t('useSearchOptimizerPrompt')} description={t('useSearchOptimizerPromptDesc')} isDisabled={!settings.defaultSearch} className="border-l-2 border-[var(--glass-border)] pl-4 -ml-4">
                    <Switch size="sm" checked={settings.useSearchOptimizerPrompt} onChange={e => onSettingsChange({ useSearchOptimizerPrompt: e.target.checked })} disabled={!settings.defaultSearch} />
                  </SettingsItem>
                </div>
            </div>
          </div>}
          {visibleSettingIds.has('showThoughts') && <SettingsItem label={t('showThoughts')} description={t('showThoughtsDesc')}>
            <Switch size="sm" checked={settings.showThoughts} onChange={e => onSettingsChange({ showThoughts: e.target.checked })} />
          </SettingsItem>}
          
          {sectionVisibility.advanced && <h3 className="settings-section-title">{t('advanced')}</h3>}
          {visibleSettingIds.has('apiKey') && <SettingsItem label={t('apiKey')} description={t('apiKeyDesc')}>
             <textarea 
                value={(settings.apiKey || []).join('\n')}
                onChange={handleApiKeyChange}
                disabled={isApiKeySetByEnv}
                placeholder={isApiKeySetByEnv ? t('apiKeyEnvVar') : t('apiKeyPlaceholder')}
                className="input-glass max-w-60 min-h-24"
                rows={3}
             />
          </SettingsItem>}
          {visibleSettingIds.has('globalSystemPrompt') && <div className="flex flex-col">
              <SettingsItem label={t('globalSystemPrompt')} description={t('globalSystemPromptDesc')}>
                <Switch size="sm" checked={settings.enableGlobalSystemPrompt} onChange={e => onSettingsChange({ enableGlobalSystemPrompt: e.target.checked })} />
              </SettingsItem>
              <div className={`collapsible-section ${settings.enableGlobalSystemPrompt ? 'expanded' : ''}`}>
                  <div className="pb-2">
                    <textarea 
                      value={settings.globalSystemPrompt}
                      onChange={e => onSettingsChange({ globalSystemPrompt: e.target.value })}
                      className="input-glass w-full"
                      placeholder="Enter a system prompt..."
                      rows={3}
                    />
                  </div>
              </div>
            </div>}
          {visibleSettingIds.has('optimizeFormatting') && <SettingsItem label={t('optimizeFormatting')} description={t('optimizeFormattingDesc')}>
            <Switch size="sm" checked={settings.optimizeFormatting} onChange={e => onSettingsChange({ optimizeFormatting: e.target.checked })} />
          </SettingsItem>}
          {visibleSettingIds.has('thinkDeeper') && <SettingsItem label={t('thinkDeeper')} description={t('thinkDeeperDesc')}>
            <Switch size="sm" checked={settings.thinkDeeper} onChange={e => onSettingsChange({ thinkDeeper: e.target.checked })} />
          </SettingsItem>}
          {visibleSettingIds.has('langDetectModel') && <SettingsItem label={t('langDetectModel')} description={t('langDetectModelDesc')}>
            <CustomSelect options={modelOptions} selectedValue={settings.languageDetectionModel} onSelect={(value) => onSettingsChange({ languageDetectionModel: value })} className="w-48" />
          </SettingsItem>}
          
          {sectionVisibility.data && <h3 className="settings-section-title">{t('dataManagement')}</h3>}
          {visibleSettingIds.has('dataManagement') && <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={handleImportClick} className="btn-outline flex items-center justify-center gap-2"><Icon icon="upload" className="w-4 h-4"/>{t('importData')}</button>
              <input type="file" ref={importFileRef} accept=".json" onChange={handleFileImport} className="hidden" />
              <button onClick={onExportSettings} className="btn-outline flex items-center justify-center gap-2"><Icon icon="download" className="w-4 h-4"/>{t('exportSettings')}</button>
              <button onClick={onExportAll} className="btn-outline flex items-center justify-center gap-2"><Icon icon="download" className="w-4 h-4"/>{t('exportData')}</button>
              <button onClick={handleClear} className="btn-outline btn-danger flex items-center justify-center gap-2"><Icon icon="delete" className="w-4 h-4"/>{t('clearHistory')}</button>
           </div>}
        </div>
      </div>
    </>
  );
};
