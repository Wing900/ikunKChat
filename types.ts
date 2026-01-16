

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
  lastSelectedModel?: string; // 用户最后选择的模型（模型选择器记忆功能）
  defaultPersona: string;
  autoTitleGeneration: boolean;
  titleGenerationModel: string;
  showThoughts: boolean;
  optimizeFormatting: boolean;
  thinkDeeper: boolean;
  enableSearch: boolean;
  apiBaseUrl?: string;
  temperature?: number;
  maxOutputTokens?: number;
  contextLength?: number;
  password?: string;
  pdfQuality?: 'sd' | 'hd' | 'uhd';
  streamInactivityTimeout?: number;
  fontSize?: number;
}