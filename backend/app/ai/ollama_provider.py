import json
import re
import httpx
from typing import Dict, Any
from app.ai.base import AIProvider
from app.ai.prompt_templates import SYSTEM_PROMPT, build_document_context_prompt
from app.config import settings

class OllamaProvider(AIProvider):
    def __init__(self, base_url: str = None, model_name: str = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model_name = model_name or settings.OLLAMA_MODEL

    async def process_user_request(self, user_query: str, doc_context: Dict[str, Any]) -> Dict[str, Any]:
        user_prompt = build_document_context_prompt(user_query, doc_context)

        payload = {
            "model": self.model_name,
            "prompt": f"{SYSTEM_PROMPT}\n\n{user_prompt}",
            "stream": False,
            "format": "json"
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(f"{self.base_url.rstrip('/')}/api/generate", json=payload)
                if res.status_code == 200:
                    response_json = res.json()
                    response_text = response_json.get("response", "").strip()
                    clean_json = re.sub(r"^```json\s*|\s*```$", "", response_text, flags=re.MULTILINE).strip()
                    parsed = json.loads(clean_json)
                    return parsed
                else:
                    return {
                        "summary": f"Ollama request failed with status {res.status_code}: {res.text}",
                        "requires_approval": False,
                        "operations": []
                    }
        except Exception as e:
            # Fall back to Gemini provider heuristic fallback if Ollama is offline
            from app.ai.gemini_provider import GeminiProvider
            return GeminiProvider()._heuristic_fallback(user_query, doc_context, error_msg=f"Ollama offline ({str(e)})")
