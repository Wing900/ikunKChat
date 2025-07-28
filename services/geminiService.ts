import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { Message, MessageRole, FileAttachment, Settings, CustomSystemPrompt } from '../types';

const aiInstances = new Map<string, GoogleGenAI>();

function getAi(apiKey: string): GoogleGenAI {
    if (!apiKey) throw new Error("API key is not provided.");
    if (aiInstances.has(apiKey)) return aiInstances.get(apiKey)!;
    
    const newAi = new GoogleGenAI({ apiKey });
    aiInstances.set(apiKey, newAi);
    return newAi;
}

interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

function constructSystemPrompt(promptData: CustomSystemPrompt): string {
    const parts = [];
    if (promptData.nickname) parts.push(`You are ${promptData.nickname}.`);
    if (promptData.persona) parts.push(`Your persona is: ${promptData.persona}.`);
    if (promptData.behavior) parts.push(`Your behavior should be: ${promptData.behavior}.`);
    if (promptData.rules) parts.push(`Follow these rules: ${promptData.rules}.`);
    return parts.join(' ').trim();
}

function getChat(apiKey: string, history: Message[], model: string, settings: Settings, toolConfig: any): Chat {
  const ai = getAi(apiKey);
  const formattedHistory = history.map(msg => {
    const parts: Part[] = [];
    if (msg.attachments) {
      parts.push(...msg.attachments.map(att => ({ inlineData: { mimeType: att.mimeType, data: att.data! } })));
    }
    if(msg.content) {
        parts.push({ text: msg.content });
    }
    return { role: msg.role, parts: parts };
  });

  let systemInstruction = 'You are KChat, a helpful and friendly AI assistant. Keep your responses concise and informative.';
  if (settings.useCustomSystemPrompt) {
      const customPrompt = constructSystemPrompt(settings.customSystemPrompt);
      if (customPrompt) {
          systemInstruction = customPrompt;
      }
  }

  const isSearchForced = toolConfig.googleSearch;
  if (isSearchForced) {
    systemInstruction += ' The user has explicitly enabled Google Search for this query, so you MUST use it to answer the request and provide citations.';
  } else if (settings.defaultSearch) {
    systemInstruction += ' By default, Google Search is available; use it only for queries that require recent information, real-time data, or specific facts. Use it judiciously.';
  }

  const toolsForApi: any[] = [];
  if (toolConfig.codeExecution) toolsForApi.push({ codeExecution: {} });
  if (toolConfig.urlContext.enabled) toolsForApi.push({ urlContext: {} });
  if (isSearchForced || settings.defaultSearch) toolsForApi.push({ googleSearch: {} });
  
  const configForApi: any = { systemInstruction, tools: toolsForApi };
  if (toolConfig.showThoughts) {
    configForApi.thinkingConfig = { includeThoughts: true };
  }

  return ai.chats.create({
    model: model,
    history: formattedHistory,
    config: configForApi,
  });
}

export async function* sendMessageStream(apiKey: string, messages: Message[], newMessage: string, attachments: FileAttachment[], model: string, settings: Settings, toolConfig: any): AsyncGenerator<GenerateContentResponse> {
  try {
    const chat = getChat(apiKey, messages, model, settings, toolConfig);
    const messageParts: Part[] = attachments.map(att => ({
        inlineData: { mimeType: att.mimeType, data: att.data! }
    }));
    if (newMessage) messageParts.push({ text: newMessage });
    
    const result = await chat.sendMessageStream({ message: messageParts });
    for await (const chunk of result) {
      yield chunk;
    }

  } catch (error) {
    console.error("Error sending message:", error);
    // Yield an error-like response that conforms to the GenerateContentResponse type
    const errorResponse = {
        text: "I'm sorry, I encountered an error. Please check your API key and try again.",
        candidates: [],
        data: "",
        functionCalls: [],
        executableCode: [],
        codeExecutionResult: null
    } as unknown as GenerateContentResponse;
    yield errorResponse;
  }
}

export async function generateChatDetails(apiKey: string, prompt: string, model: string): Promise<{ title: string; icon: string }> {
  try {
    const ai = getAi(apiKey);
    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate a short, concise title (max 5 words) and a single, relevant emoji for a conversation starting with this user prompt: "${prompt}"`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, icon: { type: Type.STRING } } }
      },
    });
    const details = JSON.parse(response.text.trim());
    if (typeof details.title === 'string' && typeof details.icon === 'string') {
       return { title: details.title.replace(/["']/g, "").trim(), icon: details.icon };
    }
    throw new Error("Invalid JSON structure from Gemini");
  } catch (error) {
    console.error("Error generating chat details:", error);
    return { title: "New Chat", icon: "💬" };
  }
}

export async function generateSuggestedReplies(apiKey: string, history: Message[], model: string): Promise<string[]> {
  if (history.length === 0) return [];
  try {
    const ai = getAi(apiKey);
    const lastMessageContent = history[history.length - 1].content;
    const response = await ai.models.generateContent({
      model: model,
      contents: `The AI just said: "${lastMessageContent}". Generate 4 very short, distinct, and relevant one-tap replies for the user. Return ONLY a JSON array of 4 strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    const replies = JSON.parse(response.text.trim());
    return Array.isArray(replies) ? replies.slice(0, 4) : [];
  } catch (error) {
    console.error("Error generating suggested replies:", error);
    return [];
  }
}