// ============ Constants ============

// Custom sheet materials (only these 3 are valid for custom sheets)
export const CUSTOM_MATERIALS = ["Vinyl", "Styrene", "APET"] as const;

// Legacy alias for backwards compatibility
export const MATERIALS = CUSTOM_MATERIALS;

// Colors by material (for custom sheets)
export const VINYL_COLORS = ["White", "Clear", "Stock Color"] as const;
export const STYRENE_COLORS = ["White", "Translucent White", "Dead White"] as const;
export const APET_COLORS = ["Clear"] as const;

// Surfaces by material (for custom sheets)
export const VINYL_SURFACES = ["Matte/Matte", "Gloss/Gloss", "Gloss/Matte", "Velvet One Side"] as const;
export const STYRENE_SURFACES = ["Matte/Matte", "Gloss/Matte"] as const;
export const APET_SURFACES = ["Gloss/Gloss"] as const;
export const STANDARD_SURFACES = ["Gloss/Gloss", "Matte/Matte"] as const;

// ============ Material Constraints ============
// These match the backend custom_rules.py

export interface MaterialConstraints {
  gauge: { min: number; max: number };
  width: { min: number; max: number };
  length: { min: number; max: number };
  weightFactor: number;
}

export const MATERIAL_CONSTRAINTS: Record<string, MaterialConstraints> = {
  Vinyl: {
    gauge: { min: 0.009, max: 0.030 },
    width: { min: 20, max: 50 },
    length: { min: 20, max: 70 },
    weightFactor: 0.05,
  },
  APET: {
    gauge: { min: 0.009, max: 0.030 },
    width: { min: 20, max: 50 },
    length: { min: 20, max: 70 },
    weightFactor: 0.05,
  },
  Styrene: {
    gauge: { min: 0.009, max: 0.250 },
    width: { min: 20, max: 65 },
    length: { min: 20, max: 130 },
    weightFactor: 0.04,
  },
};

// Default values (within valid ranges for Vinyl)
export const DEFAULT_CUSTOM_VALUES = {
  material: "Vinyl" as const,
  color: "White" as const,
  surface: "Matte/Matte" as const,
  gauge: 0.015,  // Middle of Vinyl range (0.009-0.030)
  width: 36,     // Middle of Vinyl range (20-50)
  length: 48,    // Middle of Vinyl range (20-70)
  sheets: 100,
};

// Minimum order constants
export const MINIMUM_WEIGHT_LBS = 2000;
export const MINIMUM_ORDER_VALUE = 150;
export const WIDE_SHEET_THRESHOLD = 47;
export const WIDE_SHEET_MINIMUM_VALUE = 550;

// ============ Customer & Item ============

export interface Customer {
  id: string;
  name: string;
  column_min?: number;
  column_max?: number;
  freight_offset?: number;
}

export interface Item {
  sku: string;
  description: string;
  material?: string;
  gauge?: number;
  width?: number;
  length?: number;
  weight_per_unit?: number;
  base_column?: number;
}

// ============ Line Types ============

export interface StockLine {
  kind: "stock";
  itemSku: string;
  quantity: number;
}

export interface CustomLine {
  kind: "custom";
  material: string;
  color: string;
  surface: string;
  gauge: number;
  width: number;
  length: number;
  sheets: number;
  description?: string;
}

export interface AdHocLine {
  kind: "ad_hoc";
  description: string;
  weightPerUnit: number;
  landedCostPerUnit: number;
  quantity: number;
}

export type QuoteLineInput = StockLine | CustomLine | AdHocLine;

// ============ Backend Request Types ============

export interface BackendStockLine {
  type: "stock";
  quantity: number;
  sku: string;
}

export interface BackendCustomLine {
  type: "custom";
  quantity: number;
  material: string;
  color: string;
  surface: string;
  gauge: number;
  width: number;
  length: number;
  sheets: number;
  description?: string;
}

export interface BackendAdHocLine {
  type: "ad_hoc";
  quantity: number;
  description: string;
  weight_per_unit: number;
  landed_cost_per_unit: number;
}

export type BackendLineItemRequest = BackendStockLine | BackendCustomLine | BackendAdHocLine;

export interface QuoteRequest {
  customer_id: string;
  include_freight: boolean;
  lines: BackendLineItemRequest[];
}

// ============ Response Types ============

export interface QuoteLineResponse {
  description?: string;
  sku?: string;
  type: string;
  quantity: number;
  weight_per_unit?: number;
  cost_per_unit?: number;
  sell_per_unit?: number;
  extended_price?: number;
  column?: number;
}

export interface QuoteResponse {
  id?: number;
  customer_id: string;
  include_freight: boolean;
  quote_total: number;
  lines: QuoteLineResponse[];
  created_at?: string;
}

export interface QuoteSummary {
  id: number;
  customer_id: string;
  quote_total: number;
  num_lines?: number;
  created_at?: string;
}

export interface QuoteRecord extends QuoteResponse {
  id: number;
}
