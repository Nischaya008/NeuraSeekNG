import { useState, useEffect } from 'react';
import { FiClock, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useSearchStats } from '../context/SearchStatsContext';

const getUniqueUserId = () => {
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_id', userId);
  }
  return userId;
};

const STATS_KEY = (userId) => `neura_seek_stats_${userId}`;

const StatsWidget = () => {
  const userId = getUniqueUserId();
  const [stats, setStats] = useState(() => {
    const savedStats = localStorage.getItem(STATS_KEY(userId));
    return savedStats ? JSON.parse(savedStats) : {
      timeSpent: 0,
      searchesMade: 0,
      lastVisit: new Date().toISOString()
    };
  });

  // Update localStorage whenever stats change
  useEffect(() => {
    localStorage.setItem(STATS_KEY(userId), JSON.stringify(stats));
  }, [stats, userId]);

  // Listen for search count updates
  useEffect(() => {
    const handleStatsUpdate = (event) => {
      const newStats = event.detail;
      setStats(prevStats => ({
        ...prevStats,
        searchesMade: newStats.searchesMade,
        lastVisit: newStats.lastVisit
      }));
    };

    // Initial sync with localStorage
    const savedStats = localStorage.getItem(STATS_KEY(userId));
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      setStats(prevStats => ({
        ...prevStats,
        searchesMade: parsedStats.searchesMade || 0
      }));
    }

    window.addEventListener('statsUpdate', handleStatsUpdate);
    return () => window.removeEventListener('statsUpdate', handleStatsUpdate);
  }, [userId]);

  // Handle time tracking
  useEffect(() => {
    let timer;
    let startTime = Date.now();
    let isActive = true;

    const updateTime = () => {
      if (isActive) {
        const currentTime = Date.now();
        const timeDiff = Math.floor((currentTime - startTime) / 1000);
        startTime = currentTime;

        setStats(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + timeDiff
        }));
      }
    };

    // Start the timer
    timer = setInterval(updateTime, 1000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false;
        clearInterval(timer);
        updateTime(); // Update one last time before becoming hidden
      } else {
        isActive = true;
        startTime = Date.now();
        timer = setInterval(updateTime, 1000);
      }
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      updateTime(); // Update one last time before unloading
      localStorage.setItem(STATS_KEY(userId), JSON.stringify(stats));
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [userId, stats]);

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
