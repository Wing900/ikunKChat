import { GenerateContentResponse, Type } from "@google/genai";
import { Message, FileAttachment, Settings, Persona, PersonaMemory } from '../../types';
import { executeWithKeyRotation, executeStreamWithKeyRotation } from './apiExecutor';
import { prepareChatPayload } from "./payloadBuilder";

interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string; };
}

export function sendMessageStream(apiKeys: string[], messages: Message[], newMessage: string, attachments: FileAttachment[], model: string, settings: Settings, toolConfig: any, persona?: Persona | null, isStudyMode?: boolean, memories?: PersonaMemory[]): AsyncGenerator<GenerateContentResponse> {
  const { formattedHistory, configForApi } = prepareChatPayload(messages, settings, toolConfig, persona, isStudyMode, memories);
  const messageParts: Part[] = attachments.map(att => ({
      inlineData: { mimeType: att.mimeType, data: att.data! }
  }));
  if (newMessage) messageParts.push({ text: newMessage });

  // 开发环境下的简化日志
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Chat] Sending message - History: ${formattedHistory.length} msgs, Attachments: ${attachments.length}`);
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

export async function generateSuggestedReplies(apiKeys: string[], history: Message[], model: string, settings: Settings): Promise<string[]> {
  try {
    const payload = {
      model,
      contents: [
        ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] })),
        { role: 'user' as const, parts: [{ text: '针对最后一条消息建议三个简短、简洁且相关的回复。用户正在寻找快速回复。' }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { replies: { type: Type.ARRAY, items: { type: Type.STRING } } }
        }
      }
    };

    const response = await executeWithKeyRotation<GenerateContentResponse>(apiKeys, (ai) =>
      ai.models.generateContent(payload),
      settings.apiBaseUrl
    );

    const jsonText = response.text.trim();
    if (jsonText) {
      const result = JSON.parse(jsonText);
      return result.replies || [];
    }
    return [];
  } catch (error) {
    console.error("Error generating suggested replies:", error);
    return [];
  }
}