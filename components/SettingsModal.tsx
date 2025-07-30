import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../types';
import { Icon } from './Icon';
import { CustomSelect, SelectOption } from './CustomSelect';
import { useLocalization } from '../contexts/LocalizationContext';
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

export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const { settings, onClose, onSettingsChange, onExportSettings, onExportAll, onImport, onClearAll, availableModels } = props;
  const { t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const modelOptions: SelectOption[] = availableModels.map(m => ({ value: m, label: formatModelName(m) }));
  const languageOptions: SelectOption[] = [{ value: 'en', label: t('english') }, { value: 'zh', label: t('chinese') }];

  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 300); };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKeyDown); };
  }, []);
  
  const handleImportClick = () => importFileRef.current?.click();
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) onImport(e.target.files[0]); };
  const handleClear = () => { if (window.confirm(t('clearHistoryConfirm'))) { onClearAll(); } };
  
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
      <div className={`modal-dialog modal-dialog-md ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--text-color)]">{t('settings')}</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2"><Icon icon="close" className="w-5 h-5"/></button>
        </div>
        
        <div className="flex-grow min-h-0">
          <h3 className="settings-section-title">{t('general')}</h3>
          <SettingsItem label={t('language')} description={t('languageDesc')}>
            <CustomSelect options={languageOptions} selectedValue={settings.language} onSelect={(value) => onSettingsChange({ language: value as 'en' | 'zh' })} className="w-36" />
          </SettingsItem>
          
          <h3 className="settings-section-title">{t('appearance')}</h3>
          <SettingsItem label={t('theme')} description={t('themeDesc')}>
             <div className="flex items-center p-1 rounded-full glass-pane">
                <button onClick={() => onSettingsChange({ theme: 'light' })} className={`p-2 rounded-full transition-colors ${settings.theme === 'light' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-white/20'}`}><Icon icon="sun" className="w-5 h-5" /></button>
                <button onClick={() => onSettingsChange({ theme: 'dark' })} className={`p-2 rounded-full transition-colors ${settings.theme === 'dark' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-black/20'}`}><Icon icon="moon" className="w-5 h-5" /></button>
            </div>
          </SettingsItem>
          
          <h3 className="settings-section-title">{t('model')}</h3>
          <SettingsItem label={t('apiKey')} description={t('apiKeyDesc')}>
             <textarea 
                value={(settings.apiKey || []).join('\n')}
                onChange={handleApiKeyChange}
                disabled={isApiKeySetByEnv}
                placeholder={isApiKeySetByEnv ? t('apiKeyEnvVar') : t('apiKeyPlaceholder')}
                className="input-glass max-w-60 min-h-24"
                rows={3}
             />
          </SettingsItem>
          <SettingsItem label={t('optimizeFormatting')} description={t('optimizeFormattingDesc')}>
            <Switch size="sm" checked={settings.optimizeFormatting} onChange={e => onSettingsChange({ optimizeFormatting: e.target.checked })} />
          </SettingsItem>
          <SettingsItem label={t('thinkDeeper')} description={t('thinkDeeperDesc')}>
            <Switch size="sm" checked={settings.thinkDeeper} onChange={e => onSettingsChange({ thinkDeeper: e.target.checked })} />
          </SettingsItem>
          <SettingsItem label={t('showThoughts')} description={t('showThoughtsDesc')}>
            <Switch size="sm" checked={settings.showThoughts} onChange={e => onSettingsChange({ showThoughts: e.target.checked })} />
          </SettingsItem>
           <div className="flex flex-col">
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
            </div>
          <SettingsItem label={t('defaultSearch')} description={t('defaultSearchDesc')}>
            <Switch size="sm" checked={settings.defaultSearch} onChange={e => onSettingsChange({ defaultSearch: e.target.checked })} />
          </SettingsItem>
          <SettingsItem label={t('autoTitleGeneration')} description={t('autoTitleGenerationDesc')}>
            <Switch size="sm" checked={settings.autoTitleGeneration} onChange={e => onSettingsChange({ autoTitleGeneration: e.target.checked })} />
          </SettingsItem>
          <SettingsItem label={t('titleGenModel')} description={t('titleGenModelDesc')} isDisabled={!settings.autoTitleGeneration}>
            <CustomSelect options={modelOptions} selectedValue={settings.titleGenerationModel} onSelect={(value) => onSettingsChange({ titleGenerationModel: value })} className="w-48" disabled={!settings.autoTitleGeneration}/>
          </SettingsItem>
          <SettingsItem label={t('suggestions')} description={t('suggestionsDesc')}>
            <Switch size="sm" checked={settings.showSuggestions} onChange={e => onSettingsChange({ showSuggestions: e.target.checked })} />
          </SettingsItem>
          <SettingsItem label={t('suggestionModel')} description={t('suggestionModelDesc')} isDisabled={!settings.showSuggestions}>
            <CustomSelect options={modelOptions} selectedValue={settings.suggestionModel} onSelect={(value) => onSettingsChange({ suggestionModel: value })} className="w-48" disabled={!settings.showSuggestions} />
          </SettingsItem>
          <SettingsItem label={t('personaBuilderModel')} description={t('personaBuilderModelDesc')}>
            <CustomSelect options={modelOptions} selectedValue={settings.personaBuilderModel} onSelect={(value) => onSettingsChange({ personaBuilderModel: value })} className="w-48" />
          </SettingsItem>
          
          <h3 className="settings-section-title">{t('dataManagement')}</h3>
           <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={handleImportClick} className="btn-outline flex items-center justify-center gap-2"><Icon icon="upload" className="w-4 h-4"/>{t('importData')}</button>
              <input type="file" ref={importFileRef} accept=".json" onChange={handleFileImport} className="hidden" />
              <button onClick={onExportSettings} className="btn-outline flex items-center justify-center gap-2"><Icon icon="download" className="w-4 h-4"/>{t('exportSettings')}</button>
              <button onClick={onExportAll} className="btn-outline flex items-center justify-center gap-2"><Icon icon="download" className="w-4 h-4"/>{t('exportData')}</button>
              <button onClick={handleClear} className="btn-outline btn-danger flex items-center justify-center gap-2"><Icon icon="delete" className="w-4 h-4"/>{t('clearHistory')}</button>
           </div>
        </div>
      </div>
    </>
  );
};