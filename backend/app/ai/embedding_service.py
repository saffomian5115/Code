"""
Embedding Service
HuggingFace model: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
Urdu, English, aur baaki languages ke liye kaam karta hai
"""
import numpy as np
from sentence_transformers import SentenceTransformer

class EmbeddingService:
    _model = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """Singleton — model ek baar load hota hai"""
        if cls._model is None:
            print("[EmbeddingService] Loading HuggingFace model...")
            cls._model = SentenceTransformer(
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
            )
            print("[EmbeddingService] Model loaded ✓")
        return cls._model

    @classmethod
    def encode(cls, texts: list[str]) -> np.ndarray:
        """
        Text list ko embeddings mein convert karo.
        normalize_embeddings=True → cosine similarity direct dot product se milti hai
        """
        if not texts:
            return np.array([])
        model = cls.get_model()
        return model.encode(texts, normalize_embeddings=True, show_progress_bar=False)

    @classmethod
    def similarity(cls, text1: str, text2: str) -> float:
        """Do texts ke beech similarity score (0.0 to 1.0)"""
        embeddings = cls.encode([text1, text2])
        return float(np.dot(embeddings[0], embeddings[1]))