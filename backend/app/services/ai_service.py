from typing import Dict, List, Optional
import aiohttp
from ..config import settings
import json

class AIService:
    def __init__(self):
        self.base_url = "https://api-inference.huggingface.co/models"
        self.headers = {
            "Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Models
        self.summarizer_model = "facebook/bart-large-cnn"
        self.sentiment_model = "SamLowe/roberta-base-go_emotions"
        self.overall_sentiment_model = "cardiffnlp/twitter-roberta-base-sentiment"
        
        # Trusted domains for summaries
        self.trusted_domains = [
            'wikipedia.org',
            'imdb.com',
            'britannica.com',
            'nationalgeographic.com',
            'sciencedirect.com',
            'nature.com',
            'gov',
            'edu',
            'who.int',
            'un.org'
        ]

    def is_trusted_source(self, url: str) -> bool:
        return any(domain in url.lower() for domain in self.trusted_domains)

    async def _make_request(self, model: str, payload: Dict) -> Dict:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/{model}",
                    headers=self.headers,
                    json=payload,
                    raise_for_status=True
                ) as response:
                    if response.content_type == 'application/json':
                        return await response.json()
                    text_response = await response.text()
                    return json.loads(text_response)
                    
        except aiohttp.ClientError as e:
            print(f"API request error: {str(e)}")
            return None

    async def generate_intelligent_summary(self, results: List[dict]) -> Optional[str]:
        try:
            # Filter and sort results by source reliability
            trusted_results = []
            other_results = []
            
            for result in results:
                if self.is_trusted_source(result.url):
                    trusted_results.append(result)
                else:
                    other_results.append(result)
            
            # Prioritize trusted sources, but include others if needed
            selected_results = trusted_results[:2]
            if len(selected_results) < 2:
                selected_results.extend(other_results[:2 - len(selected_results)])
            
            if not selected_results:
                return None
            
            # Extract and combine texts
            texts = [
                f"From {result.source_name}: {result.description}"
                for result in selected_results
                if result.description
            ]
            
            if not texts:
                return None
            
            combined_text = " ".join(texts)
            if len(combined_text) > 4096:
                combined_text = combined_text[:4096] + "..."
            
            response = await self._make_request(
                self.summarizer_model,
                {
                    "inputs": combined_text,
                    "parameters": {
                        "max_length": 200,
                        "min_length": 50,
                        "do_sample": False
                    }
                }
            )
            
            if response and isinstance(response, list) and len(response) > 0:
                summary = response[0].get('summary_text', '')
                sources = [result.source_name for result in selected_results]
                return {
                    'summary': summary,
                    'sources': sources
                }
            return None
            
        except Exception as e:
            print(f"Intelligent summary generation error: {str(e)}")
            return None

    async def analyze_sentiment(self, text: str) -> Optional[Dict]:
        try:
            response = await self._make_request(
                self.sentiment_model,
                {"inputs": text}
            )
            
            if isinstance(response, list) and len(response) > 0:
                # Get top 3 emotions
                emotions = sorted(
                    response[0], 
                    key=lambda x: x['score'], 
                    reverse=True
                )[:3]
                
                return {
                    "emotions": [
                        {"emotion": e['label'], "score": e['score']} 
                        for e in emotions
                    ],
                    "dominant_emotion": emotions[0]['label']
                }
            return None
            
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return None

    async def analyze_overall_sentiment(self, text: str) -> Optional[Dict]:
        try:
            response = await self._make_request(
                self.overall_sentiment_model,
                {"inputs": text}
            )
            
            if response and isinstance(response, list) and len(response) > 0:
                # Map sentiment scores
                sentiments = response[0]
                labels = ['Negative', 'Neutral', 'Positive']
                sentiment_scores = {
                    label: score for label, score in zip(labels, sentiments)
                }
                
                # Get dominant sentiment
                dominant = max(sentiment_scores.items(), key=lambda x: x[1])
                
                return {
                    "scores": sentiment_scores,
                    "dominant": dominant[0],
                    "confidence": dominant[1]
                }
            return None
            
        except Exception as e:
            print(f"Overall sentiment analysis error: {str(e)}")
            return None