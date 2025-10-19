import { ILLMService, LLMProvider, ChatRequest, StreamChunk } from '../types';
import { prepareOpenAIPayload } from './payloadBuilder';

export class OpenAIService implements ILLMService {
  readonly provider: LLMProvider = 'openai';

  /**
   * 获取 OpenAI 兼容 API 的模型列表
   */
  async getAvailableModels(apiKey: string, apiBaseUrl?: string): Promise<string[]> {
    const envModels = ((import.meta as any).env?.VITE_OPENAI_MODELS || '').split(',').map(m => m.trim()).filter(Boolean);
    const sanitizedApiKey = apiKey.trim().replace(/["']/g, '');
    if (!sanitizedApiKey) {
      return envModels;
    }

    const baseUrl = (apiBaseUrl?.trim() || 'https://api.openai.com').replace(/\/$/, '');
    const url = `${baseUrl}/v1/models`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sanitizedApiKey}`,
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch models from OpenAI API, status: ${response.status}`);
        return envModels;
      }

      const data = await response.json();
      const apiModels = new Set(data.data.map((m: any) => m.id));
      
      // 如果环境变量有值，按环境变量定义的顺序返回（取交集）
      // 如果环境变量为空，返回API的所有模型（保持API原始顺序）
      const availableModels: string[] = envModels.length > 0
        ? envModels.filter(m => apiModels.has(m))
        : Array.from(apiModels) as string[];

      return availableModels;

    } catch (error) {
      console.error("Error fetching OpenAI models:", error);
      return envModels;
    }
  }

  /**
   * 调用 OpenAI 兼容 API 生成内容流
   */
  async *generateContentStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const { model, persona, config, apiKey, apiBaseUrl } = request;
    
    const baseUrl = (apiBaseUrl?.trim() || 'https://api.openai.com').replace(/\/$/, '');
    const url = `${baseUrl}/v1/chat/completions`;

    const payload = {
      model,
      messages: prepareOpenAIPayload(request.messages, persona),
      temperature: config.temperature,
      max_tokens: config.maxOutputTokens,
      stream: true,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`OpenAI API Error: ${errorBody.error?.message || response.statusText}`);
      }

      // 处理 Server-Sent Events (SSE)
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable.");
      }
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data.trim() === '[DONE]') {
              return; // 流结束
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                yield { type: 'content', payload: delta };
              }
            } catch (e) {
              console.error("Failed to parse SSE data chunk:", data);
            }
          }
        }
      }

    } catch (error: any) {
      console.error("Error in OpenAI stream:", error);
      yield { type: 'error', payload: error.message };
    } finally {
      yield { type: 'end', payload: '' };
    }
  }
}