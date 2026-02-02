import React from 'react';
import { Settings } from '../../types';
import { CustomSelect, SelectOption } from '../CustomSelect';
import { SettingsItem } from '../SettingsItem';
import { Switch } from '../Switch';
import { useLocalization } from '../../contexts/LocalizationContext';
import { formatModelName } from '../../utils/textUtils';
import { isApiKeySetByEnv, isApiBaseUrlSetByEnv } from '../../hooks/useSettings';

interface AdvancedSettingsProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  visibleIds: Set<string>;
  availableModels: string[];
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, onSettingsChange, visibleIds, availableModels }) => {
  const { t } = useLocalization();
  const modelOptions: SelectOption[] = availableModels.map(m => ({ value: m, label: formatModelName(m) }));

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const keys = e.target.value.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    onSettingsChange({ apiKey: keys });
  };

  const handleCustomModelsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingsChange({ customModels: e.target.value });
  };

  const llmProviderOptions: SelectOption[] = [
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'openai', label: 'OpenAI' },
  ];

  return (
    <>
      {visibleIds.has('llmProvider') && (
        <SettingsItem label={t('llmProvider')} description={t('llmProviderDesc')}>
          <CustomSelect
            options={llmProviderOptions}
            value={settings.llmProvider || 'gemini'}
            onChange={(value) => onSettingsChange({ llmProvider: value as 'gemini' | 'openai' })}
            className="w-60"
          />
        </SettingsItem>
      )}

      {/* 使用自定义 API 配置的开关（同时控制 URL 和 Key） */}
      {(isApiBaseUrlSetByEnv || isApiKeySetByEnv) && (
        <SettingsItem label={t('useCustomApi')} description={t('useCustomApiDesc')}>
          <Switch
            size="sm"
            checked={settings.useCustomApi || false}
            onChange={e => onSettingsChange({ useCustomApi: e.target.checked })}
          />
        </SettingsItem>
      )}

      {/* API Base URL */}
      {visibleIds.has('apiBaseUrl') && (
        <SettingsItem label={t('apiBaseUrl')} description={t('apiBaseUrlDesc')}>
          <input
            type="text"
            value={(isApiBaseUrlSetByEnv || isApiKeySetByEnv) && !settings.useCustomApi ? '' : (settings.apiBaseUrl || '')}
            onChange={e => onSettingsChange({ apiBaseUrl: e.target.value })}
            disabled={(isApiBaseUrlSetByEnv || isApiKeySetByEnv) && !settings.useCustomApi}
            placeholder={
              (isApiBaseUrlSetByEnv || isApiKeySetByEnv) && !settings.useCustomApi
                ? t('apiKeyEnvVar')
                : settings.llmProvider === 'openai'
                  ? 'https://api.openai.com'
                  : 'https://generativelanguage.googleapis.com'
            }
            className="input-glass w-60"
          />
        </SettingsItem>
      )}

      {/* API Key */}
      {visibleIds.has('apiKey') && (
        <SettingsItem label={t('apiKey')} description={t('apiKeyDesc')}>
           <textarea
              value={(isApiBaseUrlSetByEnv || isApiKeySetByEnv) && !settings.useCustomApi ? '' : (settings.apiKey || []).join('\n')}
              onChange={handleApiKeyChange}
              disabled={(isApiBaseUrlSetByEnv || isApiKeySetByEnv) && !settings.useCustomApi}
              placeholder={(isApiBaseUrlSetByEnv || isApiKeySetByEnv) && !settings.useCustomApi ? t('apiKeyEnvVar') : t('apiKeyPlaceholder')}
              className="input-glass max-w-60 min-h-24"
              rows={3}
           />
        </SettingsItem>
      )}

      {/* 自定义模型列表 */}
      {visibleIds.has('customModels') && (
        <SettingsItem label={t('customModels')} description={t('customModelsDesc')}>
           <textarea
              value={settings.customModels || ''}
              onChange={handleCustomModelsChange}
              placeholder={t('customModelsPlaceholder')}
              className="input-glass max-w-60 min-h-24"
              rows={3}
           />
        </SettingsItem>
      )}

      {visibleIds.has('temperature') && (
        <SettingsItem label={t('temperature')} description={t('temperatureDesc')}>
          <div className="flex items-center gap-4 w-60">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={e => onSettingsChange({ temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <span className="font-mono text-sm">{settings.temperature.toFixed(1)}</span>
          </div>
        </SettingsItem>
      )}
      {visibleIds.has('contextLength') && (
        <SettingsItem label={t('contextLength')} description={t('contextLengthDesc')}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="1"
              value={settings.contextLength}
              onChange={e => onSettingsChange({ contextLength: parseInt(e.target.value, 10) })}
              className="input-glass w-24"
            />
          </div>
        </SettingsItem>
      )}
      {visibleIds.has('enableSearch') && (
        <SettingsItem label={t('enableSearch')} description={t('enableSearchDesc')}>
          <Switch size="sm" checked={settings.enableSearch} onChange={e => onSettingsChange({ enableSearch: e.target.checked })} />
        </SettingsItem>
      )}
    </>
  );
};
