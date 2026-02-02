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
  enableSearch: false,
  apiBaseUrl: '',
  temperature: 0.7,
  maxOutputTokens: 16384,
  contextLength: 50,
  password: undefined,
  pdfQuality: 'hd',
  fontSize: 100,
};

// 检测环境变量中是否有 API Key 配置
const hasGeminiEnvKey = !!(process.env.GEMINI_API_KEY?.trim());
const hasOpenAIEnvKey = !!(process.env.OPENAI_API_KEY?.trim());
const hasEnvApiKey = hasGeminiEnvKey || hasOpenAIEnvKey;

// 从环境变量获取 API 配置
const getEnvApiConfig = () => {
  const useEmergency = USE_EMERGENCY_ROUTE && process.env.FALLBACK_API_BASE_URL;

  if (useEmergency) {
    return {
      provider: 'gemini' as const,
      apiKey: process.env.FALLBACK_API_KEY?.trim() || '',
      apiBaseUrl: process.env.FALLBACK_API_BASE_URL?.trim() || '',
    };
  }

  if (hasGeminiEnvKey && !hasOpenAIEnvKey) {
    return {
      provider: 'gemini' as const,
      apiKey: process.env.GEMINI_API_KEY!.trim(),
      apiBaseUrl: process.env.API_BASE_URL?.trim() || '',
    };
  }

  if (hasOpenAIEnvKey && !hasGeminiEnvKey) {
    return {
      provider: 'openai' as const,
      apiKey: process.env.OPENAI_API_KEY!.trim(),
      apiBaseUrl: process.env.OPENAI_API_BASE_URL?.trim() || '',
    };
  }

  if (hasGeminiEnvKey && hasOpenAIEnvKey) {
    // 两者都有，默认使用 Gemini，用户可以切换
    return {
      provider: 'gemini' as const,
      apiKey: process.env.GEMINI_API_KEY!.trim(),
      apiBaseUrl: process.env.API_BASE_URL?.trim() || '',
    };
  }

  return null;
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const { setLanguage } = useLocalization();

  // 环境变量配置（不存到 localStorage）
  const envConfig = getEnvApiConfig();

  useEffect(() => {
    const loadedSettings = loadSettings();
    const initialSettings = { ...defaultSettings, ...loadedSettings };

    // 如果有环境变量配置
    if (envConfig) {
      initialSettings.llmProvider = envConfig.provider;

      // 关键修改：只有在用户启用了自定义 API 配置时，才保留用户的设置
      // 否则，清空 apiKey 和 apiBaseUrl，避免暴露环境变量
      if (!initialSettings.useCustomApi) {
        // 用户未启用自定义，清空这些字段，实际使用时从环境变量读取
        initialSettings.apiKey = [];
        initialSettings.apiBaseUrl = '';
      }
      // 如果用户启用了自定义，保留 loadedSettings 中的值
    }

    // 如果没有环境变量配置，保持用户之前的手动配置或默认值
    if (!initialSettings.llmProvider) {
      initialSettings.llmProvider = 'gemini';
    }

    setSettings(initialSettings);
    setLanguage(initialSettings.language);
    setIsStorageLoaded(true);
  }, [setLanguage]);

  useEffect(() => {
    if (!isStorageLoaded) return;

    // 保存设置时，排除 apiKey 和 apiBaseUrl（如果来自环境变量且用户未启用自定义）
    // 这样环境变量不会被缓存到 localStorage
    const settingsToSave = { ...settings };
    if ((hasEnvApiKey || isApiBaseUrlSetByEnv) && !settings.useCustomApi) {
      // 环境变量有配置且用户未启用自定义，不保存 API 配置到 localStorage
      delete (settingsToSave as Record<string, unknown>).apiKey;
      delete (settingsToSave as Record<string, unknown>).apiBaseUrl;
    }
    saveSettings(settingsToSave);

    // Clear all previous theme classes
    document.body.classList.remove('theme-apple-light', 'theme-apple-dark');

    // Apply theme class
    document.body.classList.add(`theme-${settings.theme}`);

    document.body.dataset.font = settings.fontFamily;

    // Apply font size
    const fontSizeMultiplier = (settings.fontSize || 100) / 100;
    document.documentElement.style.setProperty('--font-size-multiplier', `${fontSizeMultiplier}`);

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
          // 标题生成模型逻辑：优先使用环境变量，否则取列表最后一位
          const envTitleModel = process.env.TITLE_MODEL_NAME?.trim();
          if (envTitleModel) {
            // 环境变量有配置，使用环境变量
            newDefaults.titleGenerationModel = envTitleModel;
          } else if (!models.includes(current.titleGenerationModel)) {
            // 环境变量没有配置，取列表最后一位
            newDefaults.titleGenerationModel = models[models.length - 1] || '';
          }
          return Object.keys(newDefaults).length > 0 ? { ...current, ...newDefaults } : current;
        });
      });
    }
  }, [isStorageLoaded, settings.apiKey, settings.apiBaseUrl, settings.llmProvider]);

  return { settings, setSettings, availableModels, isStorageLoaded };
};

// 导出环境变量配置状态，供设置界面使用
export const isApiKeySetByEnv = hasEnvApiKey;
export const isApiBaseUrlSetByEnv = !!(
  process.env.API_BASE_URL ||
  process.env.OPENAI_API_BASE_URL ||
  (USE_EMERGENCY_ROUTE && process.env.FALLBACK_API_BASE_URL)
);
