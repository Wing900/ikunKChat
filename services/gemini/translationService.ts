import { GenerateContentResponse } from "@google/genai";
import { executeWithKeyRotation } from './apiExecutor';

export async function detectLanguage(apiKeys: string[], model: string, text: string): Promise<string> {
  if (!text.trim()) return 'en'; // Default to English for empty string
  try {
    const payload = {
      model,
      contents: `Detect the primary language of the following text and return ONLY its two-letter ISO 639-1 code. For example, for "Hello world", return "en". For "你好世界", return "zh".\n\nText: "${text}"`,
    };

    console.log('--- KChat API Call ---');
    console.log('API: detectLanguage (via models.generateContent)');
    console.log('Payload:', payload);
    console.log('----------------------');

    const response = await executeWithKeyRotation<GenerateContentResponse>(apiKeys, (ai) =>
      ai.models.generateContent(payload)
    );
    const langCode = response.text.trim().toLowerCase();
    return (langCode.length === 2 || langCode.length === 3) ? langCode : 'en';
  } catch (error) {
    console.error("Error detecting language:", error);
    throw new Error("Language detection failed.");
  }
}

export async function translateText(apiKeys: string[], model: string, text: string, sourceLang: string, targetLang: string, mode: 'natural' | 'literal'): Promise<string> {
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
      ai.models.generateContent(payload)
    );
    return response.text.trim();
  } catch (error) {
    console.error("Error translating text:", error);
    throw new Error("Translation failed.");
  }
}
