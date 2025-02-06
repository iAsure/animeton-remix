import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAmplitude } from '@lib/amplitude';

interface SearchInputProps {
  onSearch?: (term: string) => void;
  onClear?: () => void;
  initialValue?: string;
  placeholder?: string;
}


const SearchInput = ({
  onSearch,
  onClear,
  initialValue = '',
  placeholder = 'Buscar',
}: SearchInputProps) => {
  const amplitude = useAmplitude();

  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(initialValue);
    setIsExpanded(!!initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        if (!inputValue) {
          setIsExpanded(false);
        }
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, inputValue]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onSearch?.(newValue);
  };

  const handleClearInput = () => {
    setInputValue('');
    setIsExpanded(false);
    onClear?.();
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    amplitude.track('Search Input Opened');
  };

  return (
    <div
      ref={containerRef}

      className="relative inline-flex items-center webkit-app-region-no-drag"
      style={{ zIndex: 9999 }}
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="text"
              className="h-10 py-2 pl-4 pr-10 w-full text-white placeholder-white/70 
                                     rounded-full bg-white/10 backdrop-blur-sm focus:outline-none 
                                     focus:ring-1 focus:ring-white/30"
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
            />
            {inputValue && (
              <button
                onClick={handleClearInput}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 
                                         text-white/70 hover:text-white focus:outline-none"
              >
                <Icon
                  icon="gravity-ui:xmark"
                  width="20"
                  className="pointer-events-none"
                />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleExpand}
        className={`focus:outline-none p-1 hover:bg-zinc-800 rounded 
                               transition-colors ${isExpanded ? 'ml-2' : ''}`}
      >
        <Icon
          icon="gravity-ui:magnifier"
          width="28"
          height="28"
          className="text-white pointer-events-none"
        />
      </button>
    </div>
  );
};

export default SearchInput;
