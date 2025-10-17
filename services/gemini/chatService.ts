import { GenerateContentResponse, Type } from "@google/genai";
import { Message, FileAttachment, Settings, Persona, PersonaMemory } from '../../types';
import { executeWithKeyRotation, executeStreamWithKeyRotation } from './apiExecutor';
import { prepareChatPayload } from "./payloadBuilder";

interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string; };
}

export function sendMessageStream(apiKeys: string[], messages: Message[], newMessage: string, attachments: FileAttachment[], model: string, settings: Settings, persona?: Persona | null, isStudyMode?: boolean, memories?: PersonaMemory[]): AsyncGenerator<GenerateContentResponse> {
  const { formattedHistory, configForApi } = prepareChatPayload(messages, settings, persona, isStudyMode, memories);
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
  console.log(`[Title Gen] Starting - Prompt: "${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}", Model: ${model}`);
  
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
      console.log(`[Title Gen] ✅ Success - Title: "${title}"`);
      return { title };
    }
    
    console.warn('[Title Gen] ⚠️ Empty response, using fallback');
    const fallbackTitle = prompt.substring(prompt.lastIndexOf('\n') + 1).substring(0, 40) || 'New Chat';
    return { title: fallbackTitle };
  } catch (error) {
    console.error("[Title Gen] ❌ Error:", error);
    const fallbackTitle = prompt.substring(prompt.lastIndexOf('\n') + 1).substring(0, 40) || 'New Chat';
    return { title: fallbackTitle };
  }
}