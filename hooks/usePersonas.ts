import { useState, useEffect, useCallback } from 'react';
import { Persona } from '../types';
import { loadRoles, saveRoles, validatePersona, sanitizePersona } from '../services/storageService';
import { defaultPersonas } from '../data/defaultPersonas';

interface UsePersonasProps {
  isStorageLoaded: boolean;
}

interface PersonaFilters {
  name?: string;
  tags?: string[];
  isDefault?: boolean;
}

export const usePersonas = ({ isStorageLoaded }: UsePersonasProps) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStorageLoaded) {
      try {
        setLoading(true);
        const customPersonas = loadRoles();
        // 确保不会重复添加默认角色
        const customPersonaIds = new Set(customPersonas.map(p => p.id));
        const filteredDefaultPersonas = defaultPersonas.filter(p => !customPersonaIds.has(p.id));
        const finalPersonas = [...filteredDefaultPersonas, ...customPersonas];
        setPersonas(finalPersonas);
        setError(null);
      } catch (err) {
        console.error('Failed to load personas:', err);
        setError('加载角色数据失败');
      } finally {
        setLoading(false);
      }
    }
  }, [isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
      try {
        // 只保存非默认角色
        const customPersonas = personas.filter(p => p && !p.isDefault);
        saveRoles(customPersonas);
        setError(null);
      } catch (err) {
        console.error('Failed to save personas:', err);
        setError('保存角色数据失败');
      }
    }
  }, [personas, isStorageLoaded]);

  const savePersonas = useCallback((personaToSave: Persona) => {
    try {
      // 验证和清理数据
      const sanitizedPersona = sanitizePersona(personaToSave);
      const validation = validatePersona(sanitizedPersona);
      
      if (!validation.isValid) {
        console.warn('Persona validation failed:', validation.errors);
        setError('角色数据验证失败: ' + validation.errors.join(', '));
        return;
      }

      setPersonas(prev => {
        const existing = prev.find(p => p && p.id === personaToSave.id);
        if (existing) {
          // 如果是内置角色，确保 isDefault 属性不会被更改
          if (existing.isDefault) {
            sanitizedPersona.isDefault = true;
          }
          return prev.map(p => p && p.id === personaToSave.id ? sanitizedPersona : p);
        }
        // 新创建的角色不可能是内置角色
        return [...prev, { ...sanitizedPersona, id: crypto.randomUUID(), isDefault: false }];
      });
      
      setError(null);
    } catch (err) {
      console.error('Failed to save persona:', err);
      setError('保存角色失败');
    }
  }, []);

  const deletePersona = useCallback((id: string) => {
    try {
      let successfullyDeleted = false;
      setPersonas(prev => {
        const personaToDelete = prev.find(p => p && p.id === id);
        if (personaToDelete && !personaToDelete.isDefault) {
          successfullyDeleted = true;
          return prev.filter(p => !p || p.id !== id);
        }
        
        if (personaToDelete && personaToDelete.isDefault) {
          setError('默认角色不能删除');
        }
        return prev;
      });

      if (successfullyDeleted) {
        setError(null);
      }
    } catch (err) {
      console.error('Failed to delete persona:', err);
      setError('删除角色失败');
    }
  }, []);

  const searchPersonas = useCallback((query: string, filters?: PersonaFilters): Persona[] => {
    let filteredPersonas = personas.filter(p => p); // 首先过滤掉 undefined/null 的元素
    
    // 文本搜索
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filteredPersonas = filteredPersonas.filter(persona =>
        persona.name.toLowerCase().includes(lowerQuery) ||
        persona.bio.toLowerCase().includes(lowerQuery) ||
        persona.systemPrompt.toLowerCase().includes(lowerQuery)
      );
    }
    
    // 应用过滤器
    if (filters) {
      // 标签过滤
      if (filters.tags && filters.tags.length > 0) {
        filteredPersonas = filteredPersonas.filter(persona =>
          filters.tags!.some(tag =>
            persona.name.toLowerCase().includes(tag.toLowerCase()) ||
            persona.bio.toLowerCase().includes(tag.toLowerCase())
          )
        );
      }
      
      // 默认角色过滤
      if (filters.isDefault !== undefined) {
        filteredPersonas = filteredPersonas.filter(persona =>
          persona.isDefault === filters.isDefault
        );
      }
    }
    
    return filteredPersonas;
  }, [personas]);

  const getPersonaById = useCallback((id: string): Persona | undefined => {
    return personas.find(p => p && p.id === id);
  }, [personas]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    personas,
    setPersonas,
    savePersonas,
    deletePersona,
    searchPersonas,
    getPersonaById,
    loading,
    error,
    clearError
  };
};