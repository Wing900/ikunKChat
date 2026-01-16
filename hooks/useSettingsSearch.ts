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
        'language', 'theme', 'defaultPersona', 'fontFamily', 'colorPalette', 'fontSize', 'password',
        'autoTitleGeneration', 'titleGenModel',
        'showThoughts', 'llmProvider', 'apiKey', 'apiBaseUrl', 'temperature',
        'contextLength', 'maxOutputTokens', 'enableSearch',
        'streamInactivityTimeout', 'data', 'pdf-management'
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
        { id: 'fontSize', section: 'general', texts: [t('fontSize'), t('fontSizeDesc'), translations.zh.fontSize, translations.zh.fontSizeDesc, '字体大小', 'font size'] },
        { id: 'password', section: 'general', texts: [t('password'), t('passwordDesc'), translations.zh.password, translations.zh.passwordDesc] },
        
        // Behavior
        { id: 'autoTitleGeneration', section: 'behavior', texts: [t('autoTitleGeneration'), t('autoTitleGenerationDesc'), translations.zh.autoTitleGeneration, translations.zh.autoTitleGenerationDesc] },
        { id: 'titleGenModel', section: 'behavior', texts: [t('titleGenModel'), t('titleGenModelDesc'), translations.zh.titleGenModel, translations.zh.titleGenModelDesc] },
        { id: 'showThoughts', section: 'behavior', texts: [t('showThoughts'), t('showThoughtsDesc'), translations.zh.showThoughts, translations.zh.showThoughtsDesc] },

        // Advanced
        { id: 'llmProvider', section: 'advanced', texts: [t('llmProvider'), t('llmProviderDesc'), translations.zh.llmProvider, translations.zh.llmProviderDesc] },
        { id: 'apiKey', section: 'advanced', texts: [t('apiKey'), t('apiKeyDesc'), translations.zh.apiKey, translations.zh.apiKeyDesc] },
        { id: 'apiBaseUrl', section: 'advanced', texts: [t('apiBaseUrl'), t('apiBaseUrlDesc'), translations.zh.apiBaseUrl, translations.zh.apiBaseUrlDesc] },
        { id: 'temperature', section: 'advanced', texts: [t('temperature'), t('temperatureDesc'), translations.zh.temperature, translations.zh.temperatureDesc] },
        { id: 'contextLength', section: 'advanced', texts: [t('contextLength'), t('contextLengthDesc'), translations.zh.contextLength, translations.zh.contextLengthDesc] },
        { id: 'enableSearch', section: 'advanced', texts: [t('enableSearch'), t('enableSearchDesc'), translations.zh.enableSearch, translations.zh.enableSearchDesc] },
        { id: 'streamInactivityTimeout', section: 'advanced', texts: [t('streamInactivityTimeout'), t('streamInactivityTimeoutDesc'), translations.zh.streamInactivityTimeout, translations.zh.streamInactivityTimeoutDesc] },
        
        // Data
        { id: 'data', section: 'data', texts: [t('importData'), t('exportSettings'), t('exportData'), t('clearHistory'), translations.zh.importData, translations.zh.exportSettings, translations.zh.exportData, translations.zh.clearHistory] },
        { id: 'pdf-management', section: 'data', texts: ['PDF', 'PDF文档库', 'PDF管理', 'PDF文档', '文档库', 'PDF library', 'PDF management', 'document', 'pdf files'] },
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