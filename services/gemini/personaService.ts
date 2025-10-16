import { GenerateContentResponse, Type } from "@google/genai";
import { Persona, Settings } from '../../types';
import { executeWithKeyRotation } from './apiExecutor';

export async function generatePersonaUpdate(apiKeys: string[], model: string, currentPersona: Persona, userInstruction: string, settings: Settings): Promise<{ personaUpdate: Partial<Persona>, explanation: string }> {
  const systemPrompt = `你是一个AI助手，帮助用户配置聊天机器人的角色。用户将提供他们当前的角色配置（JSON对象）和如何修改的指令。
你的任务是生成一个JSON对象，表示角色的*更新*字段，以及关于你所做的更改的简短友好的解释。

当前角色:
${JSON.stringify(currentPersona, null, 2)}

用户指令:
"${userInstruction}"

仅使用包含两个键的JSON对象响应: "personaUpdate"（包含仅更改的字段）和"explanation"（描述你操作的简短对话式字符串）。
例如，如果用户说"让它成为海盗"，你可能会更改姓名、简介和系统提示。
'tools'属性是一个布尔映射: { "googleSearch": boolean, "codeExecution": boolean, "urlContext": boolean }。
`;

  try {
    const payload = {
      model,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personaUpdate: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, nullable: true },
                avatar: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: {
                      type: { type: Type.STRING },
                      value: { type: Type.STRING }
                  }
                },
                bio: { type: Type.STRING, nullable: true },
                systemPrompt: { type: Type.STRING, nullable: true },
                tools: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: {
                    googleSearch: { type: Type.BOOLEAN, nullable: true },
                    codeExecution: { type: Type.BOOLEAN, nullable: true },
                    urlContext: { type: Type.BOOLEAN, nullable: true }
                  }
                }
              }
            },
            explanation: { type: Type.STRING }
          }
        }
      }
    };

    console.log('--- KChat API Call ---');
    console.log('API: generatePersonaUpdate (via models.generateContent)');
    console.log('Payload:', payload);
    console.log('----------------------');
    
    const response = await executeWithKeyRotation<GenerateContentResponse>(apiKeys, (ai) =>
      ai.models.generateContent(payload),
      settings.apiBaseUrl
    );

    const jsonText = response.text.trim();
    if (jsonText) return JSON.parse(jsonText);
    
    throw new Error("Empty response from AI for persona update.");
  } catch (error) {
    console.error("Error generating persona update:", error);
    throw new Error("Failed to update persona with AI. Please try again.");
  }
}