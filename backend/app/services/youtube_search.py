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
            
        # Get channel details
        try:
            channel_id = item['snippet']['channelId']
            channel_response = self.service.channels().list(
                part="statistics,status,brandingSettings",
                id=channel_id
            ).execute()
            
            if channel_response['items']:
                channel = channel_response['items'][0]
                
                # Channel verification status
                if channel['status'].get('isLinked', False):
                    score += 3.0
                    
                # Subscriber count
                subscriber_count = int(channel['statistics'].get('subscriberCount', 0))
                score += min(4.0, subscriber_count / 1000000)  # Up to 4 points for 1M+ subscribers
                
                # Channel age and consistency
                if 'brandingSettings' in channel:
                    channel_title = channel['brandingSettings'].get('channel', {}).get('title', '').lower()
                    # Check if channel name matches query terms (official channel)
                    if any(term.lower() in channel_title for term in query.split()):
                        score += 5.0
                        
        except Exception as e:
            print(f"Error fetching channel details: {e}")
        
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
                "part": "snippet,statistics",
                "maxResults": min(50, page_size * 2),  # Fetch more results to sort
                "type": "video",
                "videoEmbeddable": "true",
                "videoSyndicated": "true"
            }
            
            if page_token:
                search_params["pageToken"] = page_token

            results = self.service.search().list(**search_params).execute()
            
            # Get detailed video information
            video_ids = [item['id']['videoId'] for item in results.get('items', [])]
            videos_response = self.service.videos().list(
                part="statistics,snippet",
                id=','.join(video_ids)
            ).execute()
            
            # Create a mapping of video details
            video_details = {
                item['id']: item for item in videos_response.get('items', [])
            }
            
            # Calculate scores and sort results
            scored_results = []
            for item in results.get("items", []):
                video_id = item['id']['videoId']
                if video_id in video_details:
                    # Combine search result with video details
                    item.update(video_details[video_id])
                    score = self.calculate_video_score(item, query)
                    scored_results.append((score, item))
            
            # Sort by score and take top results
            scored_results.sort(reverse=True, key=lambda x: x[0])
            top_results = scored_results[:page_size]
            
            search_results = []
            for _, item in top_results:
                try:
                    video_id = item['id']['videoId']
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
                            "published_at": item["snippet"]["publishedAt"],
                            "view_count": item.get("statistics", {}).get("viewCount"),
                            "like_count": item.get("statistics", {}).get("likeCount")
                        }
                    )
                    search_results.append(result)
                except KeyError:
                    continue

            return search_results, len(search_results), results.get("nextPageToken")
            
        except Exception as e:
            print(f"YouTube Search Error: {e}")
            return [], 0, None 
