from typing import Dict, Any, Tuple, List
from math import ceil

from .models import (
    LineItemRequest,
    LineType,
    QuoteRequest,
    QuoteResponse,
    LinePriceResult,
)


# ---------------------------------------------------------------------------
# Column break parsing (material-specific column from "VN10ST20AP15"-style string)
# ---------------------------------------------------------------------------

def extract_column_from_breaks(material_code: str, column_break: str) -> int:
    """
    Python version of CustomBreakSplicerM / StockBreakSplicerM.
    Expects material_code like "VN", "ST", "AP".
    Returns an int column number or 0 if not found/parseable.
    """
    if not material_code or not column_break:
        return 0

    idx = column_break.rfind(material_code)
    if idx == -1:
        return 0

    one_digit = column_break[idx + 2 : idx + 3]
    two_digit = column_break[idx + 2 : idx + 4] if len(column_break) > idx + 3 else one_digit

    for candidate in (two_digit, one_digit):
        try:
            return int(candidate)
        except ValueError:
            continue

    return 0


# ---------------------------------------------------------------------------
# JSON-driven weight column + multiplier table
# ---------------------------------------------------------------------------

def compute_weight_column(quantity_weight: float, weight_breaks: List[Dict[str, Any]]) -> int:
    """
    Uses data/weight_breaks.json.
    Expects a list of {"min_weight": number, "weight_column": int}.
    Higher thresholds should come first, but we sort defensively.
    """
    if not weight_breaks:
        return 0

    # Ensure descending by min_weight just in case
    sorted_breaks = sorted(weight_breaks, key=lambda x: x["min_weight"], reverse=True)

    for row in sorted_breaks:
        if quantity_weight > float(row["min_weight"]):
            return int(row["weight_column"])

    return 0  # below smallest threshold


def lookup_multiplier(total_column: int, column_multipliers_cfg: Dict[str, Any]) -> float:
    """
    Uses data/column_multipliers.json.
    {
      "default_above_max": 1.10,
      "multipliers": {
        "0": 4.35,
        "1": 4.20,
        ...
      }
    }
    """
    mapping: Dict[str, Any] = column_multipliers_cfg.get("multipliers", {})
    default_above_max = float(column_multipliers_cfg.get("default_above_max", 1.10))

    if not mapping:
        return default_above_max

    str_key = str(total_column)

    # Exact match
    if str_key in mapping:
        return float(mapping[str_key])

    # Determine min/max keys
    keys_int = [int(k) for k in mapping.keys()]
    min_key = min(keys_int)
    max_key = max(keys_int)

    # Below min: treat as min column (similar to <=0 case in original C#)
    if total_column < min_key:
        return float(mapping[str(min_key)])

    # Above max: use default
    if total_column > max_key:
        return default_above_max

    # Fallback (should basically never hit)
    return default_above_max


def apply_order_minimums(price_per_unit: float, quantity: float, item_width: float) -> float:
    """
    Applies:
      - $150 global minimum (MINIMUM_ORDER_VALUE)
      - $550 minimum if width > 47" (WIDE_SHEET_MINIMUM_VALUE if > WIDE_SHEET_THRESHOLD)
    Returns adjusted price_per_unit.
    """
    from .custom_rules import (
        MINIMUM_ORDER_VALUE,
        WIDE_SHEET_THRESHOLD,
        WIDE_SHEET_MINIMUM_VALUE,
    )

    if quantity <= 0:
        return price_per_unit

    extended = price_per_unit * quantity

    # Global minimum order value
    if extended < MINIMUM_ORDER_VALUE:
        price_per_unit = MINIMUM_ORDER_VALUE / quantity
        extended = price_per_unit * quantity

    # Wide-sheet minimum
    if item_width > WIDE_SHEET_THRESHOLD and extended < WIDE_SHEET_MINIMUM_VALUE:
        price_per_unit = WIDE_SHEET_MINIMUM_VALUE / quantity

    return price_per_unit


