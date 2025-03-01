import { motion } from 'framer-motion';
import { FiGrid, FiImage, FiVideo, FiMessageCircle, FiBook } from 'react-icons/fi';

const tabs = [
  { id: 'all', label: 'All', icon: FiGrid },
  { id: 'images', label: 'Images', icon: FiImage },
  { id: 'videos', label: 'Videos', icon: FiVideo },
  { id: 'discussions', label: 'Discussions', icon: FiMessageCircle },
  { id: 'papers', label: 'Research Papers', icon: FiBook },
];

const ResultsTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-8">
      <nav className="flex justify-center space-x-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-300 whitespace-nowrap
                ${isActive 
                  ? 'bg-gradient-to-r from-retro-rose to-retro-terminal text-retro-paper shadow-lg' 
                  : 'bg-retro-background/50 hover:bg-retro-background/70 text-retro-paper/70 hover:text-retro-paper'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="mr-2" />
              {tab.label}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
};

export default ResultsTabs; 