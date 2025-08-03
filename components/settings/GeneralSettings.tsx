import React from 'react';
import { Settings } from '../../types';
import { CustomSelect, SelectOption } from '../CustomSelect';
import { SettingsItem } from '../SettingsItem';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';

interface GeneralSettingsProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  visibleIds: Set<string>;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, onSettingsChange, visibleIds }) => {
  const { t } = useLocalization();
  const languageOptions: SelectOption[] = [{ value: 'en', label: t('english') }, { value: 'zh', label: t('chinese') }];
  
  return (
    <>
      {visibleIds.has('language') && (
        <SettingsItem label={t('language')} description={t('languageDesc')}>
          <CustomSelect options={languageOptions} selectedValue={settings.language} onSelect={(value) => onSettingsChange({ language: value as 'en' | 'zh' })} className="w-36" />
        </SettingsItem>
      )}
      {visibleIds.has('theme') && (
        <SettingsItem label={t('theme')} description={t('themeDesc')}>
          <div className="flex items-center p-1 rounded-full glass-pane">
            <button onClick={() => onSettingsChange({ theme: 'light' })} className={`p-2 rounded-full transition-colors ${settings.theme === 'light' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-white/20'}`}><Icon icon="sun" className="w-5 h-5" /></button>
            <button onClick={() => onSettingsChange({ theme: 'dark' })} className={`p-2 rounded-full transition-colors ${settings.theme === 'dark' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-black/20'}`}><Icon icon="moon" className="w-5 h-5" /></button>
          </div>
        </SettingsItem>
      )}
    </>
  );
};
