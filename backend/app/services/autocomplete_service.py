from ..utils.cache import cached_search
import aiohttp
from ..config import settings

class AutocompleteService:
    def __init__(self):
        self.api_key = settings.SERPAPI_KEY
        self.base_url = "https://serpapi.com/search"

    @cached_search
    async def get_suggestions(self, query: str):
        try:
            params = {
                "engine": "google_autocomplete",
                "api_key": self.api_key,
                "q": query,
                "gl": "in",
                "hl": "en"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        suggestions = data.get("suggestions", [])
                        # Limit to 5 suggestions
                        return [item.get("value", "") for item in suggestions][:5]
                    return []
        except Exception as e:
            print(f"Error fetching suggestions: {e}")
            return [] 