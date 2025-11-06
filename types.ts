

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface FileAttachment {
  id?: string; // IndexedDB 中的附件 ID（如果存储在 IndexedDB 中）
  name: string;
  mimeType: string;
  data?: string; // base64 encoded string. Optional to allow for saving w/o data.
}

export interface PDFSummary {
  id: string;
  fileName: string;
  pageCount: number;
  fileSize: number;
  author?: string;
  charCount: number;
}

export interface Message {
  id:string;
  role: MessageRole;
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
  pdfAttachments?: PDFSummary[];
  groundingMetadata?: any;
  thoughts?: string;
  thinkingTime?: number;
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  createdAt: number;
}

export interface Persona {
  id: string;
  isDefault?: boolean;
  name: string;
  avatar: {
    type: 'emoji' | 'url' | 'base64';
    value: string;
  };
  bio: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  contextLength?: number;
  maxOutputTokens?: number;
  isNew?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  icon?: string;
  model: string;
  messages: Message[];
  createdAt: number;
  folderId: string | null;
  personaId?: string | null;
  isArchived?: boolean;
}

import { LLMProvider } from './services/llm/types';

export interface Settings {
  theme: 'apple-light' | 'apple-dark';
  language: 'en' | 'zh';
  fontFamily: 'system' | 'lxgw' | 'yozai';
  colorPalette?: string; // 调色板ID (blue, orange, green, purple, red, indigo, cyan, pink)
  customColor?: string; // 自定义颜色 (HEX格式)
  llmProvider?: LLMProvider; // 用户选择的LLM服务商
  apiKey: string[] | null;
  defaultModel: string;
  defaultPersona: string;
  autoTitleGeneration: boolean;
  titleGenerationModel: string;
  showThoughts: boolean;
  optimizeFormatting: boolean;
  thinkDeeper: boolean;
  apiBaseUrl?: string;
  temperature?: number;
  maxOutputTokens?: number;
  contextLength?: number;
  password?: string;
  pdfQuality?: 'sd' | 'hd' | 'uhd';
  streamInactivityTimeout?: number;
  fontSize?: number;
}

// ==================== 激活码和许可证相关类型 ====================

export type ActivationType = 'free' | 'permanent' | 'monthly';

export interface LicenseInfo {
  activationCode: string | null;      // 用户输入的激活码
  activationType: ActivationType;      // 激活类型
  activatedAt: string | null;          // 激活时间 (ISO string)
}

export interface UsageQuota {
  date: string;                        // 日期 (YYYY-MM-DD)
  count: number;                       // 当日已使用次数
}

export interface ActivationCodes {
  permanent: string[];                 // 永久激活码列表
  monthly: string[];                   // 月度激活码列表
}

export interface LicenseCheckResult {
  canSend: boolean;                    // 是否可以发送消息
  reason?: string;                     // 不能发送的原因
  remainingCount?: number;             // 剩余次数（仅免费用户）
  usedCount?: number;                  // 已使用次数（仅免费用户）
  totalLimit?: number;                 // 总限制次数（仅免费用户）
}