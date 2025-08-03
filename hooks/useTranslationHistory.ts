import { useState, useEffect } from 'react';
import { TranslationHistoryItem } from '../types';
import { loadTranslationHistory, saveTranslationHistory } from '../services/storageService';

interface UseTranslationHistoryProps {
  isStorageLoaded: boolean;
}

export const useTranslationHistory = ({ isStorageLoaded }: UseTranslationHistoryProps) => {
  const [translationHistory, setTranslationHistory] = useState<TranslationHistoryItem[]>([]);

  useEffect(() => {
    if (isStorageLoaded) {
      setTranslationHistory(loadTranslationHistory());
    }
  }, [isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
      saveTranslationHistory(translationHistory);
    }
  }, [translationHistory, isStorageLoaded]);

  return { translationHistory, setTranslationHistory };
};