# ---------------------------------------------------------------------------
# Base cost from base_costs.json (shared by stock & custom)
# ---------------------------------------------------------------------------

def build_base_cost_per_unit(
    material: str,
    color: str,
    surface: str,
    weight_per_unit: float,
    base_costs: Dict[str, Any],
) -> float:
    """
    Uses data/base_costs.json to compute base cost per unit:
      base_per_lb (+ upcharges/discounts) * weight_per_unit
    """
    mat_key = (material or "").lower()
    color = (color or "").lower()
    surface = (surface or "").lower()

    mat_settings = base_costs.get(mat_key)
    if not mat_settings:
        # Fallback: just treat weight as cost (i.e., $1/lb) if not configured
        return weight_per_unit

    base_per_lb = float(mat_settings.get("base_per_lb", 1.0))

    if mat_key == "vinyl":
        # color upcharges
        if color not in ("white", "clear"):
            base_per_lb += float(mat_settings.get("color_up", 0.0))
        if color == "clear":
            base_per_lb += float(mat_settings.get("clear_up", 0.0))
        # surface upcharges
        if surface == "gloss/gloss":
            base_per_lb += float(mat_settings.get("gloss_up", 0.0))
        if surface in ("velvet/gloss", "velvet one side"):
            base_per_lb += float(mat_settings.get("velvet_up", 0.0))

    elif mat_key == "styrene":
        if color == "dead white":
            base_per_lb += float(mat_settings.get("dead_white_up", 0.0))
        if color == "translucent white":
            base_per_lb += float(mat_settings.get("translucent_white_up", 0.0))
        if surface == "gloss/matte":
            base_per_lb += float(mat_settings.get("gloss_up", 0.0))

    # APET, polycarbonate, polyethylene currently just use base_per_lb

    return base_per_lb * weight_per_unit


# ---------------------------------------------------------------------------
# Unified core engine
# ---------------------------------------------------------------------------

def core_engine(
    base_cost_per_unit: float,
    weight_per_unit: float,
    quantity: float,
    base_column: int,
    material_code: str,
    include_freight: bool,
    freight_column_offset: int,
    weight_breaks: List[Dict[str, Any]],
    column_multipliers_cfg: Dict[str, Any],
) -> Tuple[float, int]:
    """
    Returns (sell_price_per_unit BEFORE minimums, total_column).
    base_column: from column breaks (customer/material).
    freight_column_offset: added only if include_freight is True.
    """
    column = base_column
    mat_short = (material_code or "").upper()

    # Material-specific column tweaks
    if mat_short == "PC":  # Polycarbonate
        column += 8
    elif mat_short == "PE":  # Polyethylene
        column += -2
    elif mat_short == "AP":  # APET
        column += -4
    elif mat_short == "ST":  # Styrene
        column += 16
        if quantity * weight_per_unit > 999:
            column += 16

    # Freight adjustment
    if include_freight:
        column += int(freight_column_offset)

    # Weight-based column
    quantity_weight = quantity * weight_per_unit
    weight_col = compute_weight_column(quantity_weight, weight_breaks)
    total_column = column + weight_col

    # Column multiplier
    multiplier = lookup_multiplier(total_column, column_multipliers_cfg)

    price_per_unit = base_cost_per_unit * multiplier
    return price_per_unit, total_column


# ---------------------------------------------------------------------------
# Line-level helpers
# ---------------------------------------------------------------------------

