from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, field_validator, model_validator


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
    material: Optional[str] = None  # "Vinyl", "Styrene", "APET"
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

    @model_validator(mode="after")
    def validate_custom_fields(self):
        """Validate custom sheet dimensions against material-specific rules."""
        if self.type != LineType.CUSTOM:
            return self

        # Import here to avoid circular imports
        from .custom_rules import validate_custom_sheet

        # Ensure required fields are present
        if not self.material:
            raise ValueError("Material is required for custom items")
        if not self.color:
            raise ValueError("Color is required for custom items")
        if not self.surface:
            raise ValueError("Surface is required for custom items")
        if self.gauge is None:
            raise ValueError("Gauge is required for custom items")
        if self.width is None:
            raise ValueError("Width is required for custom items")
        if self.length is None:
            raise ValueError("Length is required for custom items")
        if self.sheets is None:
            raise ValueError("Sheets is required for custom items")

        # Run validation against material-specific rules
        result = validate_custom_sheet(
            material=self.material,
            color=self.color,
            surface=self.surface,
            gauge=self.gauge,
            width=self.width,
            length=self.length,
            sheets=self.sheets,
        )

        if not result.valid:
            raise ValueError("; ".join(result.errors))

        return self


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