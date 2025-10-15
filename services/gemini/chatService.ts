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

  // **新增调试** - 记录实际发送的payload
  const debugPayload = {
    model,
    history: formattedHistory,
    config: configForApi,
    message: messageParts
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Chat Service] Debug Payload:');
    console.log('- History length:', formattedHistory.length);
    console.log('- Message parts count:', messageParts.length);
    console.log('- Config keys:', Object.keys(configForApi));
    console.log('- Total payload size:', JSON.stringify(debugPayload).length, 'characters');

    // 详细分析每条消息的大小和内容
    formattedHistory.forEach((msg, index) => {
      const msgSize = JSON.stringify(msg).length;
      console.log(`  - Message ${index}: ${msgSize} chars, role: ${msg.role}`);

      // **新增** 检查消息内容是否有问题
      if (Array.isArray(msg.parts)) {
        msg.parts.forEach((part, partIndex) => {
          if ('text' in part) {
            const text = part.text;
            // 检查特殊字符和控制字符
            const hasSpecialChars = /[\x00-\x1F\x7F-\x9F]/.test(text);
            const hasInvalidUnicode = /[\uFFFE\uFFFF]/.test(text);
            const hasInvalidUtf16 = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text);

            if (hasSpecialChars || hasInvalidUnicode || hasInvalidUtf16) {
              console.warn(`    ⚠️ Message ${index} Part ${partIndex} contains invalid characters:`, {
                hasSpecialChars,
                hasInvalidUnicode,
                hasInvalidUtf16,
                textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
              });
            }
          }

          if ('inlineData' in part) {
            console.log(`    📷 Message ${index} Part ${partIndex} is image:`, part.inlineData.mimeType, part.inlineData.data?.length ?? 'N/A', 'chars');

            // --- 建议在这里开始添加 ---

            const b64data = part.inlineData.data;

            // 检查数据是否存在
            if (!b64data || typeof b64data !== 'string') {
              console.warn(`    ⚠️ Message ${index} Part ${partIndex} has invalid image data:`, b64data);
              return; // 跳过后续处理
            }

            // 1. 打印一小段 Base64 字符串的开头和结尾，用于肉眼检查
            console.log(`      🖼️ Base64 Snippet (start): ${b64data.substring(0, 80)}]...`);
            console.log(`      🖼️ Base64 Snippet (end): ...[${b64data.substring(b64data.length - 80)}]`);

            // 2. 检查是否存在非 Base64 字符
            //    一个合法的 Base64 字符串只应该包含 A-Z, a-z, 0-9, +, /, =
            const invalidCharRegex = /[^A-Za-z0-9+/=]/;
            const match = b64data.match(invalidCharRegex);
            if (match) {
                console.error(`      ❌ 警告: 在图片数据中发现了非法的 Base64 字符!`, {
                    character: match[0],
                    position: match.index
                });
            } else {
                console.log(`      ✅ 通过: Base64 字符集检查通过。`);
            }

            // 3. 再次确认是否存在 null 字节
            if (b64data.includes('\x00')) {
                console.error(`      ❌ 严重警告: 图片数据中包含 'null' 字节，这几乎一定会导致 API 报错!`);
            }

            // --- 建议在这里结束添加 ---
          }
        });
      }
    });

    // **新增** 尝试序列化整个payload并检查是否有问题
    try {
      const serializedPayload = JSON.stringify(debugPayload);
      console.log('✅ Payload serialization successful');

      // 检查是否有可能导致问题的字符
      if (/\x00/.test(serializedPayload)) {
        console.error('❌ Payload contains null bytes!');
      }
    } catch (error) {
      console.error('❌ Payload serialization failed:', error);
    }
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