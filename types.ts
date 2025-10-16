

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

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
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
  tools: {
    googleSearch: boolean;
    codeExecution: boolean;
    urlContext: boolean;
  };
  model?: string;
  temperature?: number;
  contextLength?: number;
  maxOutputTokens?: number;
  isNew?: boolean;
  memoryEnabled?: boolean;
  maxMemories?: number;
}

export interface PersonaMemory {
  id: string;
  personaId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  source: 'manual' | 'auto';
}

export interface ChatSession {
  id:string;
  title: string;
  icon?: string; // Emoji icon for the chat
  model: string;
  messages: Message[];
  createdAt: number;
  folderId: string | null;
  personaId?: string | null;
  isArchived?: boolean;
  isStudyMode?: boolean;
}

export interface TranslationHistoryItem {
  id: string;
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  translatedText: string;
  timestamp: number;
  mode: 'natural' | 'literal';
}

export interface Settings {
  theme: 'apple-light' | 'apple-dark';
  language: 'en' | 'zh';
  fontFamily: 'system' | 'lxgw' | 'yozai';
  colorPalette?: string; // 调色板ID (blue, orange, green, purple, red, indigo, cyan, pink)
  customColor?: string; // 自定义颜色 (HEX格式)
  apiKey: string[] | null;
  defaultModel: string;
  defaultPersona: string;
  autoTitleGeneration: boolean;
  titleGenerationModel: string;
  defaultSearch: boolean;
  useSearchOptimizerPrompt: boolean;
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
}