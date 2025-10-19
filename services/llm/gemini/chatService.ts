import { GenerateContentResponse, Type } from "@google/genai";
import { Message, FileAttachment, Settings, Persona } from '../../../types';
import { executeWithKeyRotation, executeStreamWithKeyRotation } from './apiExecutor';
import { prepareChatPayload } from "./payloadBuilder";

// New helper function for the dedicated title generation API
async function generateTitleWithDedicatedAPI(prompt: string): Promise<{ title: string }> {
  const apiUrl = process.env.TITLE_API_URL;
  const apiKey = process.env.TITLE_API_KEY;
  const modelName = process.env.TITLE_MODEL_NAME;

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
    console.error("Dedicated API call failed:", error);
    // Fallback to extracting from prompt on dedicated API failure
    const fallbackTitle = prompt.substring(prompt.lastIndexOf('\n') + 1).substring(0, 40) || 'New Chat';
    return { title: fallbackTitle };
  }
}

export async function generateChatDetails(apiKeys: string[], prompt: string, model: string, settings: Settings): Promise<{ title: string }> {
  // Check if dedicated title generation API is configured
  if (process.env.TITLE_API_URL && process.env.TITLE_API_KEY && process.env.TITLE_MODEL_NAME) {
    return generateTitleWithDedicatedAPI(prompt);
  }

  // Fallback to existing Gemini logic
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
    
    const fallbackTitle = prompt.substring(prompt.lastIndexOf('\n') + 1).substring(0, 40) || 'New Chat';
    return { title: fallbackTitle };
  } catch (error) {
    console.error("Failed to generate title:", error);
    const fallbackTitle = prompt.substring(prompt.lastIndexOf('\n') + 1).substring(0, 40) || 'New Chat';
    return { title: fallbackTitle };
  }
}
