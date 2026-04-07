"""
Plagiarism Engine
-----------------
Internal plagiarism detection — checks similarity between students'
submitted files within the same assignment.

Methods used:
  1. difflib.SequenceMatcher  → character-level exact/near-exact match
  2. sentence-transformers     → semantic / paraphrase similarity
  3. Cosine similarity (sklearn) → vector comparison

Supports text extraction from:
  - .txt, .py, .js, .java, .c, .cpp, .html, .css, .md  (plain text)
  - .pdf   (via PyMuPDF / pdfminer fallback)
  - .docx  (via python-docx)
  - .zip   (extracts & concatenates text files inside)
"""

import os
import re
import io
import zipfile
import difflib
import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# ─── Optional heavy imports (graceful degradation) ───────────────────────────
try:
    from sentence_transformers import SentenceTransformer
    _ST_AVAILABLE = True
except ImportError:
    _ST_AVAILABLE = False
    logger.warning("sentence-transformers not available — using difflib only")

try:
    from sklearn.metrics.pairwise import cosine_similarity as _cosine_sim
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    _PYMUPDF_AVAILABLE = True
except ImportError:
    _PYMUPDF_AVAILABLE = False

try:
    from docx import Document as DocxDocument
    _DOCX_AVAILABLE = True
except ImportError:
    _DOCX_AVAILABLE = False


# ─── Singleton model ─────────────────────────────────────────────────────────
_model: Optional["SentenceTransformer"] = None

def _get_model() -> Optional["SentenceTransformer"]:
    global _model
    if not _ST_AVAILABLE:
        return None
    if _model is None:
        try:
            _model = SentenceTransformer(
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
            )
            logger.info("Plagiarism: SentenceTransformer loaded ✓")
        except Exception as e:
            logger.error(f"Plagiarism: Could not load model — {e}")
            return None
    return _model


# ─── Text extraction ──────────────────────────────────────────────────────────
_PLAIN_EXTS = {
    ".txt", ".py", ".js", ".ts", ".jsx", ".tsx", ".java",
    ".c", ".cpp", ".cs", ".h", ".hpp", ".html", ".css",
    ".md", ".json", ".xml", ".yaml", ".yml", ".sql",
}

def extract_text(file_path: str) -> str:
    """
    Extract plain text from a file.
    Returns empty string if extraction fails or format unsupported.
    """
    if not file_path or not os.path.exists(file_path):
        return ""

    ext = os.path.splitext(file_path)[1].lower()

    try:
        # ── Plain text ──────────────────────────────────────────────────────
        if ext in _PLAIN_EXTS:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

        # ── PDF ─────────────────────────────────────────────────────────────
        if ext == ".pdf":
            return _extract_pdf(file_path)

        # ── DOCX ────────────────────────────────────────────────────────────
        if ext in (".docx", ".doc"):
            return _extract_docx(file_path)

        # ── ZIP ─────────────────────────────────────────────────────────────
        if ext in (".zip", ".rar", ".7z"):
            return _extract_zip(file_path)

    except Exception as e:
        logger.warning(f"Text extraction failed for {file_path}: {e}")

    return ""


def _extract_pdf(path: str) -> str:
    if _PYMUPDF_AVAILABLE:
        try:
            doc = fitz.open(path)
            return "\n".join(page.get_text() for page in doc)
        except Exception:
            pass

    # Fallback: pdfminer
    try:
        from pdfminer.high_level import extract_text as pm_extract
        return pm_extract(path) or ""
    except Exception:
        pass

    return ""


def _extract_docx(path: str) -> str:
    if not _DOCX_AVAILABLE:
        return ""
    try:
        doc = DocxDocument(path)
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception:
        return ""


def _extract_zip(path: str) -> str:
    parts = []
    try:
        with zipfile.ZipFile(path, "r") as zf:
            for name in zf.namelist():
                ext = os.path.splitext(name)[1].lower()
                if ext in _PLAIN_EXTS:
                    try:
                        data = zf.read(name)
                        parts.append(data.decode("utf-8", errors="ignore"))
                    except Exception:
                        pass
    except Exception:
        pass
    return "\n".join(parts)


# ─── Text normalisation ───────────────────────────────────────────────────────
def _normalise(text: str) -> str:
    """Lower-case, collapse whitespace, strip comments."""
    text = text.lower()
    # Remove single-line comments (# // --)
    text = re.sub(r"(#|//|--)[^\n]*", " ", text)
    # Remove block comments /* ... */
    text = re.sub(r"/\*.*?\*/", " ", text, flags=re.DOTALL)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ─── Similarity algorithms ────────────────────────────────────────────────────
def _difflib_similarity(a: str, b: str) -> float:
    """
    difflib SequenceMatcher ratio.
    Fast, works on small-medium texts.
    Returns 0.0 – 1.0
    """
    if not a or not b:
        return 0.0
    # Work on normalised, truncated text (first 10k chars for speed)
    na, nb = _normalise(a)[:10_000], _normalise(b)[:10_000]
    return difflib.SequenceMatcher(None, na, nb).ratio()


