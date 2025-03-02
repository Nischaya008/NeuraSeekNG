import { createContext, useContext } from 'react';

const getUniqueUserId = () => {
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_id', userId);
  }
  return userId;
};

const STATS_KEY = (userId) => `neura_seek_stats_${userId}`;
const SearchStatsContext = createContext();

export function SearchStatsProvider({ children }) {
  const userId = getUniqueUserId();

  const incrementSearches = () => {
    const savedStats = localStorage.getItem(STATS_KEY(userId));
    const currentStats = savedStats ? JSON.parse(savedStats) : {
      timeSpent: 0,
      searchesMade: 0,
      lastVisit: new Date().toISOString()
    };

    const newStats = {
      ...currentStats,
      searchesMade: currentStats.searchesMade + 1,
      lastVisit: new Date().toISOString()
    };

    localStorage.setItem(STATS_KEY(userId), JSON.stringify(newStats));
    
    // Dispatch a custom event to notify StatsWidget
    window.dispatchEvent(new CustomEvent('statsUpdate', { detail: newStats }));
  };

  return (
    <SearchStatsContext.Provider value={{ incrementSearches }}>
      {children}
    </SearchStatsContext.Provider>
  );
}

export const useSearchStats = () => useContext(SearchStatsContext); 
