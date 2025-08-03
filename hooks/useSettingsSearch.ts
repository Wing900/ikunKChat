import { useMemo } from 'react';
import { useLocalization, translations } from '../contexts/LocalizationContext';

type SearchableItem = { id: string; texts: string[], section: string };
type SectionVisibility = { [key: string]: boolean };

const SECTIONS = ['general', 'behavior', 'advanced', 'data'];

export const useSettingsSearch = (searchQuery: string) => {
  const { t } = useLocalization();

  const searchableSettings: SearchableItem[] = useMemo(() => [
    // General
    { id: 'language', section: 'general', texts: [t('language'), t('languageDesc'), translations.zh.language, translations.zh.languageDesc] },
    { id: 'theme', section: 'general', texts: [t('theme'), t('themeDesc'), translations.zh.theme, translations.zh.themeDesc] },
    
    // Behavior
    { id: 'autoTitleGeneration', section: 'behavior', texts: [t('autoTitleGeneration'), t('autoTitleGenerationDesc'), translations.zh.autoTitleGeneration, translations.zh.autoTitleGenerationDesc] },
    { id: 'titleGenModel', section: 'behavior', texts: [t('titleGenModel'), t('titleGenModelDesc'), translations.zh.titleGenModel, translations.zh.titleGenModelDesc] },
    { id: 'suggestions', section: 'behavior', texts: [t('suggestions'), t('suggestionsDesc'), translations.zh.suggestions, translations.zh.suggestionsDesc] },
    { id: 'suggestionModel', section: 'behavior', texts: [t('suggestionModel'), t('suggestionModelDesc'), translations.zh.suggestionModel, translations.zh.suggestionModelDesc] },
    { id: 'defaultSearch', section: 'behavior', texts: [t('defaultSearch'), t('defaultSearchDesc'), t('useSearchOptimizerPrompt'), t('useSearchOptimizerPromptDesc'), translations.zh.defaultSearch, translations.zh.defaultSearchDesc, translations.zh.useSearchOptimizerPrompt, translations.zh.useSearchOptimizerPromptDesc] },
    { id: 'showThoughts', section: 'behavior', texts: [t('showThoughts'), t('showThoughtsDesc'), translations.zh.showThoughts, translations.zh.showThoughtsDesc] },

    // Advanced
    { id: 'apiKey', section: 'advanced', texts: [t('apiKey'), t('apiKeyDesc'), translations.zh.apiKey, translations.zh.apiKeyDesc] },
    { id: 'apiBaseUrl', section: 'advanced', texts: [t('apiBaseUrl'), t('apiBaseUrlDesc'), translations.zh.apiBaseUrl, translations.zh.apiBaseUrlDesc] },
    { id: 'globalSystemPrompt', section: 'advanced', texts: [t('globalSystemPrompt'), t('globalSystemPromptDesc'), translations.zh.globalSystemPrompt, translations.zh.globalSystemPromptDesc] },
    { id: 'optimizeFormatting', section: 'advanced', texts: [t('optimizeFormatting'), t('optimizeFormattingDesc'), translations.zh.optimizeFormatting, translations.zh.optimizeFormattingDesc] },
    { id: 'thinkDeeper', section: 'advanced', texts: [t('thinkDeeper'), t('thinkDeeperDesc'), translations.zh.thinkDeeper, translations.zh.thinkDeeperDesc] },
    { id: 'langDetectModel', section: 'advanced', texts: [t('langDetectModel'), t('langDetectModelDesc'), translations.zh.langDetectModel, translations.zh.langDetectModelDesc] },
    
    // Data
    { id: 'dataManagement', section: 'data', texts: [t('importData'), t('exportSettings'), t('exportData'), t('clearHistory'), translations.zh.importData, translations.zh.exportSettings, translations.zh.exportData, translations.zh.clearHistory] },
  ], [t]);

  const { visibleSettingIds, sectionVisibility } = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    if (!lowerQuery) {
        const allVisible = new Set(searchableSettings.map(s => s.id));
        const allSectionsVisible = SECTIONS.reduce((acc, sec) => ({...acc, [sec]: true}), {});
        return { visibleSettingIds: allVisible, sectionVisibility: allSectionsVisible as SectionVisibility };
    }
    
    const visibleIds = new Set<string>();
    const visibleSections = SECTIONS.reduce((acc, sec) => ({...acc, [sec]: false}), {});

    searchableSettings.forEach(item => {
        if (item.texts.some(text => text.toLowerCase().includes(lowerQuery))) {
            visibleIds.add(item.id);
            (visibleSections as any)[item.section] = true;
        }
    });

    return { visibleSettingIds: visibleIds, sectionVisibility: visibleSections as SectionVisibility };
  }, [searchQuery, searchableSettings]);

  return { visibleSettingIds, sectionVisibility };
};