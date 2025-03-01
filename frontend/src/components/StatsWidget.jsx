import { useState, useEffect } from 'react';
import { FiClock, FiSearch, FiTrendingUp } from 'react-icons/fi';
import { motion } from 'framer-motion';

const STATS_KEY = 'neura_seek_stats';

const StatsWidget = () => {
  const [stats, setStats] = useState(() => {
    // Initialize from localStorage on component mount
    const savedStats = localStorage.getItem(STATS_KEY);
    return savedStats ? JSON.parse(savedStats) : {
      timeSpent: 0,
      searchesMade: 0,
      lastVisit: new Date().toISOString()
    };
  });

  // Update localStorage whenever stats change
  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  // Handle time tracking
  useEffect(() => {
    // Load the last stored timestamp
    const lastTimestamp = localStorage.getItem('last_timestamp');
    const currentTime = new Date().getTime();
    
    if (lastTimestamp) {
      // If browser was closed, add the offline time difference
      const timeDiff = Math.floor((currentTime - parseInt(lastTimestamp)) / 1000);
      if (timeDiff > 0 && timeDiff < 24 * 60 * 60) { // Only count if less than 24 hours
        setStats(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + timeDiff
        }));
      }
    }

    // Start the timer
    const timer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        timeSpent: prev.timeSpent + 1
      }));
      localStorage.setItem('last_timestamp', new Date().getTime().toString());
    }, 1000);

    // Update timestamp on unmount
    return () => {
      clearInterval(timer);
      localStorage.setItem('last_timestamp', new Date().getTime().toString());
    };
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 left-4 p-4 glass-panel rounded-xl"
    >
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-retro-paper/70">
          <FiClock className="w-4 h-4" />
          <span>Time Spent: {formatTime(stats.timeSpent)}</span>
        </div>
        <div className="flex items-center space-x-2 text-retro-paper/70">
          <FiSearch className="w-4 h-4" />
          <span>Searches: {stats.searchesMade}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsWidget; 