const HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

class SearchService {
  constructor() {
    this.baseUrl = process.env.VITE_API_URL || 'http://localhost:8000/api';
  }

  // Search History Methods
  getSearchHistory() {
    try {
      const history = localStorage.getItem(HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  addToHistory(query) {
    try {
      const history = this.getSearchHistory();
      const newHistory = [
        query,
        ...history.filter(item => item !== query)
      ].slice(0, MAX_HISTORY_ITEMS);
      
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    } catch (error) {
      console.error('Error adding to search history:', error);
      return [];
    }
  }

  clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }

  // Search Suggestions
  async getSearchSuggestions(query) {
    if (!query) return [];
    
    try {
      const response = await fetch(
        `${this.baseUrl}/suggestions?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
