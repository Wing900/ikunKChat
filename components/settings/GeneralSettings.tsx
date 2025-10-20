import React from 'react';
import { Settings, Persona } from '../../types';
import { CustomSelect, SelectOption } from '../CustomSelect';
import { SettingsItem } from '../SettingsItem';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ColorPicker } from '../ColorPicker';

interface GeneralSettingsProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  personas: Persona[];
  visibleIds: Set<string>;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, onSettingsChange, personas, visibleIds }) => {
  const { t } = useLocalization();
  const languageOptions: SelectOption[] = [{ value: 'en', label: t('english') }, { value: 'zh', label: t('chinese') }];
  const personaOptions: SelectOption[] = personas.filter(p => p).map(p => ({ value: p.id, label: p.name }));
  
  return (
    <>
      {visibleIds.has('language') && (
        <SettingsItem label={t('language')} description={t('languageDesc')}>
          <CustomSelect options={languageOptions} value={settings.language} onChange={(value) => onSettingsChange({ language: value as 'en' | 'zh' })} className="w-36" />
        </SettingsItem>
      )}
      {visibleIds.has('defaultPersona') && (
        <SettingsItem label={t('defaultPersona')} description={t('defaultPersonaDesc')}>
          <CustomSelect options={personaOptions} value={settings.defaultPersona} onChange={(value) => onSettingsChange({ defaultPersona: value as string })} className="w-48" />
        </SettingsItem>
      )}
      {visibleIds.has('theme') && (
        <SettingsItem label={t('theme')} description={t('themeDesc')}>
          <CustomSelect
            options={[
              { value: 'apple-light', label: '苹果光明' },
              { value: 'apple-dark', label: '苹果黑暗' },
            ]}
            value={settings.theme}
            onChange={(value) => onSettingsChange({ theme: value as 'apple-light' | 'apple-dark' })}
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
            value={settings.fontFamily}
            onChange={(value) => onSettingsChange({ fontFamily: value as any })}
            className="w-48"
          />
        </SettingsItem>
      )}
<<<<<<< HEAD
      {visibleIds.has('fontSize') && (
        <SettingsItem label={t('fontSize')} description={t('fontSizeDesc')}>
          <div className="flex items-center gap-4 w-48">
            <input
              type="range"
              min="70"
              max="130"
              step="10"
              value={settings.fontSize || 100}
              onChange={(e) => onSettingsChange({ fontSize: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">{settings.fontSize || 100}%</span>
          </div>
        </SettingsItem>
      )}
=======
>>>>>>> abb4fc710d0cdb394efd8c6759347f61f6bc403b
      {visibleIds.has('colorPalette') && (
        <SettingsItem label={t('colorPalette')} description={t('colorPaletteDesc')}>
          <div style={{ marginTop: '0.5rem' }}>
            <ColorPicker
              selectedColorId={settings.colorPalette || 'blue'}
              customColor={settings.customColor}
              onSelectColor={(colorId) => onSettingsChange({ colorPalette: colorId, customColor: undefined })}
              onSelectCustomColor={(color) => onSettingsChange({ customColor: color, colorPalette: 'custom' })}
            />
          </div>
        </SettingsItem>
      )}
    </>
  );
}