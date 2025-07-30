import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { translations } from './translations';

type Language = keyof typeof translations;

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode, initialLanguage: Language }> = ({ children, initialLanguage }) => {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  const t = useCallback((key: keyof typeof translations['en']): string => {
    return translations[language]?.[key] || translations['en'][key];
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

// Export translations for use in other parts of the app, like settings search
export { translations };