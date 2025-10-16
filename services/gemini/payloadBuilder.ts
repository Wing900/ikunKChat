import { Message, Settings, Persona, PersonaMemory } from '../../types';
import { STUDY_MODE_PROMPT, OPTIMIZE_FORMATTING_PROMPT, THINK_DEEPER_PROMPT, SEARCH_OPTIMIZER_PROMPT } from '../../data/prompts';
import { getMessageSize, getFormattedMessageSize, analyzeMessageSize } from '../../utils/messageSize';
import { testContextTruncation } from '../../utils/testContextTruncation';

interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

// 辅助函数：创建只包含文本的消息（用于降级处理）
function createTextOnlyMessage(message: Message): Message {
  return {
    ...message,
    attachments: undefined, // 移除所有附件
  };
}

export function prepareChatPayload(history: Message[], settings: Settings, toolConfig: any, persona?: Persona | null, isStudyMode?: boolean, memories?: PersonaMemory[]) {
  // 1. Determine the source of settings (persona or global)
  const settingsSource = {
    temperature: persona?.temperature ?? settings.temperature,
    maxOutputTokens: persona?.maxOutputTokens ?? settings.maxOutputTokens,
    contextLength: persona?.contextLength ?? settings.contextLength,
  };

  // 2. **修复** 更保守的大小限制策略
  // 针对代理服务器优化，使用更保守的限制 (200MB)
  const MAX_PAYLOAD_SIZE = 200 * 1024 * 1024; // 200MB - 支持大量图片和长文本

  // 预先计算系统指令大小
  let systemInstructionParts: string[] = [];

  if (persona?.memoryEnabled && memories && memories.length > 0) {
    const memoryHeader = "### Persona Memories (for context, not for direct response):\n";
    const memoryContent = memories.map(mem => `- ${mem.content}`).join('\n');
    systemInstructionParts.push(`${memoryHeader}${memoryContent}`);
  }

  if (isStudyMode) systemInstructionParts.push(STUDY_MODE_PROMPT);
  if (persona?.systemPrompt) systemInstructionParts.push(persona.systemPrompt);

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

  // **新增** 计算系统指令和配置的体积
  const systemInstructionSize = new TextEncoder().encode(systemInstruction).length;
  const configOverhead = JSON.stringify({
    temperature: settingsSource.temperature,
    maxOutputTokens: settingsSource.maxOutputTokens,
    tools: toolsForApi,
    systemInstruction: systemInstruction
  }).length;

  // **新增** 计算实际可用给历史消息的大小
  const availableForHistory = MAX_PAYLOAD_SIZE - systemInstructionSize - configOverhead;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Payload Analysis] Total budget: ${(MAX_PAYLOAD_SIZE / 1024).toFixed(1)}KB`);
    console.log(`[Payload Analysis] System instruction: ${(systemInstructionSize / 1024).toFixed(1)}KB`);
    console.log(`[Payload Analysis] Config overhead: ${(configOverhead / 1024).toFixed(1)}KB`);
    console.log(`[Payload Analysis] Available for history: ${(availableForHistory / 1024).toFixed(1)}KB`);
  }

  // 3. **修复** 智能历史截断策略
  let slicedHistory: Message[] = [];
  let currentSize = 0;

  // 从最新的消息开始，反向遍历历史
  for (let i = history.length - 1; i >= 0; i--) {
      const message = history[i];

      // **修复** 使用更准确的大小计算
      const messageSize = getFormattedMessageSize(message);
      const textOnlyMessage = createTextOnlyMessage(message);
      const textOnlySize = getFormattedMessageSize(textOnlyMessage);

      // 如果加入这条消息会超出预算，先尝试降级处理
      if (currentSize + messageSize > availableForHistory) {
          if (currentSize + textOnlySize <= availableForHistory) {
              console.warn(`[Context Truncation] Message at index ${i} was too large (${(messageSize / 1024).toFixed(1)}KB). Stripped images to ${(textOnlySize / 1024).toFixed(1)}KB to preserve context.`);
              slicedHistory.unshift(textOnlyMessage);
              currentSize += textOnlySize;
          } else {
              // **新增** 尝试截断长文本消息
              if (textOnlySize > 500 * 1024) { // 如果文本超过500KB
                const truncatedMessage = { ...textOnlyMessage, content: textOnlyMessage.content?.slice(-2000) };
                const truncatedSize = getFormattedMessageSize(truncatedMessage);
                if (currentSize + truncatedSize <= availableForHistory) {
                  console.warn(`[Context Truncation] Very long text message at index ${i} truncated from ${(textOnlySize / 1024).toFixed(1)}KB to ${(truncatedSize / 1024).toFixed(1)}KB`);
                  slicedHistory.unshift(truncatedMessage);
                  currentSize += truncatedSize;
                  continue;
                }
              }

              console.warn(`[Context Truncation] History truncated at index ${i}. Total history size: ${(currentSize / 1024).toFixed(1)}KB. Remaining messages: ${slicedHistory.length}`);
              break;
          }
      } else {
          slicedHistory.unshift(message);
          currentSize += messageSize;
      }
  }

  // 调试信息：分析截断后的历史记录
  if (process.env.NODE_ENV === 'development') {
      const totalSize = slicedHistory.reduce((sum, msg) => sum + getMessageSize(msg), 0);
      console.log(`[Context Analysis] Final history: ${slicedHistory.length} messages, ${(totalSize / 1024).toFixed(1)}KB`);

      // 详细分析最大的几条消息
      const messageAnalyses = slicedHistory.map(msg => analyzeMessageSize(msg));
      const sortedAnalyses = messageAnalyses.sort((a, b) => b.total - a.total).slice(0, 3);
      console.log(`[Context Analysis] Top 3 largest messages:`, sortedAnalyses);
  }

  const formattedHistory = slicedHistory.map(msg => {
    const parts: Part[] = [];

    // **修复** 先处理文本，再处理图片（符合Gemini API标准顺序）
    if(msg.content) {
        parts.push({ text: msg.content });
    }

    if (msg.attachments) {
      // **修复** 过滤掉无效的附件（data为undefined或非字符串）
      const validAttachments = msg.attachments.filter(att => att.data && typeof att.data === 'string');
      if (validAttachments.length !== msg.attachments.length) {
        console.warn(`[Payload Builder] Filtered out ${msg.attachments.length - validAttachments.length} invalid attachments`);
      }
      parts.push(...validAttachments.map(att => ({ inlineData: { mimeType: att.mimeType, data: att.data! } })));
    }

    return { role: msg.role, parts: parts };
  });

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
