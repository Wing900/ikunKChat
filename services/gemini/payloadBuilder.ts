import { Message, Settings, Persona, PersonaMemory } from '../../types';
import { STUDY_MODE_PROMPT, OPTIMIZE_FORMATTING_PROMPT, THINK_DEEPER_PROMPT, SEARCH_OPTIMIZER_PROMPT } from '../../data/prompts';

interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export function prepareChatPayload(history: Message[], settings: Settings, toolConfig: any, persona?: Persona | null, isStudyMode?: boolean, memories?: PersonaMemory[]) {
  // 1. Determine the source of settings (persona or global)
  const settingsSource = {
    temperature: persona?.temperature ?? settings.temperature,
    maxOutputTokens: persona?.maxOutputTokens ?? settings.maxOutputTokens,
    contextLength: persona?.contextLength ?? settings.contextLength,
  };

  // 2. Slice history based on context length
  // New, smarter truncation logic based on character count
  const MAX_CONTEXT_CHARS = 65536; // Increased to a safer, larger limit (~64k chars)
  const historyToConsider = settingsSource.contextLength > 0
      ? history.slice(-settingsSource.contextLength)
      : history;

  let slicedHistory: Message[] = [];
  let currentChars = 0;

  // Iterate backwards from the most recent message
  for (let i = historyToConsider.length - 1; i >= 0; i--) {
      const message = historyToConsider[i];
      // Estimate message size by stringifying it
      const messageLength = JSON.stringify(message).length;

      if (currentChars + messageLength > MAX_CONTEXT_CHARS) {
          // Stop if adding the next message would exceed the limit
          break;
      }
      // Add the message to the beginning of our new array to maintain order
      slicedHistory.unshift(message);
      currentChars += messageLength;
  }

  const formattedHistory = slicedHistory.map(msg => {
    const parts: Part[] = [];
    if (msg.attachments) {
      parts.push(...msg.attachments.map(att => ({ inlineData: { mimeType: att.mimeType, data: att.data! } })));
    }
    if(msg.content) {
        parts.push({ text: msg.content });
    }
    return { role: msg.role, parts: parts };
  });

  let systemInstructionParts: string[] = [];
  
  if (persona?.memoryEnabled && memories && memories.length > 0) {
    const memoryHeader = "### Persona Memories (for context, not for direct response):\n";
    const memoryContent = memories.map(mem => `- ${mem.content}`).join('\n');
    systemInstructionParts.push(`${memoryHeader}${memoryContent}`);
  }

  if (isStudyMode) systemInstructionParts.push(STUDY_MODE_PROMPT);
  if (persona?.systemPrompt) systemInstructionParts.push(persona.systemPrompt);
  if (settings.enableGlobalSystemPrompt && settings.globalSystemPrompt.trim()) systemInstructionParts.push(settings.globalSystemPrompt.trim());

  const useGoogleSearch = persona?.tools.googleSearch || settings.defaultSearch;
  const useCodeExecution = toolConfig.codeExecution || persona?.tools.codeExecution;
  
  const toolsForApi: any[] = [];
  let isSearchEnabled = toolConfig.googleSearch || useGoogleSearch || toolConfig.urlContext;

  if (useCodeExecution) toolsForApi.push({ codeExecution: {} });
  if (isSearchEnabled) toolsForApi.push({ googleSearch: {} });

  let searchInstruction = '';
  if (toolConfig.googleSearch) { // Explicit "Tools" search has highest priority
    searchInstruction = 'The user has explicitly enabled Google Search for this query, so you MUST prioritize its use to answer the request and provide citations.';
  } else if (useGoogleSearch && !toolConfig.urlContext && settings.useSearchOptimizerPrompt) { // Default search is on AND optimizer is on
    searchInstruction = SEARCH_OPTIMIZER_PROMPT;
  }
  
  if (searchInstruction) {
    systemInstructionParts.push(searchInstruction);
  }
  
  const systemInstruction = systemInstructionParts.join('\n\n---\n\n').trim();
  
  // 3. Add new parameters to the generation config
  const configForApi: any = {
    systemInstruction: systemInstruction || undefined,
    tools: toolsForApi.length > 0 ? toolsForApi : undefined,
    temperature: settingsSource.temperature,
    maxOutputTokens: settingsSource.maxOutputTokens,
  };

  if (toolConfig.showThoughts) {
    configForApi.thinkingConfig = { includeThoughts: true };
  }
  
  return { formattedHistory, configForApi };
}
