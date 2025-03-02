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
    let timer;
    const currentTime = new Date().getTime();
    const lastActiveTime = stats.lastActiveTimestamp;

    // Calculate time difference since last active session
    if (lastActiveTime) {
      const timeDiff = Math.floor((currentTime - lastActiveTime) / 1000);
      if (timeDiff > 0) {
        setStats(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + timeDiff,
          lastActiveTimestamp: currentTime
        }));
      }
    }

    // Start the timer for active session
    timer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        timeSpent: prev.timeSpent + 1,
        lastActiveTimestamp: new Date().getTime()
      }));
    }, 1000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timer);
        // Save the current timestamp when hiding
        const hiddenTime = new Date().getTime();
        setStats(prev => ({
          ...prev,
          lastActiveTimestamp: hiddenTime
        }));
      } else {
        // Calculate time difference when becoming visible
        const visibleTime = new Date().getTime();
        const lastTime = stats.lastActiveTimestamp;
        const timeDiff = Math.floor((visibleTime - lastTime) / 1000);
        
        setStats(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + timeDiff,
          lastActiveTimestamp: visibleTime
        }));

        // Restart the timer
        timer = setInterval(() => {
          setStats(prev => ({
            ...prev,
            timeSpent: prev.timeSpent + 1,
            lastActiveTimestamp: new Date().getTime()
          }));
        }, 1000);
      }
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      const unloadTime = new Date().getTime();
      const timeDiff = Math.floor((unloadTime - stats.lastActiveTimestamp) / 1000);
      
      const finalStats = {
        ...stats,
        timeSpent: stats.timeSpent + timeDiff,
        lastActiveTimestamp: unloadTime
      };
      
      localStorage.setItem(STATS_KEY(userId), JSON.stringify(finalStats));
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
  }, [userId, stats.lastActiveTimestamp]);

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
