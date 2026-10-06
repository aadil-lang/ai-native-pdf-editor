from typing import Dict, Any
from app.ai.base import AIProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.ollama_provider import OllamaProvider
from app.config import settings

class AIService:
    @staticmethod
    def get_provider(provider_name: str = None, api_key: str = None, ollama_url: str = None, model_name: str = None) -> AIProvider:
        selected = (provider_name or settings.DEFAULT_AI_PROVIDER).lower()

        if selected == "ollama":
            return OllamaProvider(base_url=ollama_url, model_name=model_name)
        else:
            return GeminiProvider(api_key=api_key, model_name=model_name)

    @classmethod
    async def process_prompt(
        cls,
        user_query: str,
        doc_context: Dict[str, Any],
        provider_name: str = None,
        api_key: str = None,
        ollama_url: str = None,
        model_name: str = None
    ) -> Dict[str, Any]:
        provider = cls.get_provider(provider_name, api_key, ollama_url, model_name)
        return await provider.process_user_request(user_query, doc_context)