def price_stock_line(
    line: LineItemRequest,
    customer: Dict[str, Any],
    items: List[Dict[str, Any]],
    base_costs: Dict[str, Any],
    weight_breaks: List[Dict[str, Any]],
    column_multipliers_cfg: Dict[str, Any],
    include_freight: bool,
) -> LinePriceResult:
    sku = line.sku
    item = next((x for x in items if x.get("sku") == sku), None)
    if not item:
        raise ValueError(f"Item not found: {sku}")

    material = item.get("material", "")
    material_code = item.get("material_code", "")  # e.g., "VN", "ST", "AP"
    color = item.get("color", "")
    surface = item.get("surface", "")
    weight_per_unit = float(item.get("weight_per_unit", 0.0))
    item_width = float(item.get("width", 48.0))

    base_cost_per_unit = build_base_cost_per_unit(
        material, color, surface, weight_per_unit, base_costs
    )

    column_break = customer.get("column_break", "")
    base_column = extract_column_from_breaks(material_code, column_break)
    freight_offset = int(customer.get("freight_column_offset", 0))

    raw_price_per_unit, total_column = core_engine(
        base_cost_per_unit=base_cost_per_unit,
        weight_per_unit=weight_per_unit,
        quantity=line.quantity,
        base_column=base_column,
        material_code=material_code,
        include_freight=include_freight,
        freight_column_offset=freight_offset,
        weight_breaks=weight_breaks,
        column_multipliers_cfg=column_multipliers_cfg,
    )

    sell_price_per_unit = apply_order_minimums(raw_price_per_unit, line.quantity, item_width)
    extended = sell_price_per_unit * line.quantity

    return LinePriceResult(
        type=line.type,
        sku=sku,
        description=item.get("description", ""),
        quantity=line.quantity,
        weight_per_unit=weight_per_unit,
        base_cost_per_unit=round(base_cost_per_unit, 4),
        sell_price_per_unit=round(sell_price_per_unit, 4),
        extended_sell_price=round(extended, 2),
        total_column=total_column,
    )


def price_custom_line(
    line: LineItemRequest,
    customer: Dict[str, Any],
    base_costs: Dict[str, Any],
    weight_breaks: List[Dict[str, Any]],
    column_multipliers_cfg: Dict[str, Any],
    include_freight: bool,
) -> LinePriceResult:
    # Import custom rules for material specs
    from .custom_rules import get_material_spec, MINIMUM_WEIGHT_LBS

    material = line.material or ""
    color = line.color or ""
    surface = line.surface or ""
    gauge = float(line.gauge or 0.0)
    width = float(line.width or 0.0)
    length = float(line.length or 0.0)
    sheets = float(line.sheets or 0.0)

    mat_key = material.lower()

    # Get material specification from custom_rules
    spec = get_material_spec(material)
    if spec:
        weight_factor = spec.weight_factor
        material_code = spec.material_code
    elif mat_key in ("vinyl", "apet"):
        weight_factor = 0.05
        material_code = "VN" if mat_key == "vinyl" else "AP"
    else:
        # treat other customs like Styrene for now
        weight_factor = 0.04
        material_code = "ST"

    weight_per_sheet = weight_factor * gauge * width * length
    total_weight = weight_per_sheet * sheets

    # ~2000 lbs minimum run (mirroring original logic)
    if total_weight < MINIMUM_WEIGHT_LBS and weight_per_sheet > 0:
        sheets = ceil(2010.0 / weight_per_sheet)

    weight_per_unit = weight_per_sheet
    base_cost_per_unit = build_base_cost_per_unit(
        material, color, surface, weight_per_unit, base_costs
    )

    column_break = customer.get("column_break", "")
    base_column = extract_column_from_breaks(material_code, column_break)

    # Custom Styrene got +10 columns in original C#
    if material_code == "ST":
        base_column += 10

    freight_offset = int(customer.get("freight_column_offset", 0))

    raw_price_per_unit, total_column = core_engine(
        base_cost_per_unit=base_cost_per_unit,
        weight_per_unit=weight_per_unit,
        quantity=sheets,
        base_column=base_column,
        material_code=material_code,
        include_freight=include_freight,
        freight_column_offset=freight_offset,
        weight_breaks=weight_breaks,
        column_multipliers_cfg=column_multipliers_cfg,
    )

    # Use actual sheet width for minimum order calculations
    sell_price_per_unit = apply_order_minimums(raw_price_per_unit, sheets, width)
    extended = sell_price_per_unit * sheets

    # Format: ".030 White Matte/Matte Vinyl 28X40"
    # gauge as decimal, color, surface, material, widthXlength
    auto_description = f"{gauge:.3f} {color} {surface} {material} {int(width)}X{int(length)}"

    return LinePriceResult(
        type=line.type,
        sku=None,
        description=line.description or auto_description,
        quantity=sheets,
        weight_per_unit=weight_per_unit,
        base_cost_per_unit=round(base_cost_per_unit, 4),
        sell_price_per_unit=round(sell_price_per_unit, 4),
        extended_sell_price=round(extended, 2),
        total_column=total_column,
    )


