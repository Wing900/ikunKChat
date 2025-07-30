export const readAloud = async (text: string, lang: string): Promise<void> => {
  if (!text.trim()) return;

  try {
    const response = await fetch("https://tts.gbase.ai/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://gbase.ai/",
      },
      body: JSON.stringify({ text, lang }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TTS API request failed with status ${response.status}: ${errorText}`);
      throw new Error(`TTS service returned status ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('audio')) {
      const errorText = await response.text();
      console.error("TTS service returned non-audio response:", errorText);
      throw new Error("Received an invalid response from TTS service.");
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await response.arrayBuffer();
    const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
    
    const source = audioContext.createBufferSource();
    source.buffer = decodedAudio;
    source.connect(audioContext.destination);
    source.start(0);

  } catch (error) {
    console.error("Error in readAloud service:", error);
    // Re-throw the error so the calling component can handle it (e.g., show a toast)
    throw new Error(`Text-to-speech is currently unavailable. Error: ${(error as Error).message}`);
  }
};