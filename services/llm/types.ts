import { Message, Persona, Settings } from '../../types';

/**
 * 定义支持的LLM提供商
 */
export type LLMProvider = 'gemini' | 'openai';

/**
 * 定义单个模型的配置参数
 */
export interface ModelConfig {
  temperature?: number;
  maxOutputTokens?: number;
  contextLength?: number;
}

/**
 * 定义发送给LLM服务进行聊天的统一请求结构
 */
export interface ChatRequest {
  messages: Message[];
  model: string;
  persona: Persona;
  config: ModelConfig;
  apiKey: string;
  apiBaseUrl?: string;
  // 用于流式响应中途出现问题时，进行重试
  retryCount?: number;
  // 用于 prepareChatPayload 的 showThoughts 标志
  showThoughts?: boolean;
  // 用于启用 Gemini 内置搜索 (Google Search Retrieval)
  enableSearch?: boolean;
}

/**
 * 定义流式响应中每个数据块的统一结构
 */
export interface StreamChunk {
  type: 'content' | 'thought' | 'tool_code' | 'error' | 'end';
  payload: string;
  metadata?: any; // 可选的元数据，例如用于引用
}

/**
 * 定义所有LLM服务必须实现的统一接口
 */
export interface ILLMService {
  /**
   * 服务的提供商标识
   */
  readonly provider: LLMProvider;

  /**
   * 获取该服务可用的模型列表
   * @param apiKey - 用于验证的API密钥
   * @param apiBaseUrl - （可选）API的基础URL
   * @returns 返回一个包含模型名称字符串的数组
   */
  getAvailableModels(apiKey: string, apiBaseUrl?: string): Promise<string[]>;

  /**
   * 发送聊天请求并以流式方式获取响应
   * @param request - 包含消息、模型配置等信息的请求对象
   * @returns 返回一个异步生成器，可以逐块yield出StreamChunk
   */
  generateContentStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown>;
}