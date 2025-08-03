import { useState, useEffect, useCallback } from 'react';
import { Persona } from '../types';
import { loadRoles, saveRoles } from '../services/storageService';
import { defaultPersonas } from '../data/defaultPersonas';

interface UsePersonasProps {
  isStorageLoaded: boolean;
}

export const usePersonas = ({ isStorageLoaded }: UsePersonasProps) => {
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    if (isStorageLoaded) {
      const customPersonas = loadRoles();
      setPersonas([...defaultPersonas, ...customPersonas]);
    }
  }, [isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
      const customPersonas = personas.filter(p => !p.isDefault);
      saveRoles(customPersonas);
    }
  }, [personas, isStorageLoaded]);

  const savePersonas = useCallback((personaToSave: Persona) => {
    setPersonas(prev => {
      const existing = prev.find(p => p.id === personaToSave.id);
      if (existing) {
        return prev.map(p => p.id === personaToSave.id ? personaToSave : p);
      }
      return [...prev, { ...personaToSave, id: crypto.randomUUID(), isDefault: false }];
    });
  }, []);

  return { personas, setPersonas, savePersonas };
};