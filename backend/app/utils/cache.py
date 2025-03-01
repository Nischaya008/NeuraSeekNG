from functools import lru_cache
from typing import Any, Callable
from datetime import datetime, timedelta

class TimedCache:
    def __init__(self, ttl_seconds: int = 300):
        self.ttl_seconds = ttl_seconds
        self.cache = {}
        self.timestamps = {}

    def get(self, key: str) -> Any:
        if key in self.cache:
            timestamp = self.timestamps[key]
            if datetime.now() - timestamp < timedelta(seconds=self.ttl_seconds):
                return self.cache[key]
            else:
                del self.cache[key]
                del self.timestamps[key]
        return None

    def set(self, key: str, value: Any):
        self.cache[key] = value
        self.timestamps[key] = datetime.now()

search_cache = TimedCache(ttl_seconds=300)  # 5 minutes cache

def cached_search(func: Callable):
    async def wrapper(*args, **kwargs):
        # Create cache key from function name and arguments
        cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
        
        # Check cache
        cached_result = search_cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Execute function and cache result
        result = await func(*args, **kwargs)
        search_cache.set(cache_key, result)
        return result
    
    return wrapper 