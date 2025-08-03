import React from 'react';
import { Settings } from '../../types';
import { CustomSelect, SelectOption } from '../CustomSelect';
import { SettingsItem } from '../SettingsItem';
import { Switch } from '../Switch';
import { useLocalization } from '../../contexts/LocalizationContext';
import { formatModelName } from '../../utils/textUtils';

interface AdvancedSettingsProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  visibleIds: Set<string>;
  availableModels: string[];
}

const isApiKeySetByEnv = !!process.env.API_KEY;
const isApiBaseUrlSetByEnv = !!process.env.API_BASE_URL;

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, onSettingsChange, visibleIds, availableModels }) => {
  const { t } = useLocalization();
  const modelOptions: SelectOption[] = availableModels.map(m => ({ value: m, label: formatModelName(m) }));

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const keys = e.target.value.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    onSettingsChange({ apiKey: keys });
  };

  return (
    <>
      {visibleIds.has('apiKey') && (
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
      )}
      {visibleIds.has('apiBaseUrl') && (
        <SettingsItem label={t('apiBaseUrl')} description={t('apiBaseUrlDesc')}>
          <input
            type="text"
            value={settings.apiBaseUrl || ''}
            onChange={e => onSettingsChange({ apiBaseUrl: e.target.value })}
            disabled={isApiBaseUrlSetByEnv}
            placeholder={isApiBaseUrlSetByEnv ? t('apiKeyEnvVar') : "https://generativelanguage.googleapis.com"}
            className="input-glass w-60"
          />
        </SettingsItem>
      )}
      {visibleIds.has('globalSystemPrompt') && (
        <div className="flex flex-col">
            <SettingsItem label={t('globalSystemPrompt')} description={t('globalSystemPromptDesc')}>
              <Switch size="sm" checked={settings.enableGlobalSystemPrompt} onChange={e => onSettingsChange({ enableGlobalSystemPrompt: e.target.checked })} />
            </SettingsItem>
            <div className={`collapsible-section ${settings.enableGlobalSystemPrompt ? 'expanded' : ''}`}>
                <div className="pb-2">
                  <textarea value={settings.globalSystemPrompt} onChange={e => onSettingsChange({ globalSystemPrompt: e.target.value })} className="input-glass w-full" placeholder="Enter a system prompt..." rows={3}/>
                </div>
            </div>
          </div>
      )}
      {visibleIds.has('optimizeFormatting') && (
        <SettingsItem label={t('optimizeFormatting')} description={t('optimizeFormattingDesc')}>
          <Switch size="sm" checked={settings.optimizeFormatting} onChange={e => onSettingsChange({ optimizeFormatting: e.target.checked })} />
        </SettingsItem>
      )}
      {visibleIds.has('thinkDeeper') && (
        <SettingsItem label={t('thinkDeeper')} description={t('thinkDeeperDesc')}>
          <Switch size="sm" checked={settings.thinkDeeper} onChange={e => onSettingsChange({ thinkDeeper: e.target.checked })} />
        </SettingsItem>
      )}
      {visibleIds.has('langDetectModel') && (
        <SettingsItem label={t('langDetectModel')} description={t('langDetectModelDesc')}>
          <CustomSelect options={modelOptions} selectedValue={settings.languageDetectionModel} onSelect={(value) => onSettingsChange({ languageDetectionModel: value })} className="w-48" />
        </SettingsItem>
      )}
    </>
  );
};
