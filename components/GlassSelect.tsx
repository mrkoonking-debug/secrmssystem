import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface GlassSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
  searchable?: boolean;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  className = '',
  hasError = false,
  disabled = false,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setSearchQuery(''), 300);
    } else if (searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2 tracking-wide">{label}</label>}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full text-left flex items-center justify-between
          bg-white dark:bg-[#2c2c2e] 
          border ${hasError ? 'border-red-500' : isOpen ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20' : 'border-[#d2d2d7] dark:border-[#424245]'}
          rounded-xl px-4 py-3 text-sm 
          text-[#1d1d1f] dark:text-white 
          transition-all duration-200
          hover:border-[#0071e3]
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className={!selectedOption ? "text-gray-500 dark:text-gray-400" : ""}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl shadow-xl overflow-hidden animate-fade-in origin-top">

          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-[#333] sticky top-0 bg-white dark:bg-[#2c2c2e] z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Search..."
                  className="w-full bg-gray-100 dark:bg-[#3a3a3c] border-none rounded-lg py-2 pl-9 pr-3 text-sm text-[#1d1d1f] dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 placeholder-gray-400"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar" ref={listRef}>
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 last:mb-0 text-left
                    ${option.value === value
                      ? 'bg-[#0071e3] text-white shadow-sm'
                      : 'text-[#1d1d1f] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3c]'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span className="font-medium truncate">{option.label}</span>
                  </div>
                  {option.value === value && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};