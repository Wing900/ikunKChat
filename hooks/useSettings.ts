import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { createLLMService } from '../services/llm/llmFactory';
import { loadSettings, saveSettings } from '../services/storageService';
import { USE_EMERGENCY_ROUTE } from '../emergency.config';

const defaultSettings: Settings = {
  theme: 'apple-light',
  language: 'zh',
  fontFamily: 'lxgw',
  colorPalette: 'neutral',
  customColor: undefined,
  apiKey: [],
  defaultModel: '',
  defaultPersona: 'default-math-assistant',
  autoTitleGeneration: true,
  titleGenerationModel: '',
  showThoughts: true,
  optimizeFormatting: false,
  thinkDeeper: false,
  apiBaseUrl: '',
  temperature: 0.7,
  maxOutputTokens: 999999999,
  contextLength: 50,
  password: undefined,
  pdfQuality: 'hd',
  fontSize: 100,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const { setLanguage } = useLocalization();

  useEffect(() => {
    const loadedSettings = loadSettings();
    const initialSettings = { ...defaultSettings, ...loadedSettings };

    // Determine API credentials based on the emergency switch and env vars
    const useEmergency = USE_EMERGENCY_ROUTE && process.env.FALLBACK_API_BASE_URL;
    
    // 获取 Gemini 和 OpenAI 的环境变量
    const geminiApiKey = useEmergency
      ? process.env.FALLBACK_API_KEY
      : process.env.GEMINI_API_KEY;
    const geminiApiBaseUrl = useEmergency
      ? process.env.FALLBACK_API_BASE_URL
      : process.env.API_BASE_URL;
    
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiApiBaseUrl = process.env.OPENAI_API_BASE_URL;

    // 只有当用户没有手动配置 API Key 时，才使用环境变量
    // 这样用户在设置中手动填写的 key 不会被环境变量覆盖
    const hasUserApiKey = loadedSettings?.apiKey && Array.isArray(loadedSettings.apiKey) && loadedSettings.apiKey.length > 0 && loadedSettings.apiKey[0].trim() !== '';
    const hasGeminiEnvKey = geminiApiKey && geminiApiKey.trim() && geminiApiKey.trim().length > 0;
    const hasOpenAIEnvKey = openaiApiKey && openaiApiKey.trim() && openaiApiKey.trim().length > 0;

    // 只有在用户没有手动配置时，才使用环境变量
    if (!hasUserApiKey) {
      if (hasGeminiEnvKey) {
        // Gemini 有配置，优先使用
        initialSettings.llmProvider = 'gemini';
        initialSettings.apiKey = [geminiApiKey!.trim()];
        initialSettings.apiBaseUrl = geminiApiBaseUrl || '';
      } else if (hasOpenAIEnvKey) {
        // Gemini 没配置，但 OpenAI 有配置
        initialSettings.llmProvider = 'openai';
        initialSettings.apiKey = [openaiApiKey!.trim()];
        initialSettings.apiBaseUrl = openaiApiBaseUrl || '';
      }
    }
    
    // 如果用户也没有设置 llmProvider，则默认使用 gemini
    if (!initialSettings.llmProvider) {
      initialSettings.llmProvider = 'gemini';
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
<<<<<<< HEAD

    // Apply font size
    const fontSizeMultiplier = (settings.fontSize || 100) / 100;
    document.documentElement.style.setProperty('--font-size-multiplier', `${fontSizeMultiplier}`);

=======
>>>>>>> abb4fc710d0cdb394efd8c6759347f61f6bc403b
    setLanguage(settings.language);
  }, [settings, isStorageLoaded, setLanguage]);

  useEffect(() => {
    const apiKeys = settings.apiKey || (process.env.API_KEY ? [process.env.API_KEY] : []);
    if (isStorageLoaded && apiKeys.length > 0) {
      const llmService = createLLMService(settings);
      llmService.getAvailableModels(apiKeys[0], settings.apiBaseUrl).then(models => {
        if (!models || models.length === 0) return;
        setAvailableModels(models);
        setSettings(current => {
          const newDefaults: Partial<Settings> = {};
          if (!models.includes(current.defaultModel)) {
            newDefaults.defaultModel = models[0] || '';
          }
          if (!models.includes(current.titleGenerationModel)) {
            newDefaults.titleGenerationModel = models.find(m => m.includes('flash') || m.includes('lite')) || models[0] || '';
          }
          return Object.keys(newDefaults).length > 0 ? { ...current, ...newDefaults } : current;
        });
      });
    }
  }, [isStorageLoaded, settings.apiKey, settings.apiBaseUrl, settings.llmProvider]);

  return { settings, setSettings, availableModels, isStorageLoaded };
};
