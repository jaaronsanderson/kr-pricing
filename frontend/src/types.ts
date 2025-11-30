// ---------------- Basic backend entities ----------------

export interface Customer {
  id: string;
  name: string;
}

export interface Item {
  sku: string;
  description: string;
}

// ---------------- UI line input types ----------------

export type LineKind = "stock" | "custom" | "ad_hoc";

export interface StockLine {
  kind: "stock";
  itemSku: string;
  quantity: number;
}

export interface CustomLine {
  kind: "custom";
  material: string;      // "Vinyl", "Styrene", "APET", "Polycarbonate", "Polyethylene"
  color: string;         // e.g., "White", "Clear", "Dead White"
  surface: string;       // e.g., "Gloss/Gloss", "Velvet/Gloss"
  gauge: number;         // thickness in mils
  width: number;         // inches
  length: number;        // inches
  sheets: number;        // number of sheets
  description?: string;  // optional custom description
}

export interface AdHocLine {
  kind: "ad_hoc";
  description: string;
  weightPerUnit: number;
  landedCostPerUnit: number;
  quantity: number;
}

export type QuoteLineInput = StockLine | CustomLine | AdHocLine;

// ---------------- Backend request/response models ----------------

export type BackendLineItemRequest =
  | {
      type: "stock";
      quantity: number;
      sku: string;
    }
  | {
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
  | {
      type: "ad_hoc";
      quantity: number;
      description: string;
      weight_per_unit: number;
      landed_cost_per_unit: number;
    };

export interface QuoteRequest {
  customer_id: string;
  include_freight: boolean;
  lines: BackendLineItemRequest[];
}

export interface QuoteResponseLine {
  type: string; // "stock" | "custom" | "ad_hoc"
  sku?: string;
  description?: string;
  quantity: number;
  weight_per_unit: number;
  base_cost_per_unit: number;
  sell_price_per_unit: number;
  extended_sell_price: number;
  total_column: number;
}

export interface QuoteResponse {
  customer_id: string;
  include_freight: boolean;
  quote_total: number;
  lines: QuoteResponseLine[];
}

// ---------------- Quote history types ----------------

// Summary returned by GET /quotes
export interface QuoteSummary {
  id: number;
  customer_id: string;
  include_freight: boolean;
  quote_total: number;
  created_at?: string;
  num_lines?: number;
}

// Full record returned by GET /quotes/{id}
export interface QuoteRecord extends QuoteResponse {
  id: number;
  created_at?: string;
  num_lines?: number;
  [key: string]: any;
}

export interface Quote {
  id: number;
  customer_id: number;
  created_at: string;
  requested_by?: string;
  status?: string;
  total_price?: number;
}

// Material options for custom lines
export const MATERIALS: readonly string[] = [
  "Vinyl",
  "Styrene",
  "APET",
  "Polycarbonate",
  "Polyethylene",
];

export const VINYL_COLORS: readonly string[] = [
  "White",
  "Clear",
  "Black",
  "Red",
  "Blue",
  "Green",
  "Yellow",
];

export const STYRENE_COLORS: readonly string[] = [
  "White",
  "Translucent White",
  "Dead White",
  "Clear",
];

export const VINYL_SURFACES: readonly string[] = [
  "Gloss/Gloss",
  "Gloss/Matte",
  "Velvet/Gloss",
  "Velvet One Side",
];

export const STYRENE_SURFACES: readonly string[] = [
  "Gloss/Matte",
  "Matte/Matte",
];

export const STANDARD_SURFACES: readonly string[] = [
  "Gloss",
  "Matte",
];