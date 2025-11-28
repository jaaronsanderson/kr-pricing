from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pricing.models import QuoteRequest, QuoteResponse
from pricing.settings_loader import load_settings
from pricing.core import calculate_quote
from pricing.quote_log import (
    append_quote_record,
    list_quote_records,
    get_quote_record,
)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SETTINGS = load_settings()


@app.get("/")
def root():
    return {"status": "K&R Pricing API running"}


@app.get("/customers")
def list_customers():
    customers = SETTINGS["customers"]
    return [
        {
            "id": cid,
            "name": data.get("name", cid),
        }
        for cid, data in customers.items()
    ]


@app.get("/items")
def list_items():
    items = SETTINGS["items"]
    return [
        {
            "sku": item.get("sku"),
            "description": item.get("description", ""),
        }
        for item in items
    ]


@app.post("/quote", response_model=QuoteResponse)
def create_quote(req: QuoteRequest):
    quote = calculate_quote(req, SETTINGS)

    # Pydantic v2: use model_dump instead of dict (avoids deprecation warnings)
    record_dict = quote.model_dump()
    append_quote_record(record_dict)

    return quote


@app.get("/quotes")
def list_quotes():
    """
    Return a summarized list of all quotes that have been logged.
    """
    records = list_quote_records()
    summaries = []
    for rec in records:
        lines = rec.get("lines") or []
        summaries.append(
            {
                "id": rec.get("id"),
                "customer_id": rec.get("customer_id"),
                "include_freight": rec.get("include_freight"),
                "quote_total": rec.get("quote_total"),
                "created_at": rec.get("created_at"),
                "num_lines": len(lines),
            }
        )
    return summaries


@app.get("/quotes/{quote_id}")
def get_quote(quote_id: int):
    """
    Return the full stored quote (as logged), by ID.
    """
    rec = get_quote_record(quote_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Quote not found")
    return rec
