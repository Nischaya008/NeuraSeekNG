import { useState, useEffect } from 'react';
import { FiClock, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';

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
      lastVisit: new Date().toISOString(),
      lastActiveTimestamp: new Date().getTime()
    };
  });

  // Update localStorage whenever stats change
  useEffect(() => {
    localStorage.setItem(STATS_KEY(userId), JSON.stringify(stats));
  }, [stats, userId]);

  // Handle time tracking with persistence
  useEffect(() => {
    // Calculate time difference since last active session
    const currentTime = new Date().getTime();
    const lastActiveTime = stats.lastActiveTimestamp;
    
    // Update last active timestamp
    setStats(prev => ({
      ...prev,
      lastActiveTimestamp: currentTime
    }));

    // Start the timer
    const timer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        timeSpent: prev.timeSpent + 1,
        lastActiveTimestamp: new Date().getTime()
      }));
    }, 1000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden (user switched tabs or minimized)
        clearInterval(timer);
      } else {
        // Page is visible again, calculate time difference
        const newCurrentTime = new Date().getTime();
        setStats(prev => ({
          ...prev,
          lastActiveTimestamp: newCurrentTime
        }));
      }
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      localStorage.setItem(STATS_KEY(userId), JSON.stringify({
        ...stats,
        lastActiveTimestamp: new Date().getTime()
      }));
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
