import { createContext, useContext } from 'react';

const STATS_KEY = 'neura_seek_stats';
const SearchStatsContext = createContext();

export function SearchStatsProvider({ children }) {
  const incrementSearches = () => {
    const savedStats = localStorage.getItem(STATS_KEY);
    const currentStats = savedStats ? JSON.parse(savedStats) : {
      timeSpent: 0,
      searchesMade: 0,
      lastVisit: new Date().toISOString()
    };

    const newStats = {
      ...currentStats,
      searchesMade: (currentStats.searchesMade || 0) + 1,
      lastVisit: new Date().toISOString()
    };

    localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    
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