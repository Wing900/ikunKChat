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
    const { model, persona, config, apiKey, apiBaseUrl, showThoughts } = request;
    
    const baseUrl = (apiBaseUrl?.trim() || 'https://api.openai.com').replace(/\/$/, '');
    const url = `${baseUrl}/v1/chat/completions`;

    const payload = {
      model,
      messages: prepareOpenAIPayload(request.messages, persona),
      temperature: config.temperature,
      max_tokens: Math.min(config.maxOutputTokens, 65536),
      stream: true,
    };

    let streamEnded = false;

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
        let errorMessage = `OpenAI API Error (${response.status})`;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.error?.message || response.statusText;
        } catch (e) {
          errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
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
              streamEnded = true;
              break; // 流结束，跳出循环
            }
            try {
              const parsed = JSON.parse(data);
              const choice = parsed.choices?.[0];
              
              if (choice) {
                const delta = choice.delta;
                const finishReason = choice.finish_reason;
                
                // 处理思维链内容（o1系列模型）
                // OpenAI o1模型使用 reasoning_content 字段
                if (delta?.reasoning_content && showThoughts) {
                  yield { type: 'thought', payload: delta.reasoning_content };
                }
                
                // 处理普通回复内容
                if (delta?.content) {
                  yield { type: 'content', payload: delta.content };
                }

                // 检查结束原因
                if (finishReason) {
                  if (finishReason === 'length') {
                    console.warn('OpenAI: Response truncated due to max_tokens limit');
                  } else if (finishReason === 'content_filter') {
                    console.warn('OpenAI: Response filtered due to content policy');
                  }
                  streamEnded = true;
                }
              }
            } catch (e) {
              console.error("Failed to parse SSE data chunk:", data);
            }
          }
        }
        
        if (streamEnded) break;
      }

    } catch (error: any) {
      console.error("Error in OpenAI stream:", error);
      yield {
        type: 'error',
        payload: error.message || 'An unknown error occurred in the OpenAI service.'
      };
    } finally {
      // 确保流的末尾有一个 'end' 信号
      yield { type: 'end', payload: '' };
    }
  }
}