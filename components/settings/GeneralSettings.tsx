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
          <CustomSelect
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'apple-light', label: 'Apple Light' },
              { value: 'apple-dark', label: 'Apple Dark' },
              { value: 'pink-ocean', label: 'Pink Ocean' },
              { value: 'blue-sky', label: 'Blue Sky' },
            ]}
            selectedValue={settings.theme}
            onSelect={(value) => onSettingsChange({ theme: value as any })}
            className="w-48"
          />
        </SettingsItem>
      )}
      {visibleIds.has('fontFamily') && (
        <SettingsItem label={t('fontFamily')} description={t('fontFamilyDesc')}>
          <CustomSelect
            options={[
              { value: 'system', label: '系统默认' },
              { value: 'lxgw', label: '霞鹜文楷' },
              { value: 'yozai', label: '悠哉字体' },
            ]}
            selectedValue={settings.fontFamily}
            onSelect={(value) => onSettingsChange({ fontFamily: value as any })}
            className="w-48"
          />
        </SettingsItem>
      )}
    </>
  );
};