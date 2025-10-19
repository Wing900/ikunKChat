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
          <CustomSelect options={modelOptions} value={settings.titleGenerationModel} onChange={(value) => onSettingsChange({ titleGenerationModel: value })} className="w-48" disabled={!settings.autoTitleGeneration}/>
        </SettingsItem>
      )}
      {visibleIds.has('showThoughts') && (
        <SettingsItem label={t('showThoughts')} description={t('showThoughtsDesc')}>
          <Switch size="sm" checked={settings.showThoughts} onChange={e => onSettingsChange({ showThoughts: e.target.checked })} />
        </SettingsItem>
      )}
    </>
  );
};
