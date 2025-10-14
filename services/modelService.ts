export async function getAvailableModels(apiKeys: string[], apiBaseUrl?: string): Promise<string[]> {
  const defaultModelList = ['gemini-2.5-pro-preview-05-06-maxthinking', 'gemini-2.5-pro', 'gemini-2.5-flash'];

  if (!apiKeys || apiKeys.length === 0) {
    return defaultModelList;
  }

  for (const key of apiKeys) {
    const sanitizedApiKey = key.trim().replace(/["']/g, '');
    if (!sanitizedApiKey) continue;

    try {
      const trimmedApiBaseUrl = apiBaseUrl?.trim();
      const baseUrl = (trimmedApiBaseUrl || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
      const url = `${baseUrl}/v1beta/models`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-goog-api-key': sanitizedApiKey,
        },
      });
      
      if (!response.ok) {
        // Don't throw an error, just log and try the next key
        let errorDetails = `API 调用失败，状态码：${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            errorDetails += `: ${errorData.error.message}`;
          }
        } catch (e) { /* Response was not JSON */ }
        console.warn(`使用 API 密钥 ...${sanitizedApiKey.slice(-4)} 获取模型列表失败: ${errorDetails}`);
        continue;
      }

      const data = await response.json();
      
      if (!data.models || !Array.isArray(data.models)) {
          console.warn("API 响应结构无效，尝试下一个密钥。");
          continue;
      }

      const chatModels = data.models
        .filter((m: any) => 
          m.name?.startsWith('models/gemini') && 
          m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: any) => m.name.replace('models/', ''))
        .sort((a: string, b: string) => b.localeCompare(a));
      
      const finalModels = [...new Set([ ...defaultModelList, ...chatModels ])];
      
      if (finalModels.length > 0) {
        return finalModels; // Return on first success
      }
    } catch (error) {
      console.warn(`使用 API 密钥 ...${sanitizedApiKey.slice(-4)} 获取模型时出错:`, error);
      // Continue to the next key
    }
  }

  console.error("所有 API 密钥都失败了，使用默认模型列表。如问题持续，请联系站长。");
  return defaultModelList;
}
