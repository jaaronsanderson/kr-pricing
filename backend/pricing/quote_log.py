import json
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional

# Root of the project (kr-pricing-python)
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

QUOTES_FILE = DATA_DIR / "quotes.json"


def _load_quotes() -> List[Dict[str, Any]]:
    if not QUOTES_FILE.exists():
        return []
    try:
        with QUOTES_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        return []
    except Exception:
        # On any read/parse error, treat as empty
        return []


def _save_quotes(quotes: List[Dict[str, Any]]) -> None:
    with QUOTES_FILE.open("w", encoding="utf-8") as f:
        json.dump(quotes, f, indent=2)


def append_quote_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Append a quote record to quotes.json, assign an ID and timestamp.
    Returns the stored record (with id + created_at).
    """
    quotes = _load_quotes()

    # Simple incremental ID (does not reset between runs)
    next_id = (max((q.get("id", 0) for q in quotes), default=0) or 0) + 1

    stored = dict(record)
    stored.setdefault("id", next_id)
    stored.setdefault("created_at", datetime.utcnow().isoformat(timespec="seconds") + "Z")

    quotes.append(stored)
    _save_quotes(quotes)
    return stored


def list_quote_records() -> List[Dict[str, Any]]:
    """
    Return all stored quote records.
    """
    return _load_quotes()


def get_quote_record(quote_id: int) -> Optional[Dict[str, Any]]:
    """
    Return a single quote record by id, or None if not found.
    """
    for q in _load_quotes():
        if int(q.get("id", 0)) == int(quote_id):
            return q
    return None
