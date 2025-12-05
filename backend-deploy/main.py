from typing import List, Dict, Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user, CurrentUser
from pricing.models import QuoteRequest, QuoteResponse
from pricing.settings_loader import load_settings
from pricing.core import calculate_quote
from pricing.quote_log import (
    append_quote_record,
    load_quote_summaries,
    load_quote_by_id,
)

app = FastAPI(title="KR Pricing Backend", version="1.0.0")

# CORS so the React app can call us from localhost:5173 or production
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://krpricingweb.z19.web.core.windows.net",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load all JSON-backed settings once on startup
# (items, customers, base_costs, weight_breaks, column_multipliers, etc.)
SETTINGS = load_settings()


@app.get("/")
def root():
    return {"status": "K&R Pricing API running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# -------------------------------------------------------------------
# Data endpoints (protected by Microsoft login)
# -------------------------------------------------------------------


@app.get("/customers")
def list_customers(user: CurrentUser = Depends(get_current_user)):
    """
    Return a simple list of customers:
    [
      { "id": "CNG", "name": "CNG" },
      ...
    ]
    """
    customers = SETTINGS["customers"]
    return [
        {
            "id": cid,
            "name": data.get("name", cid),
        }
        for cid, data in customers.items()
    ]


@app.get("/items")
def list_items(user: CurrentUser = Depends(get_current_user)):
    """
    Return a simple list of items:
    [
      { "sku": "VN10ST20AP15", "description": "..." },
      ...
    ]
    """
    items = SETTINGS["items"]
    return [
        {
            "sku": item.get("sku"),
            "description": item.get("description", ""),
        }
        for item in items
    ]


# -------------------------------------------------------------------
# Quote endpoints (protected)
# -------------------------------------------------------------------


@app.post("/quote", response_model=QuoteResponse)
def create_quote(
    req: QuoteRequest,
    user: CurrentUser = Depends(get_current_user),
):
    """
    Calculate a quote using the core pricing engine and log it.
    Only available to authenticated users.
    """
    try:
        quote = calculate_quote(req, SETTINGS)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to calculate quote: {exc}",
        ) from exc

    # Pydantic v2: use model_dump for clean dict
    record_dict = quote.model_dump()

    # Store who requested the quote (from Microsoft identity) if available
    requested_by = user.preferred_username or user.name
    if requested_by:
        record_dict.setdefault("requested_by", requested_by)

    append_quote_record(record_dict)

    return quote


@app.get("/quotes")
def list_quotes(user: CurrentUser = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """
    Return a summarized list of all quotes for the history panel.
    Shape is whatever pricing.quote_log.load_quote_summaries() returns,
    typically:
      { id, customer_id, include_freight, quote_total, num_lines, created_at, ... }
    """
    return load_quote_summaries()


@app.get("/quotes/{quote_id}")
def get_quote_detail(
    quote_id: int,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return the full stored quote (as logged), by ID.
    """
    rec = load_quote_by_id(quote_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Quote not found")
    return rec
