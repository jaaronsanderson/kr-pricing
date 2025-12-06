import json
from pathlib import Path

# Root of the project (kr-pricing-python)
ROOT_DIR = Path(__file__).resolve().parent.parent

# Config and data directories
CONFIG_DIR = ROOT_DIR / "config"
DATA_DIR = ROOT_DIR / "data"


def _load_json(path: Path):
    with open(path, "r") as f:
        return json.load(f)


def _save_json(path: Path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def save_customers(customers: dict):
    """Save customers dictionary to customers.json."""
    _save_json(CONFIG_DIR / "customers.json", customers)


def save_items(items: list):
    """Save items list to items.json."""
    _save_json(CONFIG_DIR / "items.json", items)


def load_settings() -> dict:
    """
    Central place to load all JSON-backed settings.

    Returns a dict like:
    {
        "items": [...],
        "customers": {...},
        "base_costs": {...},
        "weight_breaks": [...],
        "column_multipliers": {...},
    }
    """
    return {
        "items": _load_json(CONFIG_DIR / "items.json"),
        "customers": _load_json(CONFIG_DIR / "customers.json"),
        "base_costs": _load_json(DATA_DIR / "base_costs.json"),
        "weight_breaks": _load_json(DATA_DIR / "weight_breaks.json"),
        "column_multipliers": _load_json(DATA_DIR / "column_multipliers.json"),
    }
