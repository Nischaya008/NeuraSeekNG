from pydantic import BaseModel
from typing import List, Optional

class SearchResult(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    url: str
    thumbnail: Optional[str] = None
    type: str
    additional_info: Optional[dict] = None
    source_icon: Optional[str] = None
    source_name: Optional[str] = None
    relevance_score: float = 0.0

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total_results: int
    next_page_token: Optional[str] = None
    has_more: bool = False