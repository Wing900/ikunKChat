import { GenerateContentResponse, Type } from "@google/genai";
import { Message, FileAttachment, Settings, Persona } from '../../types';
import { executeWithKeyRotation, executeStreamWithKeyRotation } from './apiExecutor';
import { prepareChatPayload } from "./payloadBuilder";

interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string; };
}

export function sendMessageStream(apiKeys: string[], messages: Message[], newMessage: string, attachments: FileAttachment[], model: string, settings: Settings, toolConfig: any, persona?: Persona | null, isStudyMode?: boolean): AsyncGenerator<GenerateContentResponse> {
  const { formattedHistory, configForApi } = prepareChatPayload(messages, settings, toolConfig, persona, isStudyMode);
  const messageParts: Part[] = attachments.map(att => ({
      inlineData: { mimeType: att.mimeType, data: att.data! }
  }));
  if (newMessage) messageParts.push({ text: newMessage });
  
  const streamPayload = {
    model,
    history: formattedHistory,
    config: configForApi,
    message: messageParts
  };
  console.log('--- KChat API Call ---');
  console.log('API: sendMessageStream (via chat.sendMessageStream)');
  console.log('Payload:', streamPayload);
  console.log('----------------------');

  return executeStreamWithKeyRotation(apiKeys, async (ai) => {
    const chat = ai.chats.create({
      model,
      history: formattedHistory,
      config: configForApi,
    });
    return chat.sendMessageStream({ message: messageParts });
  }, settings.apiBaseUrl);
}

export async function generateChatDetails(apiKeys: string[], prompt: string, model: string, settings: Settings): Promise<{ title: string; icon: string }> {
  try {
    const payload = {
      model: model,
      contents: `Generate a short, concise title (max 5 words) and a single, relevant emoji for a conversation starting with this user prompt: "${prompt}"`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, icon: { type: Type.STRING } } }
      },
    };
    
    console.log('--- KChat API Call ---');
    console.log('API: generateChatDetails (via models.generateContent)');
    console.log('Payload:', payload);
    console.log('----------------------');

    const response = await executeWithKeyRotation<GenerateContentResponse>(apiKeys, (ai) => 
      ai.models.generateContent(payload),
      settings.apiBaseUrl
    );

    const jsonText = response.text.trim();
    if (jsonText) {
      const result = JSON.parse(jsonText);
      return { title: result.title, icon: result.icon };
    }
    return { title: prompt.substring(0, 40) || 'New Chat', icon: '💬' };
  } catch (error) {
    console.error("Error generating chat details:", error);
    return { title: prompt.substring(0, 40) || 'New Chat', icon: '💬' };
  }
}

export async function generateSuggestedReplies(apiKeys: string[], history: Message[], model: string, settings: Settings): Promise<string[]> {
  try {
    const payload = {
      model,
      contents: [
        ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] })),
        { role: 'user' as const, parts: [{ text: 'Suggest three short, concise, and relevant replies to the last message. The user is looking for quick responses.' }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { replies: { type: Type.ARRAY, items: { type: Type.STRING } } }
        }
      }
    };
    
    console.log('--- KChat API Call ---');
    console.log('API: generateSuggestedReplies (via models.generateContent)');
    console.log('Payload:', payload);
    console.log('----------------------');

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