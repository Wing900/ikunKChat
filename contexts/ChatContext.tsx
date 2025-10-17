import React, { createContext, useContext, ReactNode } from 'react';
import { Settings, Persona } from '../types';

// 聊天交互上下文 - 减少 props drilling
interface ChatContextValue {
  // UI 交互
  onImageClick: (src: string) => void;
  onShowCitations: (chunks: any[]) => void;
  
  // 数据
  settings: Settings;
  personas: Persona[];
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatContextProvider');
  }
  return context;
};

interface ChatContextProviderProps {
  children: ReactNode;
  value: ChatContextValue;
}

export const ChatContextProvider: React.FC<ChatContextProviderProps> = ({ children, value }) => {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};