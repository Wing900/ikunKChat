import { useState, useEffect, useCallback } from 'react';
import { PersonaMemory } from '../types';
import { loadPersonaMemories, savePersonaMemories } from '../services/storageService';

interface UsePersonaMemoriesProps {
  isStorageLoaded: boolean;
}

export const usePersonaMemories = ({ isStorageLoaded }: UsePersonaMemoriesProps) => {
  const [memories, setMemories] = useState<Record<string, PersonaMemory[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStorageLoaded) {
      try {
        setLoading(true);
        const loadedMemories = loadPersonaMemories();
        setMemories(loadedMemories);
        setError(null);
      } catch (err) {
        console.error('Failed to load persona memories:', err);
        setError('加载角色记忆失败');
      } finally {
        setLoading(false);
      }
    }
  }, [isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
      try {
        savePersonaMemories(memories);
        setError(null);
      } catch (err) {
        console.error('Failed to save persona memories:', err);
        setError('保存角色记忆失败');
      }
    }
  }, [memories, isStorageLoaded]);

  const getMemoriesForPersona = useCallback((personaId: string): PersonaMemory[] => {
    return memories[personaId] || [];
  }, [memories]);

  const addMemory = useCallback((personaId: string, content: string) => {
    const newMemory: PersonaMemory = {
      id: crypto.randomUUID(),
      personaId,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'manual',
    };

    setMemories(prev => ({
      ...prev,
      [personaId]: [...(prev[personaId] || []), newMemory],
    }));
  }, []);

  const updateMemory = useCallback((personaId: string, memoryId: string, content: string) => {
    setMemories(prev => {
      const personaMemories = prev[personaId] || [];
      const updatedMemories = personaMemories.map(mem =>
        mem.id === memoryId ? { ...mem, content, updatedAt: Date.now() } : mem
      );
      return { ...prev, [personaId]: updatedMemories };
    });
  }, []);

  const deleteMemory = useCallback((personaId: string, memoryId: string) => {
    setMemories(prev => {
      const personaMemories = prev[personaId] || [];
      const updatedMemories = personaMemories.filter(mem => mem.id !== memoryId);
      return { ...prev, [personaId]: updatedMemories };
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    memories,
    getMemoriesForPersona,
    addMemory,
    updateMemory,
    deleteMemory,
    loading,
    error,
    clearError,
  };
};