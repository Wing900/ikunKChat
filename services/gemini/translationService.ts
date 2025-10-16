import { GenerateContentResponse } from "@google/genai";
import { Settings } from "../../types";
import { executeWithKeyRotation } from './apiExecutor';

export async function detectLanguage(apiKeys: string[], model: string, text: string, settings: Settings): Promise<string> {
  const prompt = `Your task is to identify the language of the following text.
IMPORTANT: Your response MUST contain *only* the BCP-47 language code (e.g., "en", "zh", "es", "fr"). Do not include the language name or any other explanatory text.

Text to identify:
${text}
`;

  try {
    const payload = { model, contents: prompt };
    
    console.log('--- KChat API Call ---');
    console.log('API: detectLanguage (via models.generateContent)');
    console.log('Payload:', payload);
    console.log('----------------------');

    const response = await executeWithKeyRotation<GenerateContentResponse>(apiKeys, (ai) =>
      ai.models.generateContent(payload),
      settings.apiBaseUrl
    );
    return response.text.trim();
  } catch (error) {
    console.error("Error detecting language:", error);
    throw new Error("Language detection failed.");
  }
}

export async function translateText(apiKeys: string[], model: string, text: string, sourceLang: string, targetLang: string, mode: 'natural' | 'literal', settings: Settings): Promise<string> {
  const naturalPrompt = `Your task is to translate the following text from ${sourceLang} to ${targetLang}.
Your translation should be colloquial and evocative, capturing the essence of a native speaker’s speech. Avoid a mechanical, literal translation. Instead, employ idiomatic expressions and natural phrasing that resonate with a native speaker of ${targetLang}.
IMPORTANT: Your response MUST contain *only* the translated text. Do not include the original text, detected language, target language name, or any other explanatory text, preambles, or apologies.

Text to translate:
${text}
`;

  const literalPrompt = `Your task is to translate the following text from ${sourceLang} to ${targetLang}.
Provide a standard, literal translation. Focus on conveying the direct meaning accurately.
IMPORTANT: Your response MUST contain *only* the translated text. Do not include the original text, detected language, target language name, or any other explanatory text, preambles, or apologies.

Text to translate:
${text}
`;

  const prompt = mode === 'natural' ? naturalPrompt : literalPrompt;

  try {
    const payload = { model, contents: prompt };

    console.log('--- KChat API Call ---');
    console.log('API: translateText (via models.generateContent)');
    console.log('Payload:', payload);
    console.log('----------------------');

    const response = await executeWithKeyRotation<GenerateContentResponse>(apiKeys, (ai) =>
      ai.models.generateContent(payload),
      settings.apiBaseUrl
    );
    return response.text.trim();
  } catch (error) {
    console.error("Error translating text:", error);
    throw new Error("Translation failed.");
  }
}