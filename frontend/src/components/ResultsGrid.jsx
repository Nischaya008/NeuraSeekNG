import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLoader } from 'react-icons/fi';
import AISummary from './AISummary';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { searchService } from '../services/searchService';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <FiLoader className="w-8 h-8 text-purple-500" />
    </motion.div>
  </div>
);

const SentimentAnalysis = ({ sentiment }) => {
  const getEmotionColor = (emotion) => {
    const colors = {
      joy: 'bg-retro-yellow/20 text-retro-yellow',
      love: 'bg-retro-rose/20 text-retro-rose',
      anger: 'bg-retro-terminal/20 text-retro-terminal',
      sadness: 'bg-retro-paper/20 text-retro-paper',
      fear: 'bg-retro-background/20 text-retro-paper',
      surprise: 'bg-retro-yellow/20 text-retro-yellow',
      default: 'bg-retro-paper/10 text-retro-paper/70'
    };
    return colors[emotion.toLowerCase()] || colors.default;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {sentiment.emotions?.map((emotion, idx) => (
          <span
            key={idx}
            className={`px-3 py-1 rounded-full text-sm ${getEmotionColor(emotion.emotion)}`}
          >
            {emotion.emotion} ({Math.round(emotion.score * 100)}%)
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Dominant emotion: <span className="font-medium">{sentiment.dominant_emotion}</span>
      </p>
    </div>
  );
};

const EnhancedSentimentAnalysis = ({ sentiment, overallSentiment }) => {
  const getEmotionColor = (emotion) => {
    const colors = {
      joy: 'bg-retro-yellow/20 text-retro-yellow',
      love: 'bg-retro-rose/20 text-retro-rose',
      anger: 'bg-retro-terminal/20 text-retro-terminal',
      sadness: 'bg-retro-paper/20 text-retro-paper',
      fear: 'bg-retro-background/20 text-retro-paper',
      surprise: 'bg-retro-yellow/20 text-retro-yellow',
      default: 'bg-retro-paper/10 text-retro-paper/70'
    };
    return colors[emotion.toLowerCase()] || colors.default;
  };

  const getOverallSentimentColor = (sentiment) => {
    const colors = {
      Positive: 'bg-retro-terminal/20 text-retro-terminal',
      Negative: 'bg-retro-rose/20 text-retro-rose',
      Neutral: 'bg-retro-paper/20 text-retro-paper'
    };
    return colors[sentiment] || colors.Neutral;
  };

  return (
    <div className="space-y-4">
      {sentiment && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Emotional Analysis
          </h4>
          <div className="flex flex-wrap gap-2">
            {sentiment.emotions?.map((emotion, idx) => (
              <span
                key={idx}
                className={`px-3 py-1 rounded-full text-sm ${getEmotionColor(emotion.emotion)}`}
              >
                {emotion.emotion} ({Math.round(emotion.score * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {overallSentiment && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Overall Sentiment
          </h4>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOverallSentimentColor(overallSentiment.dominant)}`}>
              {overallSentiment.dominant} ({Math.round(overallSentiment.confidence * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Add at the top, outside the component
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const LazyImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      loading="lazy"
      onLoad={() => setIsLoaded(true)}
    />
  );
};

// Add this component for virtualized rendering
const VirtualizedResults = ({ results, renderItem }) => {
  const itemSize = 200; // Adjust based on your item height

  return (
    <div style={{ height: '80vh' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={results.length}
            itemSize={itemSize}
          >
            {({ index, style }) => (
              <div style={style}>
                {renderItem(results[index])}
              </div>
            )}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

const ResultsGrid = ({ type, query }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Memoized fetch function
  const fetchResults = useCallback(async () => {
    if (!debouncedQuery) return;

    const cacheKey = `${type}-${debouncedQuery}-${page}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setResults(cached.data.results);
      setNextPageToken(cached.data.next_page_token);
      setHasMore(cached.data.has_more);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        type: type,
        page: page.toString(),
        page_size: '20'
      });

      if (nextPageToken) {
        params.append('page_token', nextPageToken);
      }

      const response = await fetch(`${searchService.baseUrl}/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      if (page === 1) {
        setResults(data.results);
      } else {
        setResults(prev => [...prev, ...data.results]);
      }
      
      setNextPageToken(data.next_page_token);
      setHasMore(data.has_more);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, type, page, nextPageToken]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const renderSourceInfo = (result) => (
    <div className="flex items-center space-x-2 text-sm text-gray-500">
      {result.source_icon && (
        <img 
          src={result.source_icon} 
          alt={result.source_name || 'source'} 
          className="w-4 h-4 rounded-full"
        />
      )}
      <div className="flex items-center space-x-2">
        {result.source_name && (
          <span className="font-medium">{result.source_name}</span>
        )}
        {result.additional_info?.channel && (
          <span className="flex items-center">
            <span className="mx-2">•</span>
            {result.additional_info.channel}
          </span>
        )}
        {result.additional_info?.subreddit && (
          <span className="flex items-center">
            <span className="mx-2">•</span>
            r/{result.additional_info.subreddit}
          </span>
        )}
      </div>
    </div>
  );

  const LoadMoreButton = () => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 
                 text-white rounded-full shadow-lg hover:shadow-xl
                 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={() => fetchResults(true)}
      disabled={isLoadingMore || !hasMore}
    >
      {isLoadingMore ? (
        <FiLoader className="w-6 h-6 animate-spin" />
      ) : (
        'Load More'
      )}
    </motion.button>
  );

  const renderContent = () => {
    const handleClick = (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    switch (type) {
      case 'images':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map((image) => (
                <motion.div
                  key={image.id}
                  variants={item}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                  onClick={() => handleClick(image.url)}
                >
                  <div className="aspect-w-16 aspect-h-12 bg-gray-100">
                    <LazyImage
                      src={image.thumbnail || image.url}
                      alt={image.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white font-medium mb-2 line-clamp-2">{image.title}</h3>
                    {renderSourceInfo(image)}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {!loading && !error && hasMore && (
              <div className="flex justify-center">
                <LoadMoreButton />
              </div>
            )}
          </div>
        );

      case 'videos':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((video) => (
                <motion.div
                  key={video.id}
                  variants={item}
                  className="bg-white dark:bg-navy-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  onClick={() => handleClick(video.url)}
                >
                  <div className="relative group">
                    <div className="aspect-w-16 aspect-h-9">
                      <LazyImage
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-2 line-clamp-2 dark:text-white">{video.title}</h3>
                    {renderSourceInfo(video)}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {!loading && !error && hasMore && (
              <div className="flex justify-center">
                <LoadMoreButton />
              </div>
            )}
          </div>
        );

      case 'papers':
        return (
          <div className="space-y-6">
            {results[0]?.additional_info?.ai_summary && (
              <AISummary 
                summary={results[0].additional_info.ai_summary}
                sources={results[0].additional_info.summary_sources}
              />
            )}
            {results.map((paper) => (
              <motion.div
                key={paper.id}
                variants={item}
                onClick={() => handleClick(paper.url)}
                className="bg-white dark:bg-navy-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-purple-100 dark:border-purple-900/20"
              >
                <div className="flex items-center justify-between mb-4">
                  {renderSourceInfo(paper)}
                  {paper.additional_info && (
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                        {paper.additional_info.year}
                      </span>
                      <span className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>{paper.additional_info.citations} citations</span>
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">
                  {paper.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                  {paper.description}
                </p>
                {paper.additional_info?.sentiment && (
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <SentimentAnalysis sentiment={paper.additional_info.sentiment} />
                  </div>
                )}
              </motion.div>
            ))}
            
            {!loading && !error && hasMore && (
              <div className="flex justify-center">
                <LoadMoreButton />
              </div>
            )}
          </div>
        );

      case 'discussions':
        return (
          <div className="space-y-6">
            {results[0]?.additional_info?.ai_summary && (
              <AISummary 
                summary={results[0].additional_info.ai_summary}
                sources={results[0].additional_info.summary_sources}
              />
            )}
            {results.map((discussion) => (
              <motion.div
                key={discussion.id}
                variants={item}
                onClick={() => handleClick(discussion.url)}
                className="bg-white dark:bg-navy-800 p-6 rounded-xl shadow-lg hover:shadow-2xl 
                           transition-all duration-300 cursor-pointer border border-purple-100 
                           dark:border-purple-900/20"
              >
                <div className="flex items-center justify-between mb-4">
                  {renderSourceInfo(discussion)}
                  <div className="flex items-center space-x-4">
                    {discussion.additional_info?.score !== undefined && (
                      <span className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span>{discussion.additional_info.score}</span>
                      </span>
                    )}
                    {discussion.additional_info?.num_comments !== undefined && (
                      <span className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>{discussion.additional_info.num_comments}</span>
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">
                  {discussion.title}
                </h3>
                {discussion.description && (
                  <>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                      {discussion.description}
                    </p>
                    {(discussion.additional_info?.sentiment || discussion.additional_info?.overall_sentiment) && (
                      <EnhancedSentimentAnalysis 
                        sentiment={discussion.additional_info.sentiment}
                        overallSentiment={discussion.additional_info.overall_sentiment}
                      />
                    )}
                  </>
                )}
                <div className="flex items-center justify-between text-sm mt-4">
                  {discussion.additional_info?.subreddit && (
                    <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 
                                   text-purple-600 dark:text-purple-400">
                      r/{discussion.additional_info.subreddit}
                    </span>
                  )}
                  {discussion.additional_info?.created_utc && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(discussion.additional_info.created_utc * 1000).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
            
            {!loading && !error && hasMore && (
              <div className="flex justify-center">
                <LoadMoreButton />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {results[0]?.additional_info?.ai_summary && (
              <AISummary 
                summary={results[0].additional_info.ai_summary}
                sources={results[0].additional_info.summary_sources}
              />
            )}
            {results.map((result) => (
              <motion.div
                key={result.id}
                variants={item}
                onClick={() => handleClick(result.url)}
                className="bg-white dark:bg-navy-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-purple-100 dark:border-purple-900/20"
              >
                {renderSourceInfo(result)}
                <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mt-3 mb-2">
                  {result.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                  {result.description}
                </p>
              </motion.div>
            ))}
            
            {!loading && !error && hasMore && (
              <div className="flex justify-center">
                <LoadMoreButton />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center text-red-500"
        >
          Error: {error}
        </motion.div>
      ) : (
        <motion.div
          key={type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-5xl mx-auto"
        >
          {renderContent()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultsGrid; 
