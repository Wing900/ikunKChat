import { Settings } from '../../types';
import { GeminiService } from './gemini/GeminiService';
import { OpenAIService } from './openai/OpenAIService';
import { ILLMService } from './types';

// 为每个服务创建一个单例，避免在每次调用时重复实例化，提高效率。
const geminiService = new GeminiService();
const openAIService = new OpenAIService();

/**
 * LLM 服务工厂函数
 * 根据用户的设置，动态地创建并返回相应的LLM服务实例。
 * @param settings - 从 useSettings hook 获取的应用全局设置对象
 * @returns 返回一个实现了 ILLMService 接口的服务实例
 */
export function createLLMService(settings: Settings): ILLMService {
  // 从设置中获取用户选择的提供商，如果未设置，则默认为 'gemini'
  const provider = settings.llmProvider || 'gemini';

  switch (provider) {
    case 'openai':
      return openAIService;
    case 'gemini':
    default:
      return geminiService;
  }
}