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

export type LineKind = "stock" | "custom";

export interface StockLine {
  kind: "stock";
  itemSku: string;
  quantity: number;
}

export interface CustomLine {
  kind: "custom";
  description: string;
  weightPerUnit: number;
  landedCostPerUnit: number;
  quantity: number;
}

export type QuoteLineInput = StockLine | CustomLine;

// ---------------- Backend request/response models ----------------

export type BackendLineItemRequest =
  | {
      type: "stock";
      quantity: number;
      sku: string;
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
  type: string; // "stock" | "custom" | "ad_hoc" etc.
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
