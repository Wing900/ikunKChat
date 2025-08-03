import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeyManager } from '../keyManager';

/**
 * Executes a non-streaming API call with key rotation and retry logic,
 * proxying requests to a custom endpoint if provided.
 */
export async function executeWithKeyRotation<T>(
    apiKeys: string[],
    operation: (ai: GoogleGenAI) => Promise<T>,
    apiEndpoint?: string,
): Promise<T> {
    const keyManager = new KeyManager(apiKeys);
    if (keyManager.getTotalKeys() === 0) {
        throw new Error("No API keys provided.");
    }

    const originalFetch = window.fetch;
    let proxyActive = false;
    const trimmedApiEndpoint = apiEndpoint?.trim();

    if (trimmedApiEndpoint) {
        try {
            const proxyUrl = new URL(trimmedApiEndpoint);
            proxyActive = true;
            window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
                let urlString = input instanceof Request ? input.url : String(input);
                if (urlString.includes('generativelanguage.googleapis.com')) {
                    const originalUrl = new URL(urlString);
                    const finalProxyUrl = new URL(proxyUrl);
                    
                    const newPathname = (finalProxyUrl.pathname.replace(/\/$/, '') + originalUrl.pathname).replace(/\/\//g, '/');
                    finalProxyUrl.pathname = newPathname;
                    finalProxyUrl.search = originalUrl.search;
                    
                    urlString = finalProxyUrl.toString();
                }
                return originalFetch(urlString, init);
            };
        } catch (e) {
            console.error("Invalid API Base URL provided:", trimmedApiEndpoint, e);
        }
    }
    
    try {
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
    } finally {
        if (proxyActive) {
            window.fetch = originalFetch;
        }
    }
}


/**
 * Executes a streaming API call with key rotation and retry logic,
 * proxying requests to a custom endpoint if provided.
 */
export async function* executeStreamWithKeyRotation<T extends GenerateContentResponse>(
    apiKeys: string[],
    operation: (ai: GoogleGenAI) => Promise<AsyncGenerator<T>>,
    apiEndpoint?: string,
): AsyncGenerator<T> {
    const keyManager = new KeyManager(apiKeys);
    if (keyManager.getTotalKeys() === 0) {
        yield { text: "Error: No API keys provided." } as T;
        return;
    }

    const originalFetch = window.fetch;
    let proxyActive = false;
    const trimmedApiEndpoint = apiEndpoint?.trim();

    if (trimmedApiEndpoint) {
        try {
            const proxyUrl = new URL(trimmedApiEndpoint);
            proxyActive = true;
            window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
                let urlString = input instanceof Request ? input.url : String(input);
                if (urlString.includes('generativelanguage.googleapis.com')) {
                    const originalUrl = new URL(urlString);
                    const finalProxyUrl = new URL(proxyUrl);
                    
                    const newPathname = (finalProxyUrl.pathname.replace(/\/$/, '') + originalUrl.pathname).replace(/\/\//g, '/');
                    finalProxyUrl.pathname = newPathname;
                    finalProxyUrl.search = originalUrl.search;

                    urlString = finalProxyUrl.toString();
                }
                return originalFetch(urlString, init);
            };
        } catch (e) {
            console.error("Invalid API Base URL provided:", trimmedApiEndpoint, e);
        }
    }

    try {
        let lastError: any = null;
        let success = false;
        for (let i = 0; i < keyManager.getTotalKeys(); i++) {
            const { key } = keyManager.getNextKey();
            if (!key) continue;

            try {
                const ai = new GoogleGenAI({ apiKey: key });
                const stream = await operation(ai);
                keyManager.saveSuccessIndex();
                yield* stream;
                success = true;
                break; 
            } catch (error) {
                lastError = error;
                console.warn(`API stream failed for key ending in ...${key.slice(-4)}. Trying next key. Error:`, error);
            }
        }
        
        if (!success) {
            console.error("All API keys failed for streaming operation.");
            yield { text: "Error: All API keys failed. " + (lastError?.message || "") } as T;
        }

    } finally {
        if (proxyActive) {
            window.fetch = originalFetch;
        }
    }
}
