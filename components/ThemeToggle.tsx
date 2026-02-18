
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-[#86868b] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all flex items-center justify-center"
      title="Toggle Theme"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 transition-transform hover:rotate-12" />
      ) : (
        <Sun className="h-5 w-5 transition-transform hover:rotate-90" />
      )}
    </button>
  );
};
