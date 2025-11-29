from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

# Base directory: .../backend/pricing
BASE_DIR = Path(__file__).resolve().parent

# Store quotes JSON under backend/data/quotes.json
DATA_DIR = BASE_DIR.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

QUOTES_PATH = DATA_DIR / "quotes.json"


def _load_all_quotes() -> List[Dict[str, Any]]:
    """
    Load all quote records from quotes.json.
    If the file does not exist or is invalid, return an empty list.
    """
    if not QUOTES_PATH.exists():
        return []
    try:
        with QUOTES_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        # If somehow got a dict or something else, normalize to empty list
        return []
    except Exception:
        # On any parse error, treat as no quotes rather than crashing.
        return []


def _save_all_quotes(quotes: List[Dict[str, Any]]) -> None:
    """
    Persist all quote records back to quotes.json.
    """
    with QUOTES_PATH.open("w", encoding="utf-8") as f:
        json.dump(quotes, f, indent=2)


def append_quote_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Append a new quote record to quotes.json, assigning:
      - id (auto-increment integer)
      - created_at (ISO 8601 string)
      - num_lines (if lines present)

    Returns the record that was actually written (including id, created_at).
    """
    quotes = _load_all_quotes()

    # Safely compute next integer id (ignore non-int ids)
    max_id = 0
    for q in quotes:
        try:
            qid = int(q.get("id", 0))
            if qid > max_id:
                max_id = qid
        except (ValueError, TypeError):
            continue
    next_id = max_id + 1

    # Enrich record
    record = dict(record)  # shallow copy
    record["id"] = next_id

    # Add timestamp if not present
    if "created_at" not in record:
        record["created_at"] = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    # Add num_lines if we have a list of lines
    lines = record.get("lines")
    if isinstance(lines, list) and "num_lines" not in record:
        record["num_lines"] = len(lines)

    quotes.append(record)
    _save_all_quotes(quotes)
    return record


def load_quote_summaries() -> List[Dict[str, Any]]:
    """
    Return lightweight quote summaries for the UI history panel.
    Each summary will include at least:
      - id
      - customer_id
      - include_freight
      - quote_total
      - num_lines
      - created_at

    Any extra fields in the underlying record are preserved but not required.
    """
    quotes = _load_all_quotes()
    summaries: List[Dict[str, Any]] = []

    for q in quotes:
        summary: Dict[str, Any] = {
            "id": q.get("id"),
            "customer_id": q.get("customer_id"),
            "include_freight": q.get("include_freight"),
            "quote_total": q.get("quote_total"),
            "num_lines": q.get("num_lines"),
            "created_at": q.get("created_at"),
        }
        # Keep any other fields as well (e.g., requested_by)
        for k, v in q.items():
            if k not in summary:
                summary[k] = v
        summaries.append(summary)

    # Sort by id descending (most recent first)
    summaries.sort(
        key=lambda s: (s.get("id") if isinstance(s.get("id"), int) else -1),
        reverse=True,
    )
    return summaries


def load_quote_by_id(quote_id: int) -> Optional[Dict[str, Any]]:
    """
    Load a single full quote record by its integer id.
    Returns None if not found.
    """
    quotes = _load_all_quotes()
    for q in quotes:
        try:
            qid = int(q.get("id", 0))
        except (ValueError, TypeError):
            continue
        if qid == quote_id:
            return q
    return None
