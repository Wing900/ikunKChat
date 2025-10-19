import { Message, MessageRole, Persona } from '../../../types';

/**
 * OpenAI API 所要求的消息格式
 */
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  // 注意：当前实现未处理图片附件
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
    // 忽略没有内容的消息
    if (!message.content) continue;

    let role: 'user' | 'assistant';
    if (message.role === MessageRole.USER) {
      role = 'user';
    } else if (message.role === MessageRole.MODEL) {
      role = 'assistant';
    } else {
      // 跳过未知角色
      continue;
    }
    
    // TODO: 未来在这里可以添加对附件（图片）的处理逻辑
    // 目前只处理文本内容
    payload.push({
      role: role,
      content: message.content,
    });
  }

  return payload;
}