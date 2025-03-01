import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiClock, FiX } from 'react-icons/fi';
import { searchService } from '../services/searchService';
import { useDebounce } from '../hooks/useDebounce';

const SearchBar = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const searchBarRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setHistory(searchService.getSearchHistory() || []);
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  const loadSuggestions = async () => {
    try {
      const newSuggestions = await searchService.getSearchSuggestions(query);
      if (Array.isArray(newSuggestions)) {
        setSuggestions(newSuggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    searchService.addToHistory(searchQuery);
    setHistory(searchService.getSearchHistory());
    setSuggestions([]);
    setIsFocused(false);
    onSearch(searchQuery);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSearch(query.trim());
    }
  };

  const handleClickOutside = (e) => {
    if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
      setIsFocused(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchBarRef} className="relative max-w-2xl mx-auto z-20">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search anything..."
          className="w-full px-4 py-3 pl-12 rounded-full 
                   glass-panel
                   border-2 border-retro-paper/20
                   focus:border-retro-rose/50 focus:outline-none 
                   shadow-lg shadow-retro-rose/10
                   transition-all duration-300
                   text-retro-paper placeholder-retro-paper/50"
        />
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 
                          text-retro-rose w-5 h-5" />
      </div>

      {/* Search suggestions dropdown */}
      {isFocused && (suggestions.length > 0 || history.length > 0) && (
        <div className="absolute w-full mt-2 py-2 rounded-2xl glass-panel 
                      border border-retro-paper/20 shadow-lg z-30">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-retro-rose/10 
                       text-retro-paper transition-colors duration-150"
            >
              {suggestion}
            </button>
          ))}
          
          {history.length > 0 && (
            <>
              <div className="flex items-center justify-between px-4 py-2 text-xs border-t border-retro-paper/10">
                <span className="text-retro-paper/50">Recent Searches</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    searchService.clearHistory();
                    setHistory([]);
                  }}
                  className="text-retro-rose hover:text-retro-rose/70 transition-colors duration-150"
                >
                  Clear All
                </button>
              </div>
              {history.map((item, idx) => (
                <button
                  key={`history-${idx}`}
                  onClick={() => handleSearch(item)}
                  className="w-full px-4 py-2 text-left hover:bg-retro-rose/10 
                           text-retro-paper/70 transition-colors duration-150 
                           flex items-center justify-between group"
                >
                  <span>{item}</span>
                  <FiClock className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity duration-150" />
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 