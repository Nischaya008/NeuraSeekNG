import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FiTrendingUp, FiZap, FiCpu, FiGlobe, FiCode, FiDatabase } from 'react-icons/fi';

const allSuggestions = [
  {
    title: "Latest AI Papers",
    query: "artificial intelligence research papers 2024",
    icon: FiCpu,
    color: "from-blue-500 to-purple-500",
    description: "Explore cutting-edge AI research and breakthroughs"
  },
  {
    title: "Tech News",
    query: "technology news latest developments",
    icon: FiZap,
    color: "from-amber-500 to-red-500",
    description: "Stay updated with the latest tech innovations"
  },
  {
    title: "Space Exploration",
    query: "space exploration discoveries NASA",
    icon: FiGlobe,
    color: "from-indigo-500 to-blue-500",
    description: "Discover the latest space missions and findings"
  },
  {
    title: "Climate Research",
    query: "climate change scientific studies",
    icon: FiDatabase,
    color: "from-green-500 to-teal-500",
    description: "Latest environmental science and climate data"
  },
  {
    title: "Quantum Computing",
    query: "quantum computing breakthroughs",
    icon: FiCode,
    color: "from-purple-500 to-pink-500",
    description: "Latest developments in quantum technologies"
  },
  {
    title: "Biotech Innovation",
    query: "biotechnology medical breakthroughs",
    icon: FiTrendingUp,
    color: "from-rose-500 to-orange-500",
    description: "Cutting-edge biotech and medical research"
  }
];

const SearchSuggestions = ({ onSearch }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Randomly select 4 suggestions
    const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 4));
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-12 relative z-10">
      {suggestions.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <motion.div
            key={index}
            className="glass-panel rounded-xl p-6 cursor-pointer 
                     hover:bg-retro-paper/5 transition-all duration-300
                     border border-retro-paper/10"
            onClick={() => onSearch(suggestion.query)}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: index * 0.1 } 
            }}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`p-3 rounded-full bg-gradient-to-r ${suggestion.color} 
                           shadow-lg shadow-retro-rose/10`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-retro-paper font-medium">{suggestion.title}</h3>
              <p className="text-sm text-retro-paper/70 line-clamp-2">
                {suggestion.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SearchSuggestions; 