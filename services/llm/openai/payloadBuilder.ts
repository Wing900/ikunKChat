import { Message, MessageRole, Persona } from '../../../types';

/**
 * OpenAI API 消息内容部分
 */
interface OpenAIContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

/**
 * OpenAI API 所要求的消息格式
 */
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | OpenAIContentPart[];
}

/**
 * 准备发送到 OpenAI API 的消息负载。
 * @param messages - 内部消息历史记录
 * @param persona - 当前使用的 Persona，用于提取系统提示
 * @returns 格式化后的消息数组
 */
export function prepareOpenAIPayload(messages: Message[], persona: Persona): OpenAIMessage[] {
  const payload: OpenAIMessage[] = [];

  // 1. 添加系统提示
  if (persona.systemPrompt) {
    payload.push({
      role: 'system',
      content: persona.systemPrompt,
    });
  }

  // 2. 转换消息历史
  for (const message of messages) {
    let role: 'user' | 'assistant';
    if (message.role === MessageRole.USER) {
      role = 'user';
    } else if (message.role === MessageRole.MODEL) {
      role = 'assistant';
    } else {
      // 跳过未知角色
      continue;
    }
    
    // 检查是否有图片附件
    const hasValidAttachments = message.attachments && message.attachments.length > 0 &&
      message.attachments.some(att => att.data && typeof att.data === 'string' && att.mimeType?.startsWith('image/'));
    
    if (hasValidAttachments && role === 'user') {
      // 用户消息且有图片：使用多部分内容格式
      const contentParts: OpenAIContentPart[] = [];
      
      // 添加文本部分
      if (message.content) {
        contentParts.push({
          type: 'text',
          text: message.content,
        });
      }
      
      // 添加图片部分
      message.attachments!.forEach(att => {
        if (att.data && typeof att.data === 'string' && att.mimeType?.startsWith('image/')) {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${att.mimeType};base64,${att.data}`,
            },
          });
        }
      });
      
      // 只有在有内容时才添加消息
      if (contentParts.length > 0) {
        payload.push({
          role: role,
          content: contentParts,
        });
      }
    } else {
      // 助手消息或无图片的用户消息：使用纯文本格式
      if (message.content) {
        payload.push({
          role: role,
          content: message.content,
        });
      }
    }
  }

  return payload;
}