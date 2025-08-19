

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface FileAttachment {
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
  theme: 'light' | 'dark' | 'apple-light' | 'apple-dark' | 'pink-ocean' | 'blue-sky';
  language: 'en' | 'zh';
  fontFamily: 'system' | 'lxgw' | 'yozai';
  apiKey: string[] | null;
  showSuggestions: boolean;
  defaultModel: string;
  defaultPersona: string;
  suggestionModel: string;
  autoTitleGeneration: boolean;
  titleGenerationModel: string;
  languageDetectionModel: string;
  defaultSearch: boolean;
  useSearchOptimizerPrompt: boolean;
  showThoughts: boolean;
  enableGlobalSystemPrompt: boolean;
  globalSystemPrompt: string;
  optimizeFormatting: boolean;
  thinkDeeper: boolean;
  apiBaseUrl?: string;
  temperature: number;
  maxOutputTokens: number;
  contextLength: number;
  password?: string;
  streamInactivityTimeout?: number;
  pdfQuality?: 'sd' | 'hd' | 'uhd';
}