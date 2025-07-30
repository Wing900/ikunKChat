import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { getAvailableModels } from '../services/modelService';
import { loadSettings, saveSettings } from '../services/storageService';

const defaultSettings: Settings = {
  theme: 'light',
  language: 'en',
  apiKey: [],
  showSuggestions: true,
  defaultModel: 'gemini-2.5-flash',
  suggestionModel: 'gemini-2.5-flash',
  autoTitleGeneration: true,
  titleGenerationModel: 'gemini-2.5-flash',
  personaBuilderModel: 'gemini-2.5-flash',
  defaultSearch: true,
  showThoughts: true,
  enableGlobalSystemPrompt: false,
  globalSystemPrompt: '',
  optimizeFormatting: true,
  thinkDeeper: true,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [availableModels, setAvailableModels] = useState<string[]>(['gemini-2.5-flash']);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const { setLanguage } = useLocalization();

  useEffect(() => {
    const loadedSettings = loadSettings();
    const initialSettings = { ...defaultSettings, ...loadedSettings };
    if (!loadedSettings && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      initialSettings.theme = 'dark';
    }
    setSettings(initialSettings);
    setLanguage(initialSettings.language);
    setIsStorageLoaded(true);
  }, [setLanguage]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    saveSettings(settings);
    document.body.classList.toggle('dark-mode', settings.theme === 'dark');
    setLanguage(settings.language);
  }, [settings, isStorageLoaded, setLanguage]);

  useEffect(() => {
    const apiKeys = settings.apiKey || (process.env.API_KEY ? [process.env.API_KEY] : []);
    if (isStorageLoaded && apiKeys.length > 0) {
      getAvailableModels(apiKeys).then(models => {
        if (!models || models.length === 0) return;
        setAvailableModels(models);
        setSettings(current => {
          const newDefaults: Partial<Settings> = {};
          if (!models.includes(current.defaultModel)) newDefaults.defaultModel = models[0];
          if (!models.includes(current.suggestionModel)) newDefaults.suggestionModel = models[0];
          if (!models.includes(current.titleGenerationModel)) newDefaults.titleGenerationModel = models[0];
          if (!models.includes(current.personaBuilderModel)) newDefaults.personaBuilderModel = models[0];
          return Object.keys(newDefaults).length > 0 ? { ...current, ...newDefaults } : current;
        });
      });
    }
  }, [isStorageLoaded, settings.apiKey]);

  return { settings, setSettings, availableModels, isStorageLoaded };
};
