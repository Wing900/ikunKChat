import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { getAvailableModels } from '../services/modelService';
import { loadSettings, saveSettings } from '../services/storageService';

const defaultSettings: Settings = {
  theme: 'light',
  language: 'en',
  apiKey: [],
  showSuggestions: false,
  defaultModel: 'gemini-2.5-flash',
  suggestionModel: 'gemini-2.5-flash-lite',
  autoTitleGeneration: true,
  titleGenerationModel: 'gemini-2.5-flash-lite',
  languageDetectionModel: 'gemini-2.5-flash-lite',
  defaultSearch: false,
  useSearchOptimizerPrompt: false,
  showThoughts: true,
  enableGlobalSystemPrompt: false,
  globalSystemPrompt: '',
  optimizeFormatting: false,
  thinkDeeper: false,
  apiBaseUrl: '',
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [availableModels, setAvailableModels] = useState<string[]>(['gemini-2.5-flash', 'gemini-2.5-flash-lite']);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const { setLanguage } = useLocalization();

  useEffect(() => {
    const loadedSettings = loadSettings();
    const initialSettings = { ...defaultSettings, ...loadedSettings };
    if (!loadedSettings && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      initialSettings.theme = 'dark';
    }

    // Override API Base URL if set in environment variables
    if (process.env.API_BASE_URL) {
      initialSettings.apiBaseUrl = process.env.API_BASE_URL;
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
      getAvailableModels(apiKeys, settings.apiBaseUrl).then(models => {
        if (!models || models.length === 0) return;
        const allModels = [...new Set([...models, ...availableModels])];
        setAvailableModels(allModels);
        setSettings(current => {
          const newDefaults: Partial<Settings> = {};
          if (!allModels.includes(current.defaultModel)) newDefaults.defaultModel = allModels[0];
          if (!allModels.includes(current.suggestionModel)) newDefaults.suggestionModel = allModels.find(m => m.includes('lite')) || allModels[0];
          if (!allModels.includes(current.titleGenerationModel)) newDefaults.titleGenerationModel = allModels.find(m => m.includes('lite')) || allModels[0];
          if (!allModels.includes(current.languageDetectionModel)) newDefaults.languageDetectionModel = allModels.find(m => m.includes('lite')) || allModels[0];
          return Object.keys(newDefaults).length > 0 ? { ...current, ...newDefaults } : current;
        });
      });
    }
  }, [isStorageLoaded, settings.apiKey, settings.apiBaseUrl]);

  return { settings, setSettings, availableModels, isStorageLoaded };
};
