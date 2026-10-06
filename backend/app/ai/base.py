from abc import ABC, abstractmethod
from typing import Dict, Any

class AIProvider(ABC):
    @abstractmethod
    async def process_user_request(self, user_query: str, doc_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes a user natural language prompt and document context,
        returning a validated JSON object containing summary and list of operations.
        """
        pass
