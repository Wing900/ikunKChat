import { ILLMService, LLMProvider, ChatRequest, StreamChunk } from '../types';
import { prepareChatPayload } from './payloadBuilder';
import { executeStreamWithKeyRotation } from './apiExecutor';
import { GenerateContentResponse } from '@google/genai';

// 从 chatService.ts 迁移过来的辅助类型
interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string; };
}

export class GeminiService implements ILLMService {
  readonly provider: LLMProvider = 'gemini';

  /**
   * 获取 Gemini 模型列表
   * 从旧的 modelService.ts 迁移而来
   */
  async getAvailableModels(apiKey: string, apiBaseUrl?: string): Promise<string[]> {
    const envModels = ((import.meta as any).env?.VITE_GEMINI_MODELS || '').split(',').map(m => m.trim()).filter(Boolean);
    const sanitizedApiKey = apiKey.trim().replace(/["']/g, '');

    if (!sanitizedApiKey) {
      return envModels;
    }

    try {
      const trimmedApiBaseUrl = apiBaseUrl?.trim();
      const baseUrl = (trimmedApiBaseUrl || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
      const url = `${baseUrl}/v1beta/models`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-goog-api-key': sanitizedApiKey,
        },
      });
      
      if (!response.ok) {
        let errorDetails = `API call failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            errorDetails += `: ${errorData.error.message}`;
          }
        } catch (e) { /* Response was not JSON */ }
        console.warn(`Failed to get model list for API key ...${sanitizedApiKey.slice(-4)}: ${errorDetails}`);
        return envModels;
      }

      const data = await response.json();
      
      if (!data.models || !Array.isArray(data.models)) {
          console.warn("Invalid API response structure when fetching models.");
          return envModels;
      }

      const apiModels = new Set(data.models
        .filter((m: any) =>
          m.name?.startsWith('models/gemini') &&
          m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: any) => m.name.replace('models/', ''))
      );

      // 如果环境变量有值，按环境变量定义的顺序返回（取交集）
      // 如果环境变量为空，返回API的所有模型（保持API原始顺序）
      const availableModels: string[] = envModels.length > 0
        ? envModels.filter(m => apiModels.has(m))
        : Array.from(apiModels) as string[];
      
      return availableModels;
      
    } catch (error) {
      console.warn(`Error fetching models for API key ...${sanitizedApiKey.slice(-4)}:`, error);
      return envModels;
    }
  }

  /**
   * 调用 Gemini API 生成内容流
   * 从旧的 chatService.ts 迁移并适配
   */
  async *generateContentStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const { messages, model, persona, config, apiKey, apiBaseUrl, showThoughts } = request;

    // 1. 准备 Payload
    const { formattedHistory, configForApi } = prepareChatPayload(messages, config, persona, showThoughts);
    
    // 从最后一条用户消息中提取附件和文本内容
    const lastUserMessage = messages[messages.length - 1];
    const attachments = lastUserMessage.attachments || [];
    const newMessage = lastUserMessage.content;

    const messageParts: Part[] = attachments.map(att => ({
        inlineData: { mimeType: att.mimeType, data: att.data! }
    }));
    if (newMessage) messageParts.push({ text: newMessage });

    try {
      // 2. 执行流式请求
      // 注意：executeStreamWithKeyRotation 接受一个API密钥数组，我们这里只传递一个
      const geminiStream: AsyncGenerator<GenerateContentResponse> = executeStreamWithKeyRotation(
        [apiKey], 
        async (ai) => {
          const chat = ai.chats.create({
            model,
            history: formattedHistory,
            config: configForApi,
          });
          return chat.sendMessageStream({ message: messageParts });
        },
        apiBaseUrl
      );

      // 3. 转换流的输出格式
      for await (const geminiChunk of geminiStream) {
        if (geminiChunk.candidates && geminiChunk.candidates.length > 0) {
          const candidate = geminiChunk.candidates[0];
          const content = candidate.content;
          
          if (content && content.parts && content.parts.length > 0) {
            // 检查是否有思考内容的标记
            // Gemini API 在思考模式下会在 parts 中标记 thought
            for (const part of content.parts) {
              if (part.text) {
                // 检查 part 的元数据，判断是 thought 还是 content
                // @ts-ignore - thoughtMetadata 可能存在于 part 对象中
                const isThought = part.thought || part.thoughtMetadata;
                
                if (isThought) {
                  // 这是思考内容
                  yield {
                    type: 'thought',
                    payload: part.text,
                  };
                } else {
                  // 这是普通回复内容
                  yield {
                    type: 'content',
                    payload: part.text,
                  };
                }
              }
            }
          }
        }
      }

    } catch (error: any) {
      console.error("Error in Gemini stream:", error);
      yield {
        type: 'error',
        payload: error.message || 'An unknown error occurred in the Gemini service.',
      };
    } finally {
      // 4. 确保流的末尾有一个 'end' 信号
      yield {
        type: 'end',
        payload: '',
      };
    }
  }
}