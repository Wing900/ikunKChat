import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeyManager } from '../keyManager';

/**
 * Executes a non-streaming API call with key rotation and retry logic.
 */
export async function executeWithKeyRotation<T>(
    apiKeys: string[],
    operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
    const keyManager = new KeyManager(apiKeys);
    if (keyManager.getTotalKeys() === 0) {
        throw new Error("No API keys provided.");
    }

    for (let i = 0; i < keyManager.getTotalKeys(); i++) {
        const { key } = keyManager.getNextKey();
        if (!key) continue;

        try {
            const ai = new GoogleGenAI({ apiKey: key });
            const result = await operation(ai);
            keyManager.saveSuccessIndex();
            return result;
        } catch (error) {
            console.warn(`API call failed with key ending in ...${key.slice(-4)}. Trying next key. Error:`, error);
            if (i === keyManager.getTotalKeys() - 1) {
                console.error("All API keys failed.");
                throw error;
            }
        }
    }
    throw new Error("All API keys failed.");
}


/**
 * Executes a streaming API call with key rotation and retry logic.
 */
export async function* executeStreamWithKeyRotation<T extends GenerateContentResponse>(
    apiKeys: string[],
    operation: (ai: GoogleGenAI) => Promise<AsyncGenerator<T>>
): AsyncGenerator<T> {
    const keyManager = new KeyManager(apiKeys);
    if (keyManager.getTotalKeys() === 0) {
        yield { text: "Error: No API keys provided." } as T;
        return;
    }

    let lastError: any = null;
    for (let i = 0; i < keyManager.getTotalKeys(); i++) {
        const { key } = keyManager.getNextKey();
        if (!key) continue;

        try {
            const ai = new GoogleGenAI({ apiKey: key });
            const stream = await operation(ai);
            keyManager.saveSuccessIndex();
            yield* stream; // Yield all chunks from the successful stream
            return; // Success, exit the generator
        } catch (error) {
            lastError = error;
            console.warn(`API stream failed for key ending in ...${key.slice(-4)}. Trying next key. Error:`, error);
        }
    }

    console.error("All API keys failed for streaming operation.");
    yield { text: "Error: All API keys failed. " + (lastError?.message || "") } as T;
}
