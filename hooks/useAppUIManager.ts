import { useState, useCallback } from 'react';
import { useUIState } from '../contexts/UIStateContext';
import { Persona, ChatSession, Message } from '../types';

type View = 'chat' | 'personas' | 'editor' | 'archive';

interface UseAppUIManagerReturn {
  // 视图管理
  currentView: View;
  setCurrentView: (view: View) => void;
  handleOpenView: (view: View) => void;
  handleOpenEditor: (persona: Persona | null) => void;
  handleCloseEditor: () => void;
  
  // 编辑状态
  editingPersona: Persona | null;
  setEditingPersona: (persona: Persona | null) => void;
  
  // 侧边栏状态
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  sidebarState: { isCollapsed: boolean };
  handleSidebarStateChange: (state: { isCollapsed: boolean }) => void;
  handleToggleSidebar: () => void;
  
  // 确认对话框
  confirmation: { title: string; message: string; onConfirm: () => void } | null;
  setConfirmation: (confirmation: { title: string; message: string; onConfirm: () => void } | null) => void;
  handleCloseConfirmation: () => void;
  
  // UI状态上下文（从UIStateContext获取）
  uiState: ReturnType<typeof useUIState>;
}

/**
 * AppUIManager Hook - 处理UI状态和视图管理
 * 职责：视图切换、编辑状态管理、侧边栏控制、确认对话框
 */
export const useAppUIManager = (): UseAppUIManagerReturn => {
  const uiState = useUIState();
  
  // 视图状态
  const [currentView, setCurrentView] = useState<View>('chat');
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // 侧边栏状态
  const [sidebarState, setSidebarState] = useState({ isCollapsed: false });

  // 视图操作方法
  const handleOpenView = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const handleOpenEditor = useCallback((persona: Persona | null) => {
    setEditingPersona(persona);
    setCurrentView('editor');
  }, []);

  const handleCloseEditor = useCallback(() => {
    setCurrentView('personas');
  }, []);

  // 侧边栏操作方法
  const handleSidebarStateChange = useCallback((state: { isCollapsed: boolean }) => {
    setSidebarState({ isCollapsed: state.isCollapsed });
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarState(prev => ({ isCollapsed: !prev.isCollapsed }));
  }, []);

  // 确认对话框操作
  const handleCloseConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  return {
    // 视图管理
    currentView,
    setCurrentView,
    handleOpenView,
    handleOpenEditor,
    handleCloseEditor,
    
    // 编辑状态
    editingPersona,
    setEditingPersona,
    
    // 侧边栏状态
    isMobileSidebarOpen: uiState.isMobileSidebarOpen,
    toggleMobileSidebar: uiState.toggleMobileSidebar,
    sidebarState,
    handleSidebarStateChange,
    handleToggleSidebar,
    
    // 确认对话框
    confirmation,
    setConfirmation,
    handleCloseConfirmation,
    
    // UI状态上下文
    uiState
  };
};