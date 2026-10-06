import json
import re
from typing import Dict, Any
from app.ai.base import AIProvider
from app.ai.prompt_templates import SYSTEM_PROMPT, build_document_context_prompt
from app.config import settings

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str = None, model_name: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL

    async def process_user_request(self, user_query: str, doc_context: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            # Fallback mock/rule-based engine if no API key is provided
            return self._heuristic_fallback(user_query, doc_context)

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)
            user_prompt = build_document_context_prompt(user_query, doc_context)

            response = client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )

            text_response = response.text.strip()
            # Clean markdown codeblocks if any
            clean_json = re.sub(r"^```json\s*|\s*```$", "", text_response, flags=re.MULTILINE).strip()
            parsed = json.loads(clean_json)
            return parsed

        except Exception as e:
            # If API fails or key is invalid, use deterministic intelligent fallback
            return self._heuristic_fallback(user_query, doc_context, error_msg=str(e))

    def _heuristic_fallback(self, user_query: str, doc_context: Dict[str, Any], error_msg: str = "") -> Dict[str, Any]:
        """
        Deterministic rule-based NLP parser to handle standard commands even without API key or offline.
        Handles:
        - "Change X to Y" / "Replace X with Y" / "Find X and replace it with Y"
        - "Remove page X" / "Delete page X"
        - "Rotate page X" / "Rotate page X by 90"
        - "Summarize"
        """
        query_lower = user_query.lower()
        ops = []
        summary = ""

        # Pattern: Replace/Change X to/with Y
        replace_match = re.search(r'(?:change|replace|find)\s+["\']?([^"\'\s]+)["\']?\s+(?:to|with|and replace it with)\s+["\']?([^"\'\s]+)["\']?', user_query, re.IGNORECASE)
        if replace_match:
            target = replace_match.group(1)
            replacement = replace_match.group(2)

            # Search across pages in doc_context
            for page in doc_context.get("pages", []):
                p_num = page["page_number"]
                for span in page.get("spans", []):
                    if target.lower() in span["text"].lower():
                        ops.append({
                            "operation_type": "replace_text",
                            "page_number": p_num,
                            "target_text": target,
                            "replacement_text": replacement,
                            "bbox": span["bbox"]
                        })

            if ops:
                summary = f"Found {len(ops)} occurrence(s) of '{target}' and generated replacement operation(s) to '{replacement}'."
            else:
                summary = f"Searched document for '{target}' but no exact matches were found."

            return {
                "summary": summary + (f" (Note: {error_msg})" if error_msg else ""),
                "requires_approval": True,
                "operations": ops
            }

        # Pattern: Remove / Delete page N
        delete_page_match = re.search(r'(?:remove|delete)\s+page\s+(\d+)', query_lower)
        if delete_page_match:
            p_num = int(delete_page_match.group(1))
            ops.append({
                "operation_type": "delete_page",
                "page_number": p_num
            })
            return {
                "summary": f"Generated operation to delete page {p_num}.",
                "requires_approval": True,
                "operations": ops
            }

        # Pattern: Rotate page N
        rotate_match = re.search(r'rotate\s+page\s+(\d+)', query_lower)
        if rotate_match:
            p_num = int(rotate_match.group(1))
            ops.append({
                "operation_type": "rotate_page",
                "page_number": p_num,
                "angle": 90
            })
            return {
                "summary": f"Generated operation to rotate page {p_num} by 90 degrees.",
                "requires_approval": True,
                "operations": ops
            }

        # Pattern: Summarize
        if "summarize" in query_lower:
            text_chunks = []
            for p in doc_context.get("pages", []):
                p_text = " ".join([s["text"] for s in p.get("spans", [])])
                text_chunks.append(f"Page {p['page_number']}: {p_text[:200]}...")
            summary = f"Document Summary:\nThis document has {doc_context.get('page_count', 0)} page(s).\n" + "\n".join(text_chunks)
            return {
                "summary": summary,
                "requires_approval": False,
                "operations": []
            }

        return {
            "summary": f"Analyzed prompt '{user_query}'. " + (f"(Gemini API message: {error_msg})" if error_msg else "Please set GEMINI_API_KEY in environment or configure Ollama for full LLM intelligence."),
            "requires_approval": False,
            "operations": []
        }
