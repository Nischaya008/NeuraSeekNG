from ..utils.cache import cached_search
from scholarly import scholarly
from ..models.search import SearchResult

class ScholarSearchService:
    @cached_search
    async def search(self, query: str, limit: int = 20, page: int = 1):
        try:
            search_query = scholarly.search_pubs(query)
            search_results = []
            
            # Skip results for previous pages
            skip_count = (page - 1) * limit
            for _ in range(skip_count):
                try:
                    next(search_query)
                except StopIteration:
                    break
            
            # Get results for current page
            count = 0
            for paper in search_query:
                if count >= limit:
                    break
                    
                try:
                    year = paper.get('bib', {}).get('pub_year')
                    citations = paper.get('num_citations', 0)
                except AttributeError:
                    year = None
                    citations = 0

                result = SearchResult(
                    id=paper.get('pub_url', '') or str(count),
                    title=paper.get('bib', {}).get('title', ''),
                    description=paper.get('bib', {}).get('abstract', ''),
                    url=paper.get('pub_url', ''),
                    type="paper",
                    source_name="Google Scholar",
                    additional_info={
                        "year": year,
                        "citations": citations,
                        "authors": paper.get('bib', {}).get('author', []),
                        "venue": paper.get('bib', {}).get('venue', '')
                    }
                )
                search_results.append(result)
                count += 1

            return search_results, len(search_results)
            
        except Exception as e:
            print(f"Scholar Search Error: {e}")
            return [], 0
