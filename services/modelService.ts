export async function getAvailableModels(apiKey: string): Promise<string[]> {
  const defaultModelList = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

  if (!apiKey) {
    return defaultModelList;
  }

  // Sanitize the API key to remove quotes and extra whitespace which can cause a 400 error.
  const sanitizedApiKey = apiKey.trim().replace(/["']/g, '');
  if (!sanitizedApiKey) {
    return defaultModelList;
  }

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-goog-api-key': sanitizedApiKey,
      },
    });
    
    if (!response.ok) {
      let errorDetails = `API call failed with status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorDetails += `: ${errorData.error.message}`;
        }
      } catch (e) {
        // Response was not JSON, do nothing extra
      }
      throw new Error(errorDetails);
    }
    const data = await response.json();
    
    if (!data.models || !Array.isArray(data.models)) {
        throw new Error("Invalid response structure from models API");
    }

    const chatModels = data.models
      .filter((m: any) => 
        m.name?.startsWith('models/gemini') && 
        m.supportedGenerationMethods?.includes('generateContent')
      )
      .map((m: any) => m.name.replace('models/', ''))
      .sort((a: string, b: string) => b.localeCompare(a));
    
    const finalModels = [...new Set([ ...defaultModelList, ...chatModels ])];
    
    return finalModels.length > 0 ? finalModels : defaultModelList;

  } catch (error) {
    console.error("Error fetching available models via REST:", error);
    return defaultModelList;
  }
}
