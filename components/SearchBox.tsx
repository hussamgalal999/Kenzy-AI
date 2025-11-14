import React from 'react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange, placeholder, suggestions, onSuggestionClick }) => {
  return (
    <div className="w-full px-4 pt-2 pb-4">
      <div className="relative">
        <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-brand-purple/50 dark:text-white/50">search</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 ps-10 pe-4 bg-light-gray dark:bg-brand-blue/20 rounded-full text-brand-blue dark:text-white placeholder:text-brand-purple/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestionClick?.(s)}
              className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary text-sm font-semibold rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
