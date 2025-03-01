from googleapiclient.discovery import build
from ..config import settings
from ..models.search import SearchResult
from ..utils.cache import cached_search

class YouTubeSearchService:
    def __init__(self):
        self.service = build(
            "youtube", "v3",
            developerKey=settings.YOUTUBE_API_KEY
        )

    def calculate_video_score(self, item, query):
        score = 0.0
        
        # Title relevance
        if query.lower() in item['snippet']['title'].lower():
            score += 5.0
            
        # Channel authority
        if 'statistics' in item['snippet']:
            subscriber_count = int(item['snippet']['statistics'].get('subscriberCount', 0))
            score += min(3.0, subscriber_count / 1000000)  # Up to 3 points for 1M+ subscribers
            
        # Engagement metrics
        if 'statistics' in item:
            views = int(item['statistics'].get('viewCount', 0))
            likes = int(item['statistics'].get('likeCount', 0))
            
            # Engagement ratio (likes/views)
            if views > 0:
                engagement_ratio = likes / views
                score += min(2.0, engagement_ratio * 100)
                
        return score

    @cached_search
    async def search(self, query: str, page_token: str = None, page_size: int = 20):
        try:
            search_params = {
                "q": query,
                "part": "snippet",
                "maxResults": page_size,
                "type": "video",
                "videoEmbeddable": "true",
                "videoSyndicated": "true",
                "order": "relevance"
            }
            
            if page_token:
                search_params["pageToken"] = page_token

            results = self.service.search().list(**search_params).execute()
            
            search_results = []
            for item in results.get("items", []):
                try:
                    video_id = item.get("id", {}).get("videoId")
                    if not video_id:
                        continue
                        
                    result = SearchResult(
                        id=video_id,
                        title=item["snippet"]["title"],
                        description=item["snippet"]["description"],
                        url=f"https://youtube.com/watch?v={video_id}",
                        thumbnail=item["snippet"]["thumbnails"]["medium"]["url"],
                        type="video",
                        source_name="YouTube",
                        source_icon="https://www.youtube.com/favicon.ico",
                        additional_info={
                            "channel": item["snippet"]["channelTitle"],
                            "published_at": item["snippet"]["publishedAt"]
                        }
                    )
                    search_results.append(result)
                except KeyError:
                    continue

            return search_results, len(search_results), results.get("nextPageToken")
            
        except Exception as e:
            print(f"YouTube Search Error: {e}")
            return [], 0, None 