def price_ad_hoc_line(
    line: LineItemRequest,
    customer: Dict[str, Any],
    weight_breaks: List[Dict[str, Any]],
    column_multipliers_cfg: Dict[str, Any],
    include_freight: bool,
) -> LinePriceResult:
    """
    Ad-hoc line: user provides landed_cost_per_unit + weight_per_unit directly.
    """
    weight_per_unit = float(line.weight_per_unit or 0.0)
    base_cost_per_unit = float(line.landed_cost_per_unit or 0.0)

    material_code = "AD"  # generic
    column_break = customer.get("column_break", "")
    base_column = extract_column_from_breaks(material_code, column_break)
    freight_offset = int(customer.get("freight_column_offset", 0))

    raw_price_per_unit, total_column = core_engine(
        base_cost_per_unit=base_cost_per_unit,
        weight_per_unit=weight_per_unit,
        quantity=line.quantity,
        base_column=base_column,
        material_code=material_code,
        include_freight=include_freight,
        freight_column_offset=freight_offset,
        weight_breaks=weight_breaks,
        column_multipliers_cfg=column_multipliers_cfg,
    )

    # No specific width given, assume 48" for minimums
    sell_price_per_unit = apply_order_minimums(raw_price_per_unit, line.quantity, 48.0)
    extended = sell_price_per_unit * line.quantity

    return LinePriceResult(
        type=line.type,
        sku=None,
        description=line.description or "Ad-hoc line",
        quantity=line.quantity,
        weight_per_unit=weight_per_unit,
        base_cost_per_unit=round(base_cost_per_unit, 4),
        sell_price_per_unit=round(sell_price_per_unit, 4),
        extended_sell_price=round(extended, 2),
        total_column=total_column,
    )


# ---------------------------------------------------------------------------
# Quote-level function
# ---------------------------------------------------------------------------

def calculate_quote(req: QuoteRequest, settings: Dict[str, Any]) -> QuoteResponse:
    items: List[Dict[str, Any]] = settings["items"]
    customers: Dict[str, Any] = settings["customers"]
    base_costs: Dict[str, Any] = settings["base_costs"]
    weight_breaks: List[Dict[str, Any]] = settings["weight_breaks"]
    column_multipliers_cfg: Dict[str, Any] = settings["column_multipliers"]

    customer = customers.get(req.customer_id)
    if not customer:
        raise ValueError(f"Unknown customer: {req.customer_id}")

    line_results: List[LinePriceResult] = []

    for line in req.lines:
        if line.type == LineType.STOCK:
            result = price_stock_line(
                line=line,
                customer=customer,
                items=items,
                base_costs=base_costs,
                weight_breaks=weight_breaks,
                column_multipliers_cfg=column_multipliers_cfg,
                include_freight=req.include_freight,
            )
        elif line.type == LineType.CUSTOM:
            result = price_custom_line(
                line=line,
                customer=customer,
                base_costs=base_costs,
                weight_breaks=weight_breaks,
                column_multipliers_cfg=column_multipliers_cfg,
                include_freight=req.include_freight,
            )
        else:  # AD_HOC
            result = price_ad_hoc_line(
                line=line,
                customer=customer,
                weight_breaks=weight_breaks,
                column_multipliers_cfg=column_multipliers_cfg,
                include_freight=req.include_freight,
            )

        line_results.append(result)

    quote_total = sum(l.extended_sell_price for l in line_results)

    return QuoteResponse(
        customer_id=req.customer_id,
        include_freight=req.include_freight,
        lines=line_results,
        quote_total=round(quote_total, 2),
    )