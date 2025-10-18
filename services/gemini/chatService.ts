import { GenerateContentResponse, Type } from "@google/genai";
import { Message, FileAttachment, Settings, Persona } from '../../types';
import { executeWithKeyRotation, executeStreamWithKeyRotation } from './apiExecutor';
import { prepareChatPayload } from "./payloadBuilder";

// New helper function for the dedicated title generation API
async function generateTitleWithDedicatedAPI(prompt: string): Promise<{ title: string }> {
  const apiUrl = process.env.TITLE_API_URL;
  const apiKey = process.env.TITLE_API_KEY;
  const modelName = process.env.TITLE_MODEL_NAME;

  console.log(`[标题生成] 检测到专用API，使用专用API进行生成。模型: ${modelName}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false, // Ensure it's not a streaming request
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim().replace(/["']/g, '');

    if (title) {
      return { title };
    } else {
      throw new Error('Invalid response structure from dedicated title API');
    }
  } catch (error) {
    console.error("[标题生成] 专用API调用失败:", error);
    // Fallback to extracting from prompt on dedicated API failure
    const fallbackTitle = prompt.substring(prompt.lastIndexOf('\n') + 1).substring(0, 40) || 'New Chat';
    return { title: fallbackTitle };
  }
}

interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string; };
}

export function sendMessageStream(apiKeys: string[], messages: Message[], newMessage: string, attachments: FileAttachment[], model: string, settings: Settings, persona?: Persona | null): AsyncGenerator<GenerateContentResponse> {
  const { formattedHistory, configForApi } = prepareChatPayload(messages, settings, persona);
  const messageParts: Part[] = attachments.map(att => ({
      inlineData: { mimeType: att.mimeType, data: att.data! }
  }));
  if (newMessage) messageParts.push({ text: newMessage });

  // 开发环境下的简化日志
  if (process.env.NODE_ENV === 'development') {
    console.log(`[聊天] 发送消息 - 历史记录: ${formattedHistory.length} 条消息, 附件: ${attachments.length}`);
  }

  return executeStreamWithKeyRotation(apiKeys, async (ai) => {
    const chat = ai.chats.create({
      model,
      history: formattedHistory,
      config: configForApi,
    });
    return chat.sendMessageStream({ message: messageParts });
  }, settings.apiBaseUrl);
}

export async function generateChatDetails(apiKeys: string[], prompt: string, model: string, settings: Settings): Promise<{ title: string }> {
  // Check if dedicated title generation API is configured
  if (process.env.TITLE_API_URL && process.env.TITLE_API_KEY && process.env.TITLE_MODEL_NAME) {
    return generateTitleWithDedicatedAPI(prompt);
  }

  // Fallback to existing Gemini logic
  console.log(`[标题生成] 未检测到专用API，回退使用 ${model} 模型生成。`);
  
  try {
    const payload = {
      model: model,
      contents: prompt,
    };

    const response = await executeWithKeyRotation<GenerateContentResponse>(apiKeys, (ai) =>
      ai.models.generateContent(payload),
      settings.apiBaseUrl
    );

    const title = response.text.trim().replace(/["']/g, ''); // 移除引号
    if (title) {
      return { title };
    }
    
    console.warn('[标题生成] ⚠️ 模型返回内容为空，使用备用标题');
    const fallbackTitle = prompt.substring(prompt.lastIndexOf('\n') + 1).substring(0, 40) || 'New Chat';
    return { title: fallbackTitle };
  } catch (error) {
    console.error("[标题生成] ❌ 使用回退模型生成时出错:", error);
    const fallbackTitle = prompt.substring(prompt.lastIndexOf('\n') + 1).substring(0, 40) || 'New Chat';
    return { title: fallbackTitle };
  }
}
