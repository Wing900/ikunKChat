


import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { Message, MessageRole, FileAttachment, Settings, Persona } from '../types';

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

function getChat(apiKey: string, history: Message[], model: string, settings: Settings, toolConfig: any, persona?: Persona | null): Chat {
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

  let systemInstruction = persona?.systemPrompt || 'You are KChat, a helpful and friendly AI assistant. Keep your responses concise and informative.';
  
  const useGoogleSearch = persona?.tools.googleSearch || settings.defaultSearch;
  const useCodeExecution = toolConfig.codeExecution || persona?.tools.codeExecution;
  const useUrlContext = toolConfig.urlContext || persona?.tools.urlContext;
  
  const toolsForApi: any[] = [];
  let isSearchEnabled = toolConfig.googleSearch || useGoogleSearch;

  // Handle mutual exclusivity and tool configuration
  if (useCodeExecution) {
    toolsForApi.push({ codeExecution: {} });
    // URL Context is disabled if Code Execution is active
    if (useUrlContext) {
      systemInstruction += '';
    }
  } else if (useUrlContext) {
    // If URL context is enabled, it needs Google Search to function.
    isSearchEnabled = true; 
    systemInstruction += '';
  }

  // Add Google Search tool if it's enabled by any means.
  if (isSearchEnabled) {
    toolsForApi.push({ googleSearch: {} });
  }

  // Add specific instructions for search if it was explicitly toggled for this query
  if (toolConfig.googleSearch) {
    systemInstruction += ' The user has explicitly enabled Google Search for this query, so you should prioritize its use to answer the request and provide citations.';
  } else if (useGoogleSearch && !useUrlContext) { // Avoid duplicating search instructions
    systemInstruction += ' By default, Google Search is available; use it only for queries that require recent information, real-time data, or specific facts. Use it judiciously.';
  }
  
  const configForApi: any = { systemInstruction, tools: toolsForApi.length > 0 ? toolsForApi : undefined };
  if (toolConfig.showThoughts) {
    configForApi.thinkingConfig = { includeThoughts: true };
  }

  return ai.chats.create({
    model: model,
    history: formattedHistory,
    config: configForApi,
  });
}

export async function* sendMessageStream(apiKey: string, messages: Message[], newMessage: string, attachments: FileAttachment[], model: string, settings: Settings, toolConfig: any, persona?: Persona | null): AsyncGenerator<GenerateContentResponse> {
  try {
    const chat = getChat(apiKey, messages, model, settings, toolConfig, persona);
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

export async function generatePersonaUpdate(apiKey: string, model: string, currentPersona: Partial<Persona>, request: string): Promise<{ personaUpdate: Partial<Persona>, explanation: string }> {
  try {
    const ai = getAi(apiKey);
    const systemInstruction = `You are an AI assistant that helps build another AI's persona. The user will give you instructions. You MUST respond with only a valid JSON object. This object must contain two keys: "personaUpdate" and "explanation".
The "personaUpdate" key holds an object with the fields to be updated in the Persona object: {name: string, bio: string, systemPrompt: string, avatar: {type: 'emoji' | 'url', value: string}, tools: {googleSearch: boolean, codeExecution: boolean, urlContext: boolean}}.
Only include fields that need changing in "personaUpdate".
If the user's request is creative (e.g., "make it a pirate") and the current persona state has empty fields like "bio" or "avatar", you MUST creatively generate appropriate content for them.
The "explanation" key holds a short, conversational string explaining what changes you made.
Example Response:
{"personaUpdate": {"name": "Salty Dog", "bio": "A swashbuckling pirate captain, smells of rum.", "systemPrompt": "You are a pirate AI...", "avatar": {"type": "emoji", "value": "🏴‍☠️"}}, "explanation": "Aye, I've updated the persona to be a swashbuckling pirate captain for ye, complete with a new bio and a proper flag!"}`;
    
    const prompt = `Current Persona State: ${JSON.stringify(currentPersona)}\n\nUser Request: "${request}"\n\nGenerate the JSON update object:`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personaUpdate: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, nullable: true },
                bio: { type: Type.STRING, nullable: true },
                systemPrompt: { type: Type.STRING, nullable: true },
                avatar: { type: Type.OBJECT, nullable: true, properties: { type: { type: Type.STRING, enum: ['emoji', 'url'] }, value: { type: Type.STRING } } },
                tools: { type: Type.OBJECT, nullable: true, properties: { googleSearch: { type: Type.BOOLEAN }, codeExecution: { type: Type.BOOLEAN }, urlContext: { type: Type.BOOLEAN } } }
              }
            },
            explanation: {
                type: Type.STRING,
                description: "A short, conversational explanation of the changes made."
            }
          },
          required: ['personaUpdate', 'explanation']
        }
      }
    });
    
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error generating persona update:", error);
    throw error;
  }
}