def _semantic_similarity(a: str, b: str) -> float:
    """
    Sentence-transformers cosine similarity.
    Returns 0.0 – 1.0
    """
    model = _get_model()
    if model is None or not a or not b:
        return 0.0

    # Chunked — first 512 words each (model context limit)
    def first_n_words(text, n=512):
        return " ".join(text.split()[:n])

    try:
        embs = model.encode(
            [first_n_words(a), first_n_words(b)],
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        if _SKLEARN_AVAILABLE:
            score = float(_cosine_sim([embs[0]], [embs[1]])[0][0])
        else:
            score = float(np.dot(embs[0], embs[1]))
        return max(0.0, min(1.0, score))
    except Exception as e:
        logger.warning(f"Semantic similarity error: {e}")
        return 0.0


def compute_similarity(text_a: str, text_b: str) -> dict:
    """
    Compute combined plagiarism score between two texts.
    Returns:
      {
        "difflib_score":  float,   # 0-100
        "semantic_score": float,   # 0-100
        "combined_score": float,   # 0-100  (weighted average)
        "risk_level":     str,     # "low" | "medium" | "high"
      }
    """
    dl  = _difflib_similarity(text_a, text_b)
    sem = _semantic_similarity(text_a, text_b)

    # Weighted: difflib 40%, semantic 60%
    # If semantic unavailable, use difflib 100%
    if sem == 0.0 and not _ST_AVAILABLE:
        combined = dl
    else:
        combined = 0.40 * dl + 0.60 * sem

    combined_pct  = round(combined  * 100, 2)
    difflib_pct   = round(dl  * 100, 2)
    semantic_pct  = round(sem * 100, 2)

    if combined_pct >= 70:
        risk = "high"
    elif combined_pct >= 40:
        risk = "medium"
    else:
        risk = "low"

    return {
        "difflib_score":  difflib_pct,
        "semantic_score": semantic_pct,
        "combined_score": combined_pct,
        "risk_level":     risk,
    }


# ─── Assignment-level plagiarism check ───────────────────────────────────────
def check_assignment_plagiarism(submissions: list) -> dict:
    """
    Check ALL pairs of submissions for an assignment.

    submissions: list of dicts:
      [{ "submission_id": int, "student_id": int, "file_path": str }, ...]

    Returns:
      {
        "pairs": [
          {
            "submission_a": int,
            "submission_b": int,
            "student_a":    int,
            "student_b":    int,
            "combined_score":  float,
            "difflib_score":   float,
            "semantic_score":  float,
            "risk_level":      str,
          }, ...
        ],
        "per_submission": {
          submission_id: {
            "max_similarity": float,
            "risk_level":     str,
            "similar_to":     [submission_id, ...],
          }
        }
      }
    """
    # Extract text for each submission once
    texts = {}
    for sub in submissions:
        sid  = sub["submission_id"]
        path = sub.get("file_path", "")
        texts[sid] = extract_text(path) if path else ""

    pairs = []
    ids = [s["submission_id"] for s in submissions]
    sub_map = {s["submission_id"]: s for s in submissions}

    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            id_a, id_b = ids[i], ids[j]
            text_a = texts.get(id_a, "")
            text_b = texts.get(id_b, "")

            # Skip empty files
            if len(text_a.strip()) < 50 or len(text_b.strip()) < 50:
                continue

            scores = compute_similarity(text_a, text_b)
            pairs.append({
                "submission_a":   id_a,
                "submission_b":   id_b,
                "student_a":      sub_map[id_a]["student_id"],
                "student_b":      sub_map[id_b]["student_id"],
                "combined_score": scores["combined_score"],
                "difflib_score":  scores["difflib_score"],
                "semantic_score": scores["semantic_score"],
                "risk_level":     scores["risk_level"],
            })

    # Per-submission aggregation
    per_submission: dict = {}
    for sid in ids:
        per_submission[sid] = {
            "max_similarity": 0.0,
            "risk_level":     "low",
            "similar_to":     [],
        }

    for pair in pairs:
        for this_id, other_id in [
            (pair["submission_a"], pair["submission_b"]),
            (pair["submission_b"], pair["submission_a"]),
        ]:
            ps = per_submission[this_id]
            if pair["combined_score"] > ps["max_similarity"]:
                ps["max_similarity"] = pair["combined_score"]
                ps["risk_level"]     = pair["risk_level"]
            if pair["combined_score"] >= 30:   # worth noting
                ps["similar_to"].append(other_id)

    return {
        "pairs":           pairs,
        "per_submission":  per_submission,
        "total_pairs_checked": len(pairs),
        "high_risk_pairs":     sum(1 for p in pairs if p["risk_level"] == "high"),
        "medium_risk_pairs":   sum(1 for p in pairs if p["risk_level"] == "medium"),
    }