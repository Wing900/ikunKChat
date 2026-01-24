import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeyManager } from '../../keyManager';

/**
 * 打印400错误的详细分析
 */
function log400ErrorDetails(error: unknown, apiKeySuffix: string): void {
    console.error('API 400错误详情:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof Error && (error as any).code,
        apiKeySuffix
    });

    // 尝试从错误消息中提取请求信息
    try {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorData = JSON.parse(errorMessage);
        console.error('解析后的错误数据:', errorData);

        // 尝试分析错误原因
        if (errorData.error?.message?.includes('data:')) {
            const nestedError = JSON.parse(errorData.error.message.replace('data:', '').trim());
            console.error('嵌套错误详情:', nestedError);

            // 分析可能的400错误原因
            if (nestedError.error?.code === 400) {
                console.warn('400错误可能原因分析:');
                console.warn('1. 请求体过大 - 可能是历史消息或图片太多');
                console.warn('2. 代理服务器限制 - 可能有限制');
                console.warn('3. 消息格式问题 - 某些历史消息可能在截断过程中格式错误');
                console.warn('4. Token超限 - 虽然有截断机制，但可能不够激进');
            }
        }
    } catch (parseError) {
        console.error('无法解析错误消息为JSON格式');
    }
}

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
        throw new Error("未提供 API 密钥。请联系站长获取。");
    }

    const trimmedApiEndpoint = apiEndpoint?.trim();

    for (let i = 0; i < keyManager.getTotalKeys(); i++) {
        const { key } = keyManager.getNextKey();
        if (!key) continue;

        try {
            const ai = new GoogleGenAI({
                apiKey: key,
                httpOptions: trimmedApiEndpoint ? { baseUrl: trimmedApiEndpoint } : undefined
            });
            const result = await operation(ai);
            keyManager.saveSuccessIndex();
            return result;
        } catch (error) {
            console.warn(`API 调用失败，密钥 ...${key.slice(-4)}，尝试下一个密钥。错误:`, error);

            // 如果是400错误，打印请求体详情
            if (error instanceof Error && (error.message.includes('400') || (error as any).code === 400)) {
                log400ErrorDetails(error, `...${key.slice(-4)}`);
            }

            if (i === keyManager.getTotalKeys() - 1) {
                console.error("所有 API 密钥都失败了。如问题持续，请联系站长。");
                throw error;
            }
        }
    }
    throw new Error("所有 API 密钥都失败了。如问题持续，请联系站长。");
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
        yield { text: "错误：未提供 API 密钥。请联系站长获取。" } as T;
        return;
    }

    const trimmedApiEndpoint = apiEndpoint?.trim();

    let lastError: unknown = null;
    let success = false;
    for (let i = 0; i < keyManager.getTotalKeys(); i++) {
        const { key } = keyManager.getNextKey();
        if (!key) continue;

        try {
            const ai = new GoogleGenAI({
                apiKey: key,
                httpOptions: trimmedApiEndpoint ? { baseUrl: trimmedApiEndpoint } : undefined
            });
            const stream = await operation(ai);
            keyManager.saveSuccessIndex();
            yield* stream;
            success = true;
            break;
        } catch (error) {
            lastError = error;
            console.warn(`API 流式调用失败，密钥 ...${key.slice(-4)}，尝试下一个密钥。错误:`, error);

            // 如果是400错误，打印请求体详情
            if (error instanceof Error && (error.message.includes('400') || (error as any).code === 400)) {
                log400ErrorDetails(error, `...${key.slice(-4)}`);
            }
        }
    }

    if (!success) {
        console.error("流式操作所有 API 密钥都失败了。如问题持续，请联系站长。");
        yield { text: "错误：所有 API 密钥都失败了。请联系站长。" + (lastError instanceof Error ? lastError.message : "") } as T;
    }
}
