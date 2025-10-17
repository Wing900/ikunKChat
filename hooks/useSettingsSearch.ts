import { useMemo, useRef } from 'react';
import { useLocalization, translations } from '../contexts/LocalizationContext';

type SearchableItem = { id: string; texts: string[], section: string };
type SectionVisibility = { [key: string]: boolean };

const SECTIONS = ['general', 'behavior', 'advanced', 'data'];

export const useSettingsSearch = (searchQuery: string) => {
  const { t } = useLocalization();
  const searchableSettingsRef = useRef<SearchableItem[] | null>(null);

  const { visibleSettingIds, sectionVisibility } = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();

    if (!lowerQuery) {
      const allVisible = new Set([
        'language', 'theme', 'defaultPersona', 'fontFamily', 'colorPalette', 'password',
        'autoTitleGeneration', 'titleGenModel',
        'showThoughts', 'apiKey', 'apiBaseUrl', 'temperature',
        'contextLength', 'maxOutputTokens',
        'streamInactivityTimeout', 'data'
      ]);
      const allSectionsVisible = SECTIONS.reduce((acc, sec) => ({ ...acc, [sec]: true }), {});
      return { visibleSettingIds: allVisible, sectionVisibility: allSectionsVisible as SectionVisibility };
    }

    if (!searchableSettingsRef.current) {
      searchableSettingsRef.current = [
        // General
        { id: 'language', section: 'general', texts: [t('language'), t('languageDesc'), translations.zh.language, translations.zh.languageDesc] },
        { id: 'theme', section: 'general', texts: [t('theme'), t('themeDesc'), translations.zh.theme, translations.zh.themeDesc] },
        { id: 'defaultPersona', section: 'general', texts: [t('defaultPersona'), t('defaultPersonaDesc'), translations.zh.defaultPersona, translations.zh.defaultPersonaDesc] },
        { id: 'fontFamily', section: 'general', texts: [t('fontFamily'), t('fontFamilyDesc'), translations.zh.fontFamily, translations.zh.fontFamilyDesc] },
        { id: 'colorPalette', section: 'general', texts: [t('colorPalette'), t('colorPaletteDesc'), t('customColor'), translations.zh.colorPalette, translations.zh.colorPaletteDesc, translations.zh.customColor, '调色板', '主题色', '颜色', 'color', 'palette', 'theme color'] },
        { id: 'password', section: 'general', texts: [t('password'), t('passwordDesc'), translations.zh.password, translations.zh.passwordDesc] },
        
        // Behavior
        { id: 'autoTitleGeneration', section: 'behavior', texts: [t('autoTitleGeneration'), t('autoTitleGenerationDesc'), translations.zh.autoTitleGeneration, translations.zh.autoTitleGenerationDesc] },
        { id: 'titleGenModel', section: 'behavior', texts: [t('titleGenModel'), t('titleGenModelDesc'), translations.zh.titleGenModel, translations.zh.titleGenModelDesc] },
        { id: 'showThoughts', section: 'behavior', texts: [t('showThoughts'), t('showThoughtsDesc'), translations.zh.showThoughts, translations.zh.showThoughtsDesc] },

        // Advanced
        { id: 'apiKey', section: 'advanced', texts: [t('apiKey'), t('apiKeyDesc'), translations.zh.apiKey, translations.zh.apiKeyDesc] },
        { id: 'apiBaseUrl', section: 'advanced', texts: [t('apiBaseUrl'), t('apiBaseUrlDesc'), translations.zh.apiBaseUrl, translations.zh.apiBaseUrlDesc] },
        { id: 'temperature', section: 'advanced', texts: [t('temperature'), t('temperatureDesc'), translations.zh.temperature, translations.zh.temperatureDesc] },
        { id: 'contextLength', section: 'advanced', texts: [t('contextLength'), t('contextLengthDesc'), translations.zh.contextLength, translations.zh.contextLengthDesc] },
        { id: 'streamInactivityTimeout', section: 'advanced', texts: [t('streamInactivityTimeout'), t('streamInactivityTimeoutDesc'), translations.zh.streamInactivityTimeout, translations.zh.streamInactivityTimeoutDesc] },
        
        // Data
        { id: 'data', section: 'data', texts: [t('importData'), t('exportSettings'), t('exportData'), t('clearHistory'), translations.zh.importData, translations.zh.exportSettings, translations.zh.exportData, translations.zh.clearHistory] },
      ];
    }
    
    const visibleIds = new Set<string>();
    const visibleSections = SECTIONS.reduce((acc, sec) => ({ ...acc, [sec]: false }), {});

    searchableSettingsRef.current.forEach(item => {
        if (item.texts.some(text => text.toLowerCase().includes(lowerQuery))) {
            visibleIds.add(item.id);
            (visibleSections as any)[item.section] = true;
        }
    });

    return { visibleSettingIds: visibleIds, sectionVisibility: visibleSections as SectionVisibility };
  }, [searchQuery, t]);

  return { visibleSettingIds, sectionVisibility };
};