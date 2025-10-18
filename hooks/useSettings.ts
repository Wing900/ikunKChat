import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { getAvailableModels } from '../services/modelService';
import { loadSettings, saveSettings } from '../services/storageService';
import { USE_EMERGENCY_ROUTE } from '../emergency.config';

const defaultSettings: Settings = {
  theme: 'apple-light',
  language: 'zh',
  fontFamily: 'lxgw',
  colorPalette: 'neutral',
  customColor: undefined,
  apiKey: [],
  defaultModel: 'gemini-2.5-pro-preview-05-06-maxthinking',
  defaultPersona: 'default-math-assistant',
  autoTitleGeneration: true,
  titleGenerationModel: 'gemini-2.5-flash',
  showThoughts: true,
  optimizeFormatting: false,
  thinkDeeper: false,
  apiBaseUrl: '',
  temperature: 0.7,
  maxOutputTokens: 999999999,
  contextLength: 50,
  password: undefined,
  pdfQuality: 'hd',
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [availableModels, setAvailableModels] = useState<string[]>(['gemini-2.5-pro-preview-05-06-maxthinking', 'gemini-2.5-pro', 'gemini-2.5-flash']);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const { setLanguage } = useLocalization();

  useEffect(() => {
    const loadedSettings = loadSettings();
    const initialSettings = { ...defaultSettings, ...loadedSettings };

    // Determine API credentials based on the emergency switch and env vars
    const useEmergency = USE_EMERGENCY_ROUTE && process.env.FALLBACK_API_BASE_URL;
    
    const envApiBaseUrl = useEmergency
      ? process.env.FALLBACK_API_BASE_URL
      : process.env.API_BASE_URL;
      
    const envApiKey = useEmergency
      ? (process.env.FALLBACK_API_KEY ? [process.env.FALLBACK_API_KEY] : [])
      : (process.env.API_KEY ? [process.env.API_KEY] : []);

    // If environment variables are providing the URL, they take precedence over any user-saved settings.
    // This ensures the developer switch and environment variables are the source of truth.
    if (envApiBaseUrl) {
      initialSettings.apiBaseUrl = envApiBaseUrl;
      initialSettings.apiKey = envApiKey;
    }
    
    setSettings(initialSettings);
    setLanguage(initialSettings.language);
    setIsStorageLoaded(true);
  }, [setLanguage]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    saveSettings(settings);

    // Clear all previous theme classes
    document.body.classList.remove('theme-apple-light', 'theme-apple-dark');
    
    // Apply theme class
    document.body.classList.add(`theme-${settings.theme}`);

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
          if (!allModels.includes(current.titleGenerationModel)) newDefaults.titleGenerationModel = allModels.find(m => m.includes('lite')) || allModels[0];
          return Object.keys(newDefaults).length > 0 ? { ...current, ...newDefaults } : current;
        });
      });
    }
  }, [isStorageLoaded, settings.apiKey, settings.apiBaseUrl]);

  return { settings, setSettings, availableModels, isStorageLoaded };
};
