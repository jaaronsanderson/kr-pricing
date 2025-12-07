import type {
  Customer,
  Item,
  QuoteRequest,
  QuoteResponse,
  QuoteSummary,
  QuoteRecord,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function buildHeaders(accessToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
}

// Generic helper using fetch + JSON
async function jsonFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} — ${text}`);
  }
  return (await res.json()) as T;
}

// --------- Data endpoints ---------

export async function fetchCustomers(
  accessToken?: string
): Promise<Customer[]> {
  return jsonFetch<Customer[]>(`${API_BASE}/customers`, {
    headers: buildHeaders(accessToken),
  });
}

export async function fetchItems(accessToken?: string): Promise<Item[]> {
  return jsonFetch<Item[]>(`${API_BASE}/items`, {
    headers: buildHeaders(accessToken),
  });
}

// --------- Quote endpoints ---------

export async function createQuote(
  payload: QuoteRequest,
  accessToken?: string
): Promise<QuoteResponse> {
  return jsonFetch<QuoteResponse>(`${API_BASE}/quote`, {
    method: "POST",
    headers: buildHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

export async function fetchQuotesHistory(
  accessToken?: string
): Promise<QuoteSummary[]> {
  return jsonFetch<QuoteSummary[]>(`${API_BASE}/quotes`, {
    headers: buildHeaders(accessToken),
  });
}

export async function fetchQuoteDetail(
  id: number,
  accessToken?: string
): Promise<QuoteRecord> {
  return jsonFetch<QuoteRecord>(`${API_BASE}/quotes/${id}`, {
    headers: buildHeaders(accessToken),
  });
}

// --------- Settings update endpoints ---------

export async function updateCustomer(
  customerId: string,
  updates: { column_break?: string; freight_column_offset?: number },
  accessToken?: string
): Promise<Customer> {
  return jsonFetch<Customer>(`${API_BASE}/customers/${encodeURIComponent(customerId)}`, {
    method: "PATCH",
    headers: buildHeaders(accessToken),
    body: JSON.stringify(updates),
  });
}

export async function updateItem(
  sku: string,
  updates: { description?: string; avg_cost?: number },
  accessToken?: string
): Promise<Item> {
  return jsonFetch<Item>(`${API_BASE}/items/${encodeURIComponent(sku)}`, {
    method: "PATCH",
    headers: buildHeaders(accessToken),
    body: JSON.stringify(updates),
  });
}

export async function deleteCustomer(
  customerId: string,
  accessToken?: string
): Promise<{ deleted: string }> {
  return jsonFetch<{ deleted: string }>(`${API_BASE}/customers/${encodeURIComponent(customerId)}`, {
    method: "DELETE",
    headers: buildHeaders(accessToken),
  });
}

export async function deleteItem(
  sku: string,
  accessToken?: string
): Promise<{ deleted: string }> {
  return jsonFetch<{ deleted: string }>(`${API_BASE}/items/${encodeURIComponent(sku)}`, {
    method: "DELETE",
    headers: buildHeaders(accessToken),
  });
}
