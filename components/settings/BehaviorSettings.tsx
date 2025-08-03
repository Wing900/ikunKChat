import React from 'react';
import { Settings } from '../../types';
import { CustomSelect, SelectOption } from '../CustomSelect';
import { SettingsItem } from '../SettingsItem';
import { Switch } from '../Switch';
import { useLocalization } from '../../contexts/LocalizationContext';
import { formatModelName } from '../../utils/textUtils';

interface BehaviorSettingsProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  visibleIds: Set<string>;
  availableModels: string[];
}

export const BehaviorSettings: React.FC<BehaviorSettingsProps> = ({ settings, onSettingsChange, visibleIds, availableModels }) => {
  const { t } = useLocalization();
  const modelOptions: SelectOption[] = availableModels.map(m => ({ value: m, label: formatModelName(m) }));

  return (
    <>
      {visibleIds.has('autoTitleGeneration') && (
        <SettingsItem label={t('autoTitleGeneration')} description={t('autoTitleGenerationDesc')}>
          <Switch size="sm" checked={settings.autoTitleGeneration} onChange={e => onSettingsChange({ autoTitleGeneration: e.target.checked })} />
        </SettingsItem>
      )}
      {visibleIds.has('titleGenModel') && (
        <SettingsItem label={t('titleGenModel')} description={t('titleGenModelDesc')} isDisabled={!settings.autoTitleGeneration}>
          <CustomSelect options={modelOptions} selectedValue={settings.titleGenerationModel} onSelect={(value) => onSettingsChange({ titleGenerationModel: value })} className="w-48" disabled={!settings.autoTitleGeneration}/>
        </SettingsItem>
      )}
      {visibleIds.has('suggestions') && (
        <SettingsItem label={t('suggestions')} description={t('suggestionsDesc')}>
          <Switch size="sm" checked={settings.showSuggestions} onChange={e => onSettingsChange({ showSuggestions: e.target.checked })} />
        </SettingsItem>
      )}
      {visibleIds.has('suggestionModel') && (
        <SettingsItem label={t('suggestionModel')} description={t('suggestionModelDesc')} isDisabled={!settings.showSuggestions}>
          <CustomSelect options={modelOptions} selectedValue={settings.suggestionModel} onSelect={(value) => onSettingsChange({ suggestionModel: value })} className="w-48" disabled={!settings.showSuggestions} />
        </SettingsItem>
      )}
      {visibleIds.has('defaultSearch') && (
        <div className="flex flex-col">
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
        </div>
      )}
      {visibleIds.has('showThoughts') && (
        <SettingsItem label={t('showThoughts')} description={t('showThoughtsDesc')}>
          <Switch size="sm" checked={settings.showThoughts} onChange={e => onSettingsChange({ showThoughts: e.target.checked })} />
        </SettingsItem>
      )}
    </>
  );
};
