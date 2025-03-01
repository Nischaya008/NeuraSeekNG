import { useState } from 'react';
import { motion } from 'framer-motion';
import SearchBar from '../components/SearchBar';
import ResultsTabs from '../components/ResultsTabs';
import ResultsGrid from '../components/ResultsGrid';
import BackgroundCanvas from '../components/BackgroundCanvas';
import SearchSuggestions from '../components/SearchSuggestions';
import StatsWidget from '../components/StatsWidget';
import { useSearchStats } from '../context/SearchStatsContext';
import SocialLinks from '../components/SocialLinks';
import AboutOverlay from '../components/AboutOverlay';

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { incrementSearches } = useSearchStats();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    incrementSearches();
  };

  return (
    <main className="relative flex-1">
      <BackgroundCanvas />
      
      <div className="search-container">
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed top-4 left-6 z-50"
          >
            <motion.h2
              className="text-2xl font-bold cursor-pointer
                         bg-clip-text text-transparent bg-gradient-to-r 
                         from-retro-rose to-retro-yellow"
              whileHover={{ 
                scale: 1.05,
                textShadow: "0 0 8px rgba(124, 58, 237, 0.5)" 
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
            >
              NeuraSeekNG
            </motion.h2>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {!isSearching ? (
            <>
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-center mb-12 mt-20
                           bg-clip-text text-transparent bg-gradient-to-r 
                           from-retro-rose to-retro-yellow"
                whileHover={{ scale: 1.02 }}
              >
                NeuraSeekNG
              </motion.h1>
              <div className="transition-all duration-300">
                <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
              </div>
              <SearchSuggestions onSearch={handleSearch} />
            </>
          ) : (
            <div className="transition-all duration-300 py-4">
              <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
            </div>
          )}
          
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              <ResultsTabs activeTab={activeTab} onTabChange={setActiveTab} />
              <ResultsGrid type={activeTab} query={searchQuery} />
            </motion.div>
          )}
        </motion.div>
      </div>
      {!isSearching && <StatsWidget />}
      {!isSearching && (
        <>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-4 px-4 py-2 glass-panel rounded-full
                      text-retro-paper/70 hover:text-retro-paper z-50
                      transition-colors duration-300"
            onClick={() => setIsAboutOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            About
          </motion.button>
          <SocialLinks />
        </>
      )}
      <AboutOverlay isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </main>
  );
};

export default SearchPage; 