import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

type Translations = { [key: string]: string | { [key: string]: string } };
type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface I18nContextType {
  language: Language;
  direction: Direction;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<{ [key in Language]?: Translations }>({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const enResponse = await fetch('/i18n/locales/en.json');
        const arResponse = await fetch('/i18n/locales/ar.json');
        const enData = await enResponse.json();
        const arData = await arResponse.json();
        setTranslations({ en: enData, ar: arData });
      } catch (error) {
        console.error("Failed to load translation files", error);
      }
    };
    loadTranslations();
  }, []);

  const setLanguageCallback = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);
  
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    const langTranslations = translations[language];
    if (!langTranslations) {
      return key; // Return key if translations are not loaded yet
    }
    const keys = key.split('.');
    let result: any = langTranslations;
    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
            return key; // Return key if not found
        }
    }
    
    if (typeof result === 'string' && options) {
        return result.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
            return options[varName]?.toString() || varName;
        });
    }

    return result || key;
  }, [language, translations]);
  
  if (!translations.en || !translations.ar) {
    return null; // Don't render app until translations are loaded
  }

  return (
    <I18nContext.Provider value={{ language, direction, setLanguage: setLanguageCallback, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};