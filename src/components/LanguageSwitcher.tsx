import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative">
      <button
        onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-jpblue-50 hover:text-jpblue-700 transition-all duration-200 group"
        title={language === 'en' ? 'Switch to Japanese' : 'Switch to English'}
      >
        <Globe className="h-5 w-5 transition-transform group-hover:scale-110" />
        <span className="text-sm font-medium">
          {language === 'en' ? '日本語' : 'English'}
        </span>
      </button>
    </div>
  );
}