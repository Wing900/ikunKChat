import { GenerateContentResponse, Type } from "@google/genai";
import { Persona, Settings } from '../../types';
import { executeWithKeyRotation } from './apiExecutor';

export async function generatePersonaUpdate(apiKeys: string[], model: string, currentPersona: Persona, userInstruction: string, settings: Settings): Promise<{ personaUpdate: Partial<Persona>, explanation: string }> {
  const systemPrompt = `You are an AI assistant that helps users configure a persona for a chatbot. The user will provide their current persona configuration as a JSON object and an instruction on how to modify it.
Your task is to generate a JSON object representing the *updated* fields of the persona, and a short, friendly explanation of the changes you made.

Current Persona:
${JSON.stringify(currentPersona, null, 2)}

User Instruction:
"${userInstruction}"

Respond ONLY with a JSON object with two keys: "personaUpdate" (containing only the changed fields) and "explanation" (a brief, conversational string describing what you did).
For example, if the user says "make it a pirate", you might change the name, bio, and system prompt.
The 'tools' property is a boolean map: { "googleSearch": boolean, "codeExecution": boolean, "urlContext": boolean }.
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