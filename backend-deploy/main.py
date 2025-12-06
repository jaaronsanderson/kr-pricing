from typing import List, Dict, Any, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user, CurrentUser
from pydantic import BaseModel
from pricing.models import QuoteRequest, QuoteResponse
from pricing.settings_loader import load_settings, save_customers, save_items
from pricing.core import calculate_quote
from pricing.quote_log import (
    append_quote_record,
    load_quote_summaries,
    load_quote_by_id,
)
from pricing.custom_rules import (
    get_custom_materials,
    get_custom_colors,
    get_custom_surfaces,
    get_material_constraints,
    calculate_sheet_weight,
    calculate_minimum_sheets,
    MATERIAL_SPECS,
)

app = FastAPI(title="KR Pricing Backend", version="1.0.0")


# -------------------------------------------------------------------
# Request models for PATCH endpoints
# -------------------------------------------------------------------


class CustomerUpdate(BaseModel):
    column_break: Optional[str] = None
    freight_column_offset: Optional[int] = None


class ItemUpdate(BaseModel):
    description: Optional[str] = None

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
      { "id": "CNG", "name": "CNG", "column_break": "VN6ST0PC1AP0PE0SA0", "freight_column_offset": -8 },
      ...
    ]
    """
    customers = SETTINGS["customers"]
    return [
        {
            "id": cid,
            "name": data.get("name", cid),
            "column_break": data.get("column_break", ""),
            "freight_column_offset": data.get("freight_column_offset", 0),
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


@app.patch("/customers/{customer_id}")
def update_customer(
    customer_id: str,
    updates: CustomerUpdate,
    user: CurrentUser = Depends(get_current_user),
):
    """
    Update a customer's column_break and/or freight_column_offset.
    Persists changes to customers.json.
    """
    customers = SETTINGS["customers"]
    if customer_id not in customers:
        raise HTTPException(status_code=404, detail=f"Customer not found: {customer_id}")

    # Apply updates
    if updates.column_break is not None:
        customers[customer_id]["column_break"] = updates.column_break
    if updates.freight_column_offset is not None:
        customers[customer_id]["freight_column_offset"] = updates.freight_column_offset

    # Save to disk
    save_customers(customers)

    return {
        "id": customer_id,
        "name": customers[customer_id].get("name", customer_id),
        "column_break": customers[customer_id].get("column_break", ""),
        "freight_column_offset": customers[customer_id].get("freight_column_offset", 0),
    }


@app.patch("/items/{sku}")
def update_item(
    sku: str,
    updates: ItemUpdate,
    user: CurrentUser = Depends(get_current_user),
):
    """
    Update an item's description.
    Persists changes to items.json.
    """
    items = SETTINGS["items"]
    item = next((i for i in items if i.get("sku") == sku), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"Item not found: {sku}")

    # Apply updates
    if updates.description is not None:
        item["description"] = updates.description

    # Save to disk
    save_items(items)

    return {
        "sku": sku,
        "description": item.get("description", ""),
    }


# -------------------------------------------------------------------
# Custom sheet options endpoints (protected)
# -------------------------------------------------------------------


@app.get("/custom/materials")
def list_custom_materials(user: CurrentUser = Depends(get_current_user)):
    """
    Return the list of materials available for custom sheets.
    """
    return get_custom_materials()


@app.get("/custom/colors")
def list_custom_colors(
    material: str = Query(..., description="Material name (Vinyl, Styrene, APET)"),
    user: CurrentUser = Depends(get_current_user),
):
    """
    Return the list of valid colors for a given material.
    """
    colors = get_custom_colors(material)
    if not colors:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown material: {material}. Valid materials: {', '.join(get_custom_materials())}",
        )
    return colors


@app.get("/custom/surfaces")
def list_custom_surfaces(
    material: str = Query(..., description="Material name (Vinyl, Styrene, APET)"),
    user: CurrentUser = Depends(get_current_user),
):
    """
    Return the list of valid surfaces for a given material.
    """
    surfaces = get_custom_surfaces(material)
    if not surfaces:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown material: {material}. Valid materials: {', '.join(get_custom_materials())}",
        )
    return surfaces


@app.get("/custom/constraints")
def get_custom_constraints(
    material: str = Query(..., description="Material name (Vinyl, Styrene, APET)"),
    user: CurrentUser = Depends(get_current_user),
):
    """
    Return the dimension constraints (gauge, width, length) for a given material.
    """
    constraints = get_material_constraints(material)
    if not constraints:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown material: {material}. Valid materials: {', '.join(get_custom_materials())}",
        )
    return constraints


@app.get("/custom/all-options")
def get_all_custom_options(user: CurrentUser = Depends(get_current_user)):
    """
    Return all custom sheet options in a single response.
    Useful for populating form dropdowns.
    """
    materials = get_custom_materials()
    result = {}

    for material in materials:
        mat_key = material.lower()
        spec = MATERIAL_SPECS.get(mat_key)
        result[material] = {
            "colors": get_custom_colors(material),
            "surfaces": get_custom_surfaces(material),
            "constraints": {
                "gauge": {"min": spec.min_gauge, "max": spec.max_gauge} if spec else None,
                "width": {"min": spec.min_width, "max": spec.max_width} if spec else None,
                "length": {"min": spec.min_length, "max": spec.max_length} if spec else None,
            },
            "weight_factor": spec.weight_factor if spec else None,
        }

    return {
        "materials": materials,
        "options": result,
    }


@app.get("/custom/calculate-weight")
def calculate_custom_weight(
    material: str = Query(..., description="Material name"),
    gauge: float = Query(..., description="Gauge (thickness)"),
    width: float = Query(..., description="Width in inches"),
    length: float = Query(..., description="Length in inches"),
    user: CurrentUser = Depends(get_current_user),
):
    """
    Calculate the weight of a single custom sheet.
    """
    weight = calculate_sheet_weight(material, gauge, width, length)
    return {
        "weight_per_sheet": round(weight, 4),
        "unit": "lbs",
    }


@app.get("/custom/minimum-sheets")
def get_minimum_sheets(
    material: str = Query(..., description="Material name"),
    gauge: float = Query(..., description="Gauge (thickness)"),
    width: float = Query(..., description="Width in inches"),
    length: float = Query(..., description="Length in inches"),
    user: CurrentUser = Depends(get_current_user),
):
    """
    Calculate the minimum number of sheets required to meet the 2000 lb minimum.
    """
    weight_per_sheet = calculate_sheet_weight(material, gauge, width, length)
    min_sheets = calculate_minimum_sheets(material, gauge, width, length)
    total_weight = weight_per_sheet * min_sheets

    return {
        "weight_per_sheet": round(weight_per_sheet, 4),
        "minimum_sheets": min_sheets,
        "total_weight": round(total_weight, 2),
        "minimum_weight_required": 2000,
    }


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
