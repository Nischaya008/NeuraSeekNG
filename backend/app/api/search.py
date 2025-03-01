from fastapi import APIRouter, Query
from typing import Optional
from ..services.google_search import GoogleSearchService
from ..services.youtube_search import YouTubeSearchService
from ..services.reddit_search import RedditSearchService
from ..services.scholar_search import ScholarSearchService
from ..models.search import SearchResponse
from ..services.autocomplete_service import AutocompleteService
from ..services.ai_service import AIService

router = APIRouter()

google_service = GoogleSearchService()
youtube_service = YouTubeSearchService()
reddit_service = RedditSearchService()
scholar_service = ScholarSearchService()
autocomplete_service = AutocompleteService()

# Initialize AI service
ai_service = AIService()

@router.get("/search", response_model=SearchResponse)
async def search(
    q: str,
    type: str = "all",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    page_token: Optional[str] = None
):
    try:
        if type == "all":
            results, total = await google_service.search(q, page=page, page_size=page_size)
            results = [r for r in results if r.type == "web"]
            has_more = len(results) == page_size
        elif type == "images":
            results, total = await google_service.search(
                q, search_type="images", page=page, page_size=page_size
            )
            has_more = len(results) == page_size
        elif type == "videos":
            results, total, next_token = await youtube_service.search(
                q, page_token=page_token, page_size=page_size
            )
            has_more = bool(next_token)
        elif type == "discussions":
            results, total = await reddit_service.search(q, limit=page_size, page=page)
            has_more = len(results) == page_size
        elif type == "papers":
            results, total = await scholar_service.search(q, limit=page_size, page=page)
            has_more = len(results) == page_size
        else:
            results, total = [], 0
            has_more = False

        if results:
            # Generate intelligent summary for web results, papers, and discussions
            if type in ["all", "papers", "discussions"]:
                summary_data = await ai_service.generate_intelligent_summary(results)
                if summary_data:
                    results[0].additional_info = results[0].additional_info or {}
                    results[0].additional_info["ai_summary"] = summary_data['summary']
                    results[0].additional_info["summary_sources"] = summary_data['sources']

            # Enhanced sentiment analysis for discussions and papers
            if type in ["discussions", "papers"]:
                for result in results:
                    if result.description:
                        # Get both detailed and overall sentiment
                        sentiment = await ai_service.analyze_sentiment(result.description)
                        overall_sentiment = await ai_service.analyze_overall_sentiment(result.description)
                        
                        if sentiment or overall_sentiment:
                            result.additional_info = result.additional_info or {}
                            if sentiment:
                                result.additional_info["sentiment"] = sentiment
                            if overall_sentiment:
                                result.additional_info["overall_sentiment"] = overall_sentiment

        return SearchResponse(
            results=results,
            total_results=total,
            next_page_token=next_token if type == "videos" else None,
            has_more=has_more
        )
    except Exception as e:
        print(f"Search Error: {e}")
        return SearchResponse(results=[], total_results=0, has_more=False)

@router.get("/suggestions")
async def get_suggestions(q: str):
    return await autocomplete_service.get_suggestions(q)
