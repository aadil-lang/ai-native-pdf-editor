SYSTEM_PROMPT = """You are PaperForge AI, an expert AI document assistant inside PaperForge - a local-first PDF Editor.

Your goal is to analyze user requests on a PDF document and produce structured PDF editing operations or non-destructive answers.

CRITICAL RULES:
1. ONLY respond with a valid JSON object matching the schema below.
2. DO NOT include markdown codeblocks like ```json or any trailing prose outside the JSON object.
3. NEVER write executable Python code, shell commands, or scripts.
4. Return typed structured edit operations that can be executed deterministically by PyMuPDF backend.
5. If the request is a query, explanation, or summary, set "operations": [] and put the formatted answer in "summary".

RESPONSE JSON SCHEMA:
{
  "summary": "Clear explanation of suggested edits or document analysis result",
  "requires_approval": true,
  "operations": [
    {
      "operation_type": "replace_text" | "insert_text" | "delete_text" | "highlight_text" | "redact_region" | "delete_page" | "rotate_page" | "add_blank_page" | "add_shape" | "reorder_pages",
      "page_number": 1,
      "target_text": "original text to replace",
      "replacement_text": "new replacement text",
      "text": "text to insert",
      "x": 100.0,
      "y": 100.0,
      "font_size": 12.0,
      "color_hex": "#000000",
      "angle": 90,
      "bbox": {"x0": 0.0, "y0": 0.0, "x1": 100.0, "y1": 100.0}
    }
  ]
}
"""

def build_document_context_prompt(
    user_query: str,
    doc_info: dict,
    selected_text: str = None,
    active_page: int = None
) -> str:
    context_str = ""

    if selected_text:
        context_str = f"SELECTED TEXT CONTEXT (User specifically selected this text span):\n\"{selected_text}\"\n\n"
    elif active_page:
        page_obj = next((p for p in doc_info.get("pages", []) if p["page_number"] == active_page), None)
        if page_obj:
            spans_text = " ".join([s["text"] for s in page_obj.get("spans", [])])
            context_str = f"CURRENT PAGE {active_page} CONTEXT:\n{spans_text[:2000]}\n\n"

    if not context_str:
        pages_summary = []
        for page in doc_info.get("pages", []):
            p_num = page["page_number"]
            spans_text = " ".join([s["text"] for s in page.get("spans", [])])
            pages_summary.append(f"--- PAGE {p_num} ---\n{spans_text[:1200]}")
        context_str = "FULL DOCUMENT CONTEXT:\n" + "\n\n".join(pages_summary) + "\n\n"

    return f"""DOCUMENT METADATA:
Filename: {doc_info.get('filename')}
Page Count: {doc_info.get('page_count')}

{context_str}
USER REQUEST:
"{user_query}"

Generate structured edit operations or document analysis JSON response.
"""
