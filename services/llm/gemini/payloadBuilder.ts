import { Message, Persona } from '../../../types';
import { ModelConfig } from '../types';
import { OPTIMIZE_FORMATTING_PROMPT, THINK_DEEPER_PROMPT } from '../../../data/prompts';
import { getMessageSize, getFormattedMessageSize, analyzeMessageSize } from '../../../utils/messageSize';
import { testContextTruncation } from '../../../utils/testContextTruncation';

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

export function prepareChatPayload(
  history: Message[],
  config: ModelConfig,
  persona?: Persona | null,
  showThoughts?: boolean
) {
  // 1. Determine the source of settings (persona or global)
  const settingsSource = {
    temperature: persona?.temperature ?? config.temperature,
    maxOutputTokens: persona?.maxOutputTokens ?? config.maxOutputTokens,
    contextLength: persona?.contextLength ?? config.contextLength,
  };

  // 2. **修复** 更保守的大小限制策略
  // 针对代理服务器优化，使用更保守的限制 (200MB)
  const MAX_PAYLOAD_SIZE = 200 * 1024 * 1024; // 200MB - 支持大量图片和长文本

  // 预先计算系统指令大小
  let systemInstructionParts: string[] = [];

  if (persona?.systemPrompt) systemInstructionParts.push(persona.systemPrompt);


  const systemInstruction = systemInstructionParts.join('\n\n---\n\n').trim();

  // **新增** 计算系统指令和配置的体积
  const systemInstructionSize = new TextEncoder().encode(systemInstruction).length;
  const configOverhead = JSON.stringify({
    temperature: settingsSource.temperature,
    maxOutputTokens: settingsSource.maxOutputTokens,
    systemInstruction: systemInstruction
  }).length;

  // **新增** 计算实际可用给历史消息的大小
  const availableForHistory = MAX_PAYLOAD_SIZE - systemInstructionSize - configOverhead;

  if (process.env.NODE_ENV === 'development') {
    console.log(`载荷分析 - 总预算: ${(MAX_PAYLOAD_SIZE / 1024).toFixed(1)}KB`);
    console.log(`载荷分析 - 系统指令: ${(systemInstructionSize / 1024).toFixed(1)}KB`);
    console.log(`载荷分析 - 配置开销: ${(configOverhead / 1024).toFixed(1)}KB`);
    console.log(`载荷分析 - 历史可用: ${(availableForHistory / 1024).toFixed(1)}KB`);
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
              console.warn(`上下文截断 - 消息过大 (${(messageSize / 1024).toFixed(1)}KB)，降级为文本 (${(textOnlySize / 1024).toFixed(1)}KB)`);
              slicedHistory.unshift(textOnlyMessage);
              currentSize += textOnlySize;
          } else {
              // **新增** 尝试截断长文本消息
              if (textOnlySize > 500 * 1024) { // 如果文本超过500KB
                const truncatedMessage = { ...textOnlyMessage, content: textOnlyMessage.content?.slice(-2000) };
                const truncatedSize = getFormattedMessageSize(truncatedMessage);
                if (currentSize + truncatedSize <= availableForHistory) {
                  console.warn(`上下文截断 - 超长文本从 ${(textOnlySize / 1024).toFixed(1)}KB 截断至 ${(truncatedSize / 1024).toFixed(1)}KB`);
                  slicedHistory.unshift(truncatedMessage);
                  currentSize += truncatedSize;
                  continue;
                }
              }

              console.warn(`上下文截断 - 历史记录在索引 ${i} 处截断，总大小: ${(currentSize / 1024).toFixed(1)}KB，保留 ${slicedHistory.length} 条消息`);
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
      console.log(`上下文分析 - 最终历史: ${slicedHistory.length} 条消息, ${(totalSize / 1024).toFixed(1)}KB`);
  }

  const formattedHistory = slicedHistory.map(msg => {
    const parts: Part[] = [];

    // **修复** 先处理文本，再处理图片（符合Gemini API标准顺序）
    if(msg.content) {
        parts.push({ text: msg.content });
    }

    if (msg.attachments) {
      // **修复** 过滤掉无效的附件（data为undefined或非字符串）
      // 附件有效性判断标准:
      // 1. att.data 必须存在（不能是 undefined 或 null）
      // 2. att.data 必须是字符串类型（Base64编码的字符串）
      const validAttachments = msg.attachments.filter(att => {
        const isDataExists = att.data !== undefined && att.data !== null;
        const isDataString = typeof att.data === 'string';
        const isValid = isDataExists && isDataString;
        
        if (!isValid && process.env.NODE_ENV === 'development') {
          console.log(`附件验证失败 - data存在: ${isDataExists}, data是字符串: ${isDataString}`);
        }
        
        return isValid;
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`附件过滤结果 - 原始: ${msg.attachments.length}个, 有效: ${validAttachments.length}个`);
      }

      // 详细记录被过滤的附件信息
      if (validAttachments.length !== msg.attachments.length) {
        console.warn(`检测到无效附件`);

        msg.attachments.forEach((att, index) => {
          // 详细判断失败原因
          const dataExists = att.data !== undefined && att.data !== null;
          const dataIsString = typeof att.data === 'string';
          const isValid = dataExists && dataIsString;
          
          if (!isValid) {
            // 构建详细的失败原因
            let reason = '';
            if (!dataExists) {
              reason = att.data === undefined ? '缺少data字段(undefined)' : '缺少data字段(null)';
            } else if (!dataIsString) {
              reason = `data字段类型错误，当前类型: ${typeof att.data}，期望类型: string`;
            }
            
            const dataInfo = att.data === undefined ? 'undefined' : att.data === null ? 'null' : typeof att.data;
            const mimeInfo = att.mimeType ? att.mimeType : '未知类型';
            const nameInfo = att.name ? att.name : '未知文件名';

            console.warn(`附件[${index}] 被过滤 - 文件名: ${nameInfo}, MIME类型: ${mimeInfo}, data信息: ${dataInfo}, 过滤理由: ${reason}`);
          }
        });
      }

      parts.push(...validAttachments.map(att => ({ inlineData: { mimeType: att.mimeType, data: att.data! } })));
    }

    return { role: msg.role, parts: parts };
  });

  // 3. Add new parameters to the generation config
  const configForApi: any = {
    systemInstruction: systemInstruction || undefined,
    temperature: settingsSource.temperature,
    maxOutputTokens: settingsSource.maxOutputTokens,
  };

  if (showThoughts) {
    configForApi.thinkingConfig = { includeThoughts: true };
  }

  return { formattedHistory, configForApi };
}
