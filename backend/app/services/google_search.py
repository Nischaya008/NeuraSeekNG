from googleapiclient.discovery import build
from ..config import settings
from ..models.search import SearchResult
from ..utils.cache import cached_search

class GoogleSearchService:
    def __init__(self):
        self.service = build(
            "customsearch", "v1",
            developerKey=settings.GOOGLE_API_KEY
        )

    @cached_search
    async def search(self, query: str, search_type: str = None, page: int = 1, page_size: int = 20):
        try:
            all_results = []
            remaining = page_size
            current_start = (page - 1) * page_size + 1
            
            while remaining > 0:
                search_params = {
                    "q": query,
                    "cx": settings.GOOGLE_CX_ID,
                    "start": current_start,
                    "num": min(remaining, 10)  # Google API max is 10
                }
                
                if search_type == "images":
                    search_params["searchType"] = "image"

                results = self.service.cse().list(**search_params).execute()
                items = results.get("items", [])
                
                if not items:
                    break
                    
                for item in items:
                    favicon = f"https://www.google.com/s2/favicons?domain={item['link']}&sz=32"
                    source_name = item.get("displayLink", "").replace("www.", "")
                    
                    result = SearchResult(
                        id=item["link"],
                        title=item["title"],
                        description=item.get("snippet"),
                        url=item["link"],
                        thumbnail=item.get("pagemap", {}).get("cse_thumbnail", [{}])[0].get("src"),
                        type="image" if search_type == "images" else "web",
                        source_icon=favicon,
                        source_name=source_name
                    )
                    all_results.append(result)
                
                remaining -= len(items)
                current_start += len(items)
                
                # Break if we got fewer results than requested
                if len(items) < min(remaining, 10):
                    break

            return all_results, int(results["searchInformation"]["totalResults"])
            
        except Exception as e:
            print(f"Google Search Error: {e}")
            return [], 0 