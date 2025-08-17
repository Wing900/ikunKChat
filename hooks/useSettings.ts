import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { getAvailableModels } from '../services/modelService';
import { loadSettings, saveSettings } from '../services/storageService';
import { defaultPersonas } from '../data/defaultPersonas';

const defaultSettings: Settings = {
  theme: 'apple-light',
  language: 'zh',
  fontFamily: 'lxgw',
  apiKey: [],
  showSuggestions: false,
  defaultModel: 'gemini-2.5-pro',
  defaultPersona: 'default-assistant',
  suggestionModel: 'gemini-2.5-flash',
  autoTitleGeneration: true,
  titleGenerationModel: 'gemini-2.5-flash',
  languageDetectionModel: 'gemini-2.5-flash',
  defaultSearch: false,
  useSearchOptimizerPrompt: false,
  showThoughts: true,
  enableGlobalSystemPrompt: false,
  globalSystemPrompt: '',
  optimizeFormatting: false,
  thinkDeeper: false,
  apiBaseUrl: '',
  temperature: 0.7,
  maxOutputTokens: 4096,
  contextLength: 10,
  password: undefined,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [availableModels, setAvailableModels] = useState<string[]>(['gemini-2.5-pro', 'gemini-2.5-flash']);
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
    document.body.classList.remove('theme-dark', 'theme-apple-light', 'theme-apple-dark', 'theme-pink-ocean', 'theme-blue-sky');
    if (settings.theme !== 'light') {
      document.body.classList.add(`theme-${settings.theme}`);
    }
    document.body.dataset.font = settings.fontFamily;
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
