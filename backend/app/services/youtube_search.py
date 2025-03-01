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
        query_terms = set(term.lower() for term in query.split())
        
        try:
            # Title relevance (0-8 points)
            title = item['snippet']['title'].lower()
            title_matches = sum(1 for term in query_terms if term in title)
            score += min(8.0, title_matches * 2.0)
            
            # Get channel details
            channel_id = item['snippet']['channelId']
            channel_response = self.service.channels().list(
                part="statistics,status,brandingSettings,contentOwnerDetails",
                id=channel_id
            ).execute()
            
            if channel_response['items']:
                channel = channel_response['items'][0]
                
                # Official channel verification (10 points)
                if channel['status'].get('isLinked', False):
                    score += 10.0
                    
                # Channel authority based on subscribers (0-15 points)
                subscriber_count = int(channel['statistics'].get('subscriberCount', 0))
                if subscriber_count > 10000000:  # 10M+
                    score += 15.0
                elif subscriber_count > 1000000:  # 1M+
                    score += 12.0
                elif subscriber_count > 100000:  # 100K+
                    score += 8.0
                elif subscriber_count > 10000:  # 10K+
                    score += 4.0
                
                # Official/Verified brand match (0-20 points)
                if 'brandingSettings' in channel:
                    channel_title = channel['brandingSettings'].get('channel', {}).get('title', '').lower()
                    channel_keywords = channel['brandingSettings'].get('channel', {}).get('keywords', '').lower()
                    
                    # Check for exact brand match
                    brand_terms = {'official', 'verified', channel_title}
                    brand_matches = sum(1 for term in query_terms if any(term in brand for brand in brand_terms))
                    score += min(20.0, brand_matches * 10.0)
                    
                    # Check for content ownership verification
                    if 'contentOwnerDetails' in channel:
                        score += 5.0
                
            # Engagement metrics (0-12 points)
            if 'statistics' in item:
                views = int(item['statistics'].get('viewCount', 0))
                likes = int(item['statistics'].get('likeCount', 0))
                comments = int(item['statistics'].get('commentCount', 0))
                
                # View count score (0-6 points)
                if views > 10000000:  # 10M+ views
                    score += 6.0
                elif views > 1000000:  # 1M+ views
                    score += 4.0
                elif views > 100000:  # 100K+ views
                    score += 2.0
                
                # Engagement ratio (likes + comments / views) (0-6 points)
                if views > 0:
                    engagement_ratio = (likes + comments) / views
                    score += min(6.0, engagement_ratio * 1000)
            
            # Video age bonus (0-5 points)
            # Favor established videos that have stood the test of time
            published_at = item['snippet'].get('publishedAt', '')
            if published_at:
                from datetime import datetime, timezone
                published_date = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%SZ')
                age_days = (datetime.now(timezone.utc) - published_date).days
                
                if age_days > 365:  # Older than 1 year
                    score += 5.0
                elif age_days > 180:  # Older than 6 months
                    score += 4.0
                elif age_days > 90:  # Older than 3 months
                    score += 3.0
                elif age_days > 30:  # Older than 1 month
                    score += 2.0
                elif age_days > 7:  # Older than 1 week
                    score += 1.0
                # Videos less than a week old get no age bonus
                
        except Exception as e:
            print(f"Error calculating video score: {e}")
        
        return score

    @cached_search
    async def search(self, query: str, page_token: str = None, page_size: int = 20):
        try:
            search_params = {
                "q": query,
                "part": "snippet",  # Remove statistics from initial search
                "maxResults": min(50, page_size * 2),
                "type": "video",
                "videoEmbeddable": "true",
                "videoSyndicated": "true"
            }
            
            if page_token:
                search_params["pageToken"] = page_token

            results = self.service.search().list(**search_params).execute()
            
            # Get detailed video information
            video_ids = [item['id']['videoId'] for item in results.get('items', [])]
            
            # Separate request for video statistics
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
                    full_details = video_details[video_id]
                    score = self.calculate_video_score(full_details, query)
                    scored_results.append((score, item, full_details))
            
            # Sort by score and take top results
            scored_results.sort(reverse=True, key=lambda x: x[0])
            top_results = scored_results[:page_size]
            
            search_results = []
            for _, item, details in top_results:
                try:
                    video_id = item['id']['videoId']
                    result = SearchResult(
                        id=video_id,
                        title=item["snippet"]["title"],
                        description=item["snippet"]["description"],
                        url=f"https://youtube.com/watch?v={video_id}",
                        thumbnail=item["snippet"]["thumbnails"]["high"]["url"],
                        type="video",
                        source_name=item["snippet"]["channelTitle"],
                        source_icon="https://www.youtube.com/favicon.ico",
                        additional_info={
                            "channel": item["snippet"]["channelTitle"],
                            "published_at": item["snippet"]["publishedAt"],
                            "view_count": details["statistics"].get("viewCount"),
                            "like_count": details["statistics"].get("likeCount")
                        }
                    )
                    search_results.append(result)
                except KeyError:
                    continue

            return search_results, len(search_results), results.get("nextPageToken")
            
        except Exception as e:
            print(f"YouTube Search Error: {e}")
            return [], 0, None 
