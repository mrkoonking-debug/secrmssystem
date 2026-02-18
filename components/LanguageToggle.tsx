
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Languages } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-full text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 transition-all flex items-center gap-1"
      title="Switch Language"
    >
      <Languages className="h-5 w-5" />
      <span className="text-xs font-bold uppercase">{language}</span>
    </button>
  );
};
