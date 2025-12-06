"""
Custom sheet sizing rules and material options.
Ported from the legacy C# KRPricing application.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass


# ---------------------------------------------------------------------------
# Material Specifications - Gauge, Width, Length constraints
# ---------------------------------------------------------------------------

@dataclass
class MaterialSpec:
    """Specification for a material's allowed dimensions."""
    min_gauge: float
    max_gauge: float
    min_width: float
    max_width: float
    min_length: float
    max_length: float
    weight_factor: float  # lbs per (gauge * width * length)
    material_code: str    # "VN", "ST", "AP"


MATERIAL_SPECS: Dict[str, MaterialSpec] = {
    "vinyl": MaterialSpec(
        min_gauge=0.009,
        max_gauge=0.030,
        min_width=20.0,
        max_width=50.0,
        min_length=20.0,
        max_length=70.0,
        weight_factor=0.05,
        material_code="VN",
    ),
    "apet": MaterialSpec(
        min_gauge=0.009,
        max_gauge=0.030,
        min_width=20.0,
        max_width=50.0,
        min_length=20.0,
        max_length=70.0,
        weight_factor=0.05,
        material_code="AP",
    ),
    "styrene": MaterialSpec(
        min_gauge=0.009,
        max_gauge=0.250,
        min_width=20.0,
        max_width=65.0,
        min_length=20.0,
        max_length=130.0,
        weight_factor=0.04,
        material_code="ST",
    ),
}


# ---------------------------------------------------------------------------
# Color options by material (for custom sheets)
# ---------------------------------------------------------------------------

CUSTOM_COLORS: Dict[str, List[str]] = {
    "vinyl": ["White", "Clear", "Stock Color"],
    "styrene": ["White", "Translucent White", "Dead White"],
    "apet": ["Clear"],
}


# ---------------------------------------------------------------------------
# Surface options by material (for custom sheets)
# ---------------------------------------------------------------------------

CUSTOM_SURFACES: Dict[str, List[str]] = {
    "vinyl": ["Matte/Matte", "Gloss/Gloss", "Gloss/Matte", "Velvet One Side"],
    "styrene": ["Matte/Matte", "Gloss/Matte"],
    "apet": ["Gloss/Gloss"],
}


# ---------------------------------------------------------------------------
# Extended material options (for stock items - more variety)
# ---------------------------------------------------------------------------

STOCK_MATERIALS = [
    "APET",
    "PETG",
    "Polycarbonate",
    "Polyester",
    "Polyethylene",
    "Polypropylene",
    "Styrene",
    "Vinyl",
]

STOCK_COLORS: Dict[str, List[str]] = {
    "apet": ["Clear"],
    "petg": ["Clear", "Green Tint"],
    "polycarbonate": ["Clear", "Indigo Clear"],
    "polyester": ["Clear"],
    "polyethylene": [
        "Black", "Dark Blue", "Frost", "Green", "Grey",
        "Light Blue", "Orange", "Red", "White", "Yellow"
    ],
    "polypropylene": ["White"],
    "styrene": [
        "Black", "Block Out White", "Dead White",
        "Translucent White", "White", "Yellow"
    ],
    "vinyl": [
        "Black", "Blue", "Clear", "Florescent Green", "Florescent Orange",
        "Florescent Pink", "Florescent Yellow", "Gold", "Green", "Indigo White",
        "Light Blue", "Orange", "Red", "Silver", "Tan", "White", "Yellow"
    ],
}

STOCK_SURFACES: Dict[str, List[str]] = {
    "apet": ["Gloss/Gloss"],
    "petg": ["Gloss/Gloss"],
    "polycarbonate": ["FR700 Velvet Gloss", "Gloss/Gloss", "Velvet/Gloss", "Velvet/Matte"],
    "polyester": ["Gloss/Gloss"],
    "polyethylene": ["Matte/Matte"],
    "polypropylene": ["Matte/Matte"],
    "styrene": ["Gloss/Gloss", "Matte/Matte"],
    "vinyl": ["Blue Matte", "Gloss/Gloss", "Matte/Matte", "Velvet/Gloss"],
}


# ---------------------------------------------------------------------------
# Minimum order rules
# ---------------------------------------------------------------------------

MINIMUM_WEIGHT_LBS = 2000.0  # Minimum total weight for custom orders
MINIMUM_ORDER_VALUE = 150.0  # $150 minimum order value
WIDE_SHEET_THRESHOLD = 47.0  # Width in inches above which higher minimum applies
WIDE_SHEET_MINIMUM_VALUE = 550.0  # $550 minimum for wide sheets


# ---------------------------------------------------------------------------
# Validation functions
# ---------------------------------------------------------------------------

