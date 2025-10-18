import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeyManager } from '../keyManager';
import { checkBrowserCompatibility } from '../../utils/browserCompatibility';
import { AppError, ErrorType } from './errors/ErrorTypes';
import { handleError } from './errors/ErrorHandler';

// Custom fetch function for proxying
const createCustomFetch = (originalFetch: typeof window.fetch, proxyUrl: URL) => {
    return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
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
};

/**
 * Executes a non-streaming API call with key rotation and retry logic,
 * proxying requests to a custom endpoint if provided.
 */
export async function executeWithKeyRotation<T>(
    apiKeys: string[],
    operation: (ai: GoogleGenAI) => Promise<T>,
    apiEndpoint?: string,
): Promise<T> {
    const { isCompatible, reason } = checkBrowserCompatibility();
    if (!isCompatible) {
        throw new AppError(ErrorType.BROWSER_COMPATIBILITY, reason);
    }

    const keyManager = new KeyManager(apiKeys);
    if (keyManager.getTotalKeys() === 0) {
        throw new AppError(ErrorType.API_KEY_INVALID, "未提供 API 密钥。请联系站长获取。");
    }

    const originalFetch = window.fetch;
    let customFetch: typeof window.fetch | undefined;
    const trimmedApiEndpoint = apiEndpoint?.trim();

    if (trimmedApiEndpoint) {
        try {
            const proxyUrl = new URL(trimmedApiEndpoint);
            customFetch = createCustomFetch(originalFetch, proxyUrl);
        } catch (e) {
            console.error("提供的 API Base URL 无效:", trimmedApiEndpoint, e);
            throw new AppError(ErrorType.NETWORK_ERROR, `无效的 API Base URL: ${trimmedApiEndpoint}`);
        }
    }
    
    for (let i = 0; i < keyManager.getTotalKeys(); i++) {
        const { key } = keyManager.getNextKey();
        if (!key) continue;

        try {
            const ai = new GoogleGenAI(key, { httpOptions: { fetch: customFetch } });
            const result = await operation(ai);
            keyManager.saveSuccessIndex();
            return result;
        } catch (error) {
            console.warn(`API 调用失败，密钥 ...${key.slice(-4)}，尝试下一个密钥。`);
            handleError(error, `...${key.slice(-4)}`);
            if (i === keyManager.getTotalKeys() - 1) {
                console.error("所有 API 密钥都失败了。如问题持续，请联系站长。");
                throw error; // Re-throw the last error
            }
        }
    }
    throw new AppError(ErrorType.UNKNOWN_ERROR, "所有 API 密钥都失败了。");
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
    const { isCompatible, reason } = checkBrowserCompatibility();
    if (!isCompatible) {
        yield { 
            text: handleError(new AppError(ErrorType.BROWSER_COMPATIBILITY, reason))
        } as unknown as T;
        return;
    }
    
    const keyManager = new KeyManager(apiKeys);
    if (keyManager.getTotalKeys() === 0) {
        yield { text: handleError(new AppError(ErrorType.API_KEY_INVALID, "未提供 API 密钥。")) } as unknown as T;
        return;
    }

    const originalFetch = window.fetch;
    let customFetch: typeof window.fetch | undefined;
    const trimmedApiEndpoint = apiEndpoint?.trim();

    if (trimmedApiEndpoint) {
        try {
            const proxyUrl = new URL(trimmedApiEndpoint);
            customFetch = createCustomFetch(originalFetch, proxyUrl);
        } catch (e) {
            console.error("提供的 API Base URL 无效:", trimmedApiEndpoint, e);
            yield { text: handleError(new AppError(ErrorType.NETWORK_ERROR, `无效的 API Base URL: ${trimmedApiEndpoint}`)) } as unknown as T;
            return;
        }
    }

    let lastError: any = null;
    for (let i = 0; i < keyManager.getTotalKeys(); i++) {
        const { key } = keyManager.getNextKey();
        if (!key) continue;

        try {
            const ai = new GoogleGenAI(key, { httpOptions: { fetch: customFetch } });
            const stream = await operation(ai);
            keyManager.saveSuccessIndex();
            yield* stream;
            return; // Success, exit the loop and function
        } catch (error) {
            lastError = error;
            console.warn(`API 流式调用失败，密钥 ...${key.slice(-4)}，尝试下一个密钥。`);
            handleError(error, `...${key.slice(-4)}`);
        }
    }

    console.error("流式操作所有 API 密钥都失败了。");
    yield { text: handleError(lastError || new AppError(ErrorType.UNKNOWN_ERROR, "所有 API 密钥都失败了。")) } as unknown as T;
}
