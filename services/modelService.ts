export async function getAvailableModels(apiKeys: string[], apiBaseUrl?: string): Promise<string[]> {
  const defaultModelList = ['gemini-2.5-flash'];

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
        let errorDetails = `API call failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            errorDetails += `: ${errorData.error.message}`;
          }
        } catch (e) { /* Response was not JSON */ }
        console.warn(`Failed to fetch models with key ending in ...${sanitizedApiKey.slice(-4)}: ${errorDetails}`);
        continue;
      }

      const data = await response.json();
      
      if (!data.models || !Array.isArray(data.models)) {
          console.warn("Invalid response structure from models API with one key, trying next.");
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
      console.warn(`Error fetching models with key ending in ...${sanitizedApiKey.slice(-4)}:`, error);
      // Continue to the next key
    }
  }

  console.error("All API keys failed to fetch the model list. Using default list.");
  return defaultModelList;
}