@dataclass
class ValidationResult:
    """Result of validating a custom sheet specification."""
    valid: bool
    errors: List[str]


def get_material_spec(material: str) -> Optional[MaterialSpec]:
    """Get the specification for a material, or None if not a custom material."""
    return MATERIAL_SPECS.get(material.lower())


def validate_custom_sheet(
    material: str,
    color: str,
    surface: str,
    gauge: float,
    width: float,
    length: float,
    sheets: float,
) -> ValidationResult:
    """
    Validate a custom sheet specification against the rules.
    Returns a ValidationResult with any errors found.
    """
    errors: List[str] = []
    mat_key = material.lower()

    # Check material is valid for custom sheets
    if mat_key not in MATERIAL_SPECS:
        valid_materials = ", ".join(MATERIAL_SPECS.keys())
        errors.append(f"Material '{material}' is not valid for custom sheets. Valid materials: {valid_materials}")
        return ValidationResult(valid=False, errors=errors)

    spec = MATERIAL_SPECS[mat_key]

    # Validate gauge
    if gauge < spec.min_gauge or gauge > spec.max_gauge:
        errors.append(
            f"Gauge must be between {spec.min_gauge} and {spec.max_gauge} for {material}. Got: {gauge}"
        )

    # Validate width
    if width < spec.min_width or width > spec.max_width:
        errors.append(
            f"Width must be between {spec.min_width} and {spec.max_width} inches for {material}. Got: {width}"
        )

    # Validate length
    if length < spec.min_length or length > spec.max_length:
        errors.append(
            f"Length must be between {spec.min_length} and {spec.max_length} inches for {material}. Got: {length}"
        )

    # Validate sheets
    if sheets <= 0:
        errors.append("Number of sheets must be greater than 0")

    # Validate color is valid for material
    valid_colors = CUSTOM_COLORS.get(mat_key, [])
    if color and color not in valid_colors:
        # Case-insensitive check
        color_lower = color.lower()
        valid_colors_lower = [c.lower() for c in valid_colors]
        if color_lower not in valid_colors_lower:
            errors.append(
                f"Color '{color}' is not valid for {material}. Valid colors: {', '.join(valid_colors)}"
            )

    # Validate surface is valid for material
    valid_surfaces = CUSTOM_SURFACES.get(mat_key, [])
    if surface and surface not in valid_surfaces:
        # Case-insensitive check
        surface_lower = surface.lower()
        valid_surfaces_lower = [s.lower() for s in valid_surfaces]
        if surface_lower not in valid_surfaces_lower:
            errors.append(
                f"Surface '{surface}' is not valid for {material}. Valid surfaces: {', '.join(valid_surfaces)}"
            )

    return ValidationResult(valid=len(errors) == 0, errors=errors)


def get_custom_materials() -> List[str]:
    """Get list of materials available for custom sheets."""
    return ["Vinyl", "Styrene", "APET"]


def get_custom_colors(material: str) -> List[str]:
    """Get list of valid colors for a custom sheet material."""
    return CUSTOM_COLORS.get(material.lower(), [])


def get_custom_surfaces(material: str) -> List[str]:
    """Get list of valid surfaces for a custom sheet material."""
    return CUSTOM_SURFACES.get(material.lower(), [])


def get_material_constraints(material: str) -> Optional[Dict]:
    """
    Get the dimension constraints for a material.
    Returns None if material is not valid for custom sheets.
    """
    spec = get_material_spec(material)
    if not spec:
        return None

    return {
        "gauge": {"min": spec.min_gauge, "max": spec.max_gauge},
        "width": {"min": spec.min_width, "max": spec.max_width},
        "length": {"min": spec.min_length, "max": spec.max_length},
        "weight_factor": spec.weight_factor,
    }


def calculate_sheet_weight(material: str, gauge: float, width: float, length: float) -> float:
    """
    Calculate the weight of a single sheet in pounds.
    Formula: weight_factor * gauge * width * length
    """
    spec = get_material_spec(material)
    if not spec:
        # Default to vinyl weight factor if unknown
        return 0.05 * gauge * width * length
    return spec.weight_factor * gauge * width * length


def calculate_minimum_sheets(material: str, gauge: float, width: float, length: float) -> int:
    """
    Calculate the minimum number of sheets needed to meet the 2000 lb minimum.
    """
    weight_per_sheet = calculate_sheet_weight(material, gauge, width, length)
    if weight_per_sheet <= 0:
        return 1

    import math
    # Add a small buffer (2010 instead of 2000) to ensure we're over the minimum
    return math.ceil(2010.0 / weight_per_sheet)
