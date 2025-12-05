from enum import Enum
from typing import Optional, List
from pydantic import BaseModel


class LineType(str, Enum):
    STOCK = "stock"
    CUSTOM = "custom"
    AD_HOC = "ad_hoc"


class LineItemRequest(BaseModel):
    type: LineType

    # Common
    quantity: float

    # STOCK
    sku: Optional[str] = None  # required if type == STOCK

    # CUSTOM
    material: Optional[str] = None  # "Vinyl", "Styrene", etc.
    color: Optional[str] = None
    surface: Optional[str] = None
    gauge: Optional[float] = None
    width: Optional[float] = None
    length: Optional[float] = None
    sheets: Optional[float] = None  # number of sheets

    # AD_HOC
    description: Optional[str] = None
    weight_per_unit: Optional[float] = None  # lbs per unit
    landed_cost_per_unit: Optional[float] = None  # already includes freight etc.


class QuoteRequest(BaseModel):
    customer_id: str
    include_freight: bool = True
    lines: List[LineItemRequest]


class LinePriceResult(BaseModel):
    type: LineType
    sku: Optional[str] = None
    description: Optional[str] = None
    quantity: float
    weight_per_unit: float
    base_cost_per_unit: float
    sell_price_per_unit: float
    extended_sell_price: float
    total_column: int


class QuoteResponse(BaseModel):
    customer_id: str
    include_freight: bool
    lines: List[LinePriceResult]
    quote_total: float