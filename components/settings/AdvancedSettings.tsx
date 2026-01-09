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

// 检测环境变量中是否已设置 API Key 和 Base URL
const isApiKeySetByEnv = !!(
  process.env.GEMINI_API_KEY ||
  process.env.OPENAI_API_KEY
);
const isApiBaseUrlSetByEnv = !!(
  process.env.API_BASE_URL ||
  process.env.OPENAI_API_BASE_URL
);

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, onSettingsChange, visibleIds, availableModels }) => {
  const { t } = useLocalization();
  const modelOptions: SelectOption[] = availableModels.map(m => ({ value: m, label: formatModelName(m) }));

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const keys = e.target.value.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    onSettingsChange({ apiKey: keys });
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
      {visibleIds.has('apiKey') && (
        <SettingsItem label={t('apiKey')} description={t('apiKeyDesc')}>
           <textarea
              value={isApiKeySetByEnv ? '' : (settings.apiKey || []).join('\n')}
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
            value={isApiBaseUrlSetByEnv ? '' : (settings.apiBaseUrl || '')}
            onChange={e => onSettingsChange({ apiBaseUrl: e.target.value })}
            disabled={isApiBaseUrlSetByEnv}
            placeholder={
              isApiBaseUrlSetByEnv
                ? t('apiKeyEnvVar')
                : settings.llmProvider === 'openai'
                  ? 'https://api.openai.com'
                  : 'https://generativelanguage.googleapis.com'
            }
            className="input-glass w-60"
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
    </>
  );
};
