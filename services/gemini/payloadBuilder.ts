import { Message, Settings, Persona } from '../../types';
import { STUDY_MODE_PROMPT, OPTIMIZE_FORMATTING_PROMPT, THINK_DEEPER_PROMPT, SEARCH_OPTIMIZER_PROMPT } from '../../data/prompts';

interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export function prepareChatPayload(history: Message[], settings: Settings, toolConfig: any, persona?: Persona | null, isStudyMode?: boolean) {
  const formattedHistory = history.map(msg => {
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
  
  if (isStudyMode) systemInstructionParts.push(STUDY_MODE_PROMPT);
  if (persona?.systemPrompt) systemInstructionParts.push(persona.systemPrompt);
  if (settings.enableGlobalSystemPrompt && settings.globalSystemPrompt.trim()) systemInstructionParts.push(settings.globalSystemPrompt.trim());
  if (settings.optimizeFormatting) systemInstructionParts.push(OPTIMIZE_FORMATTING_PROMPT);
  if (settings.thinkDeeper) systemInstructionParts.push(THINK_DEEPER_PROMPT);

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
  
  const configForApi: any = { systemInstruction: systemInstruction || undefined, tools: toolsForApi.length > 0 ? toolsForApi : undefined };
  if (toolConfig.showThoughts) {
    configForApi.thinkingConfig = { includeThoughts: true };
  }
  
  return { formattedHistory, configForApi };
}
