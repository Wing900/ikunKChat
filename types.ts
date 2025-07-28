

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
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  createdAt: number;
}

export interface ChatSession {
  id:string;
  title: string;
  icon?: string; // Emoji icon for the chat
  model: string;
  messages: Message[];
  createdAt: number;
  folderId: string | null;
}

export interface CustomSystemPrompt {
  nickname: string;
  persona: string;
  behavior: string;
  rules: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  language: 'en' | 'zh';
  apiKey: string | null;
  showSuggestions: boolean;
  defaultModel: string;
  suggestionModel: string;
  autoTitleGeneration: boolean;
  titleGenerationModel: string;
  useCustomSystemPrompt: boolean;
  customSystemPrompt: CustomSystemPrompt;
  defaultSearch: boolean;
  showThoughts: boolean;
}