export type LineType = "stock" | "custom" | "ad_hoc";

/*
|--------------------------------------------------------------------------
| Line Item Request (sent TO the API)
|--------------------------------------------------------------------------
*/
export interface LineItemRequest {
  type: LineType;
  quantity: number;

  // STOCK
  sku?: string;

  // CUSTOM (sheet goods)
  material?: string;
  color?: string;
  surface?: string;
  gauge?: number;
  width?: number;
  length?: number;
  sheets?: number;

  // AD-HOC
  description?: string;
  weight_per_unit?: number;
  landed_cost_per_unit?: number;
}

/*
|--------------------------------------------------------------------------
| Quote Request
|--------------------------------------------------------------------------
*/
export interface QuoteRequest {
  customer_id: string;
  include_freight: boolean;
  lines: LineItemRequest[];
}

/*
|--------------------------------------------------------------------------
| Line Price Result (returned FROM the API)
|--------------------------------------------------------------------------
*/
export interface LinePriceResult {
  type: LineType;

  sku?: string;
  description?: string;

  quantity: number;
  weight_per_unit: number;
  base_cost_per_unit: number;
  sell_price_per_unit: number;
  extended_sell_price: number;

  total_column: number;
}

/*
|--------------------------------------------------------------------------
| Quote Response (returned FROM the API)
|--------------------------------------------------------------------------
*/
export interface QuoteResponse {
  customer_id: string;
  include_freight: boolean;
  lines: LinePriceResult[];
  quote_total: number;
}

/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/
export interface Customer {
  id: string;
  name: string;
}

/*
|--------------------------------------------------------------------------
| Item (SKU)
|--------------------------------------------------------------------------
*/
export interface Item {
  sku: string;
  description: string;
}

/*
|--------------------------------------------------------------------------
| Quote History Summary
|--------------------------------------------------------------------------
*/
export interface QuoteSummary {
  id: number;
  customer_id: string;
  include_freight: boolean;
  quote_total: number;
  created_at: string;
  num_lines: number;
}

/*
|--------------------------------------------------------------------------
| Loaded Saved Quote (full detail)
|--------------------------------------------------------------------------
*/
export interface SavedQuote extends QuoteResponse {
  id: number;
  created_at: string;
}
