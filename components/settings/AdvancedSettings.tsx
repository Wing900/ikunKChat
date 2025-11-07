import React, { useState } from 'react';
import { Settings } from '../../types';
import { CustomSelect, SelectOption } from '../CustomSelect';
import { SettingsItem } from '../SettingsItem';
import { Switch } from '../Switch';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useToast } from '../../contexts/ToastContext';
import { formatModelName } from '../../utils/textUtils';
import { activateLicense, loadLicenseInfo } from '../../services/licensingService';
import { Icon } from '../Icon';

interface AdvancedSettingsProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  visibleIds: Set<string>;
  availableModels: string[];
}

const isApiKeySetByEnv = false;
const isApiBaseUrlSetByEnv = false;

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, onSettingsChange, visibleIds, availableModels }) => {
  const { t } = useLocalization();
  const { addToast } = useToast();
  const modelOptions: SelectOption[] = availableModels.map(m => ({ value: m, label: formatModelName(m) }));
  
  const [activationCode, setActivationCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    if (!activationCode.trim()) {
      addToast('请输入月授权码', 'error');
      return;
    }

    setIsActivating(true);
    try {
      const result = await activateLicense(activationCode);
      if (result.success) {
        addToast(result.message, 'success');
        setActivationCode('');
      } else {
        addToast(result.message, 'error');
      }
    } catch (error) {
      addToast('激活失败，请稍后重试', 'error');
    } finally {
      setIsActivating(false);
    }
  };

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
      
      {visibleIds.has('activationCode') && (
        <SettingsItem
          label="月授权码"
          description="输入月授权码以解锁更多使用次数"
        >
          <div className="flex gap-2 w-60">
            <input
              type="text"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder="输入月授权码"
              disabled={isActivating}
              className="flex-1 input-glass text-sm"
            />
            <button
              onClick={handleActivate}
              disabled={isActivating || !activationCode.trim()}
              className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-primary)] hover:opacity-90
                       text-[var(--md-sys-color-on-primary)] font-medium transition-all text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-1.5"
            >
              {isActivating ? (
                <>
                  <Icon icon="search" className="w-3 h-3 animate-spin" />
                  激活中
                </>
              ) : (
                <>
                  <Icon icon="check" className="w-3 h-3" />
                  激活
                </>
              )}
            </button>
          </div>
        </SettingsItem>
      )}
    </>
  );
};
