import asyncpraw
from ..config import settings
from ..models.search import SearchResult
from ..utils.cache import cached_search

class RedditSearchService:
    def __init__(self):
        self.reddit = asyncpraw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT
        )

    async def search(self, query: str, limit: int = 20, page: int = 1):
        try:
            search_results = []
            subreddit = await self.reddit.subreddit("all")
            
            skip_count = (page - 1) * limit
            
            async for submission in subreddit.search(
                query,
                sort="relevance",
                time_filter="all",
                limit=limit + skip_count
            ):
                if len(search_results) >= limit:
                    break
                    
                if skip_count > 0:
                    skip_count -= 1
                    continue
                
                try:
                    # Calculate engagement score
                    engagement_score = submission.score + (submission.num_comments * 2)
                    
                    result = SearchResult(
                        id=submission.id,
                        title=submission.title,
                        description=submission.selftext[:300] if hasattr(submission, 'selftext') else None,
                        url=f"https://reddit.com{submission.permalink}",
                        type="discussion",
                        thumbnail=submission.thumbnail if hasattr(submission, 'thumbnail') and submission.thumbnail.startswith('http') else None,
                        source_name="Reddit",
                        source_icon="https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
                        additional_info={
                            "subreddit": submission.subreddit.display_name,
                            "score": submission.score,
                            "num_comments": submission.num_comments,
                            "engagement_score": engagement_score,
                            "created_utc": submission.created_utc
                        }
                    )
                    search_results.append(result)
                except Exception as submission_error:
                    print(f"Error processing submission: {submission_error}")
                    continue

            return search_results, len(search_results)
            
        except Exception as e:
            print(f"Reddit Search Error: {e}")
            return [], 0 