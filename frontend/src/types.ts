// ============ Constants ============

export const MATERIALS = ["Vinyl", "Styrene", "PETG", "Polycarbonate"] as const;

export const VINYL_COLORS = ["White", "Clear", "Black", "Custom"] as const;
export const STYRENE_COLORS = ["White", "Black", "Custom"] as const;

export const VINYL_SURFACES = ["Gloss/Gloss", "Gloss/Matte", "Matte/Matte"] as const;
export const STYRENE_SURFACES = ["Gloss/Gloss", "Matte/Matte"] as const;
export const STANDARD_SURFACES = ["Gloss/Gloss", "Matte/Matte"] as const;

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
