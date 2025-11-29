import React, { useEffect, useState } from "react";
import type { AccountInfo } from "@azure/msal-browser";

import { msalInstance, loginRequest } from "./authConfig";

import type {
  Customer,
  Item,
  StockLine,
  CustomLine,
  QuoteLineInput,
  QuoteResponse,
  QuoteSummary,
  QuoteRecord,
  QuoteRequest,
  BackendLineItemRequest,
} from "./types";

import {
  fetchCustomers,
  fetchItems,
  createQuote,
  fetchQuotesHistory,
  fetchQuoteDetail,
} from "./api";

function App() {
  // ---------- Auth state ----------
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // ---------- App state ----------
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [includeFreight, setIncludeFreight] = useState(true);

  const [lines, setLines] = useState<QuoteLineInput[]>([]);

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quotesHistory, setQuotesHistory] = useState<QuoteSummary[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);

  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showRawQuoteJson, setShowRawQuoteJson] = useState(false);

  // ---------------- Helpers ----------------

  const formatMoney = (value: unknown): string => {
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value.toFixed(2);
    }
    const n = Number(value);
    if (!Number.isNaN(n)) {
      return n.toFixed(2);
    }
    return "-";
  };

  // ---------------- Auth: init existing account ----------------

  useEffect(() => {
    const active = msalInstance.getActiveAccount();
    if (active) {
      setAccount(active);
      return;
    }
    const all = msalInstance.getAllAccounts();
    if (all.length > 0) {
      msalInstance.setActiveAccount(all[0]);
      setAccount(all[0]);
    }
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const resp = await msalInstance.loginPopup(loginRequest);
      if (resp.account) {
        msalInstance.setActiveAccount(resp.account);
        setAccount(resp.account);
        setError(null); // clear any 401 noise after login
      }
    } catch (e: any) {
      console.error("Login error:", e);
      setAuthError(e?.message || "Failed to sign in with Microsoft.");
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    setAccount(null);
    setCustomers([]);
    setItems([]);
    setLines([]);
    setQuote(null);
    setQuotesHistory([]);
    setSelectedQuote(null);
    setError(null);

    try {
      await msalInstance.logoutPopup();
    } catch (e: any) {
      console.error("Logout error:", e);
      setAuthError(e?.message || "Failed to sign out.");
    }
  };

  // ---------------- Initial load: customers + items (after login) ----------------

  useEffect(() => {
    if (!account) {
      // Not signed in yet; don't hit the backend
      return;
    }

    async function loadInitial() {
      setLoadingInit(true);
      setError(null);
      try {
        const [customerData, itemData] = await Promise.all([
          fetchCustomers(),
          fetchItems(),
        ]);
        setCustomers(customerData ?? []);
        setItems(itemData ?? []);
      } catch (err: any) {
        console.error("Initial load error:", err);
        setError(
          "Failed to load customers/items: " + (err?.message || String(err))
        );
      } finally {
        setLoadingInit(false);
      }
    }

    loadInitial();
  }, [account]);

  // ---------------- Load quote history ----------------

  async function loadQuotesHistoryHandler() {
    if (!account) {
      setError("Please sign in to view quote history.");
      return;
    }
    setLoadingHistory(true);
    setError(null);
    try {
      const data = await fetchQuotesHistory();
      setQuotesHistory(data ?? []);
    } catch (err: any) {
      console.error("History load error:", err);
      setError(
        "Failed to load quote history: " + (err?.message || String(err))
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadQuoteById(id: number) {
    if (!account) {
      setError("Please sign in to view quote details.");
      return;
    }
    setSelectedQuote(null);
    setError(null);
    try {
      const data = await fetchQuoteDetail(id);
      setSelectedQuote(data);
    } catch (err: any) {
      console.error("Quote detail error:", err);
      setError(
        "Failed to load quote detail: " + (err?.message || String(err))
      );
    }
  }

  // ---------------- Line management ----------------

  function addStockLine() {
    if (items.length === 0) {
      alert("No items loaded yet.");
      return;
    }
    const line: StockLine = {
      kind: "stock",
      itemSku: items[0].sku,
      quantity: 1,
    };
    setLines((prev) => [...prev, line]);
  }

  function addCustomLine() {
    const line: CustomLine = {
      kind: "custom",
      description: "",
      weightPerUnit: 1,
      landedCostPerUnit: 0,
      quantity: 1,
    };
    setLines((prev) => [...prev, line]);
  }

  function updateLine(index: number, patch: Partial<QuoteLineInput>) {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? ({ ...line, ...patch } as QuoteLineInput) : line
      )
    );
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  // ---------------- Submit quote ----------------

  async function submitQuote() {
    if (!account) {
      alert("Please sign in with Microsoft first.");
      return;
    }
    if (!customerId) {
      alert("Please select a customer first.");
      return;
    }
    if (lines.length === 0) {
      alert("Please add at least one line.");
      return;
    }

    setLoadingQuote(true);
    setError(null);
    setQuote(null);
    setSelectedQuote(null);
    setShowRawQuoteJson(false);

    try {
      const backendLines: BackendLineItemRequest[] = lines.map((line) => {
        if (line.kind === "stock") {
          return {
            type: "stock",
            quantity: Number(line.quantity) || 0,
            sku: line.itemSku,
          };
        } else {
          return {
            type: "ad_hoc",
            quantity: Number(line.quantity) || 0,
            description: line.description,
            weight_per_unit: Number(line.weightPerUnit) || 0,
            landed_cost_per_unit: Number(line.landedCostPerUnit) || 0,
          };
        }
      });

      const payload: QuoteRequest = {
        customer_id: customerId,
        include_freight: includeFreight,
        lines: backendLines,
      };

      const data = await createQuote(payload);
      setQuote(data);

      // Refresh history (best-effort)
      loadQuotesHistoryHandler().catch((err) =>
        console.warn("History refresh failed:", err)
      );
    } catch (err: any) {
      console.error("Quote error:", err);
      setError(
        "Failed to calculate quote: " + (err?.message || JSON.stringify(err))
      );
    } finally {
      setLoadingQuote(false);
    }
  }

  // ---------------- Render helpers ----------------

  function renderLine(line: QuoteLineInput, idx: number) {
    if (line.kind === "stock") {
      return (
        <div
          key={idx}
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <h3>Stock Line #{idx + 1}</h3>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>Item: </label>
            <select
              value={line.itemSku}
              onChange={(e) =>
                updateLine(idx, {
                  itemSku: e.target.value,
                } as QuoteLineInput)
              }
            >
              <option value="">Select item...</option>
              {items.map((i) => (
                <option key={i.sku} value={i.sku}>
                  {i.sku} — {i.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Quantity: </label>
            <input
              type="number"
              min={1}
              step={1}
              value={line.quantity}
              onChange={(e) =>
                updateLine(idx, {
                  quantity: Number(e.target.value) || 0,
                } as QuoteLineInput)
              }
              style={{ width: "80px" }}
            />
          </div>
          <button
            onClick={() => removeLine(idx)}
            style={{ marginTop: "0.5rem" }}
          >
            Remove Line
          </button>
        </div>
      );
    }

    // custom line
    return (
      <div
        key={idx}
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      >
        <h3>Custom Line #{idx + 1}</h3>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Description: </label>
          <input
            style={{ width: "260px" }}
            placeholder="Description"
            value={line.description}
            onChange={(e) =>
              updateLine(idx, {
                description: e.target.value,
              } as QuoteLineInput)
            }
          />
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Weight / unit (lb): </label>
          <input
            type="number"
            step={0.01}
            value={line.weightPerUnit}
            onChange={(e) =>
              updateLine(idx, {
                weightPerUnit: Number(e.target.value) || 0,
              } as QuoteLineInput)
            }
            style={{ width: "100px" }}
          />
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>Landed cost / unit: </label>
          <input
            type="number"
            step={0.01}
            value={line.landedCostPerUnit}
            onChange={(e) =>
              updateLine(idx, {
                landedCostPerUnit: Number(e.target.value) || 0,
              } as QuoteLineInput)
            }
            style={{ width: "100px" }}
          />
        </div>
        <div>
          <label>Quantity: </label>
          <input
            type="number"
            min={1}
            step={1}
            value={line.quantity}
            onChange={(e) =>
              updateLine(idx, {
                quantity: Number(e.target.value) || 0,
              } as QuoteLineInput)
            }
            style={{ width: "80px" }}
          />
        </div>
        <button
          onClick={() => removeLine(idx)}
          style={{ marginTop: "0.5rem" }}
        >
          Remove Line
        </button>
      </div>
    );
  }

  function renderQuoteResult() {
    if (!quote) return null;

    const q: any = quote as any;
    const lineItems: any[] = Array.isArray(q.lines) ? q.lines : [];

    return (
      <div style={{ marginTop: "1.5rem" }}>
        <h2>Current Quote Result</h2>

        {/* Summary */}
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem 1rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            background: "#fafafa",
            fontSize: "0.95rem",
          }}
        >
          <div style={{ marginBottom: "0.25rem" }}>
            <strong>Customer:</strong> {quote.customer_id || "N/A"}
          </div>
          <div style={{ marginBottom: "0.25rem" }}>
            <strong>Freight:</strong>{" "}
            {quote.include_freight ? "Included" : "Excluded"}
          </div>
          <div style={{ marginBottom: "0.25rem" }}>
            <strong>Total:</strong> {formatMoney(quote.quote_total)}
          </div>
          <div style={{ marginBottom: "0.25rem" }}>
            <strong>Lines:</strong> {lineItems.length}
          </div>
          {q.created_at && (
            <div style={{ marginBottom: "0.25rem" }}>
              <strong>Created at:</strong> {q.created_at}
            </div>
          )}
          {q.requested_by && (
            <div>
              <strong>Requested by:</strong> {q.requested_by}
            </div>
          )}
        </div>

        {/* Line items table */}
        {lineItems.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      textAlign: "left",
                      padding: "0.3rem",
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      textAlign: "left",
                      padding: "0.3rem",
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      textAlign: "left",
                      padding: "0.3rem",
                    }}
                  >
                    SKU / Desc
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      textAlign: "right",
                      padding: "0.3rem",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      textAlign: "right",
                      padding: "0.3rem",
                    }}
                  >
                    Weight/Unit
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      textAlign: "right",
                      padding: "0.3rem",
                    }}
                  >
                    Cost/Unit
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      textAlign: "right",
                      padding: "0.3rem",
                    }}
                  >
                    Sell/Unit
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      textAlign: "right",
                      padding: "0.3rem",
                    }}
                  >
                    Extended
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line, idx) => {
                  const type =
                    line.type ||
                    line.kind ||
                    (line.is_custom ? "custom" : "stock");

                  const skuOrDesc =
                    line.sku ||
                    line.item_sku ||
                    line.description ||
                    line.item_description ||
                    "";

                  const qty = line.quantity ?? line.qty ?? "";

                  const weight =
                    line.weight_per_unit ??
                    line.weightPerUnit ??
                    line.unit_weight ??
                    "";

                  const costPerUnit =
                    line.landed_cost_per_unit ??
                    line.landedCostPerUnit ??
                    line.cost_per_unit ??
                    "";

                  const sellPerUnit =
                    line.sell_price_per_unit ??
                    line.price_per_unit ??
                    line.unit_price ??
                    "";

                  const extended =
                    line.extended_price ??
                    line.line_total ??
                    (typeof qty === "number" &&
                    typeof sellPerUnit === "number"
                      ? qty * sellPerUnit
                      : undefined);

                  return (
                    <tr key={idx}>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem",
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem",
                        }}
                      >
                        {String(type)}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem",
                        }}
                      >
                        {skuOrDesc}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem",
                          textAlign: "right",
                        }}
                      >
                        {qty}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem",
                          textAlign: "right",
                        }}
                      >
                        {weight !== "" ? weight : "-"}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem",
                          textAlign: "right",
                        }}
                      >
                        {costPerUnit !== "" ? formatMoney(costPerUnit) : "-"}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem",
                          textAlign: "right",
                        }}
                      >
                        {sellPerUnit !== "" ? formatMoney(sellPerUnit) : "-"}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem",
                          textAlign: "right",
                        }}
                      >
                        {extended !== undefined ? formatMoney(extended) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Raw JSON toggle */}
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => setShowRawQuoteJson((prev) => !prev)}
            style={{ fontSize: "0.85rem" }}
          >
            {showRawQuoteJson ? "Hide raw JSON" : "Show raw JSON"}
          </button>
        </div>

        {showRawQuoteJson && (
          <pre
            style={{
              maxHeight: "300px",
              overflow: "auto",
              background: "#f5f5f5",
              padding: "0.5rem",
              marginTop: "0.5rem",
              fontSize: "0.8rem",
            }}
          >
            {JSON.stringify(quote, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  // ---------------- Render ----------------

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        display: "grid",
        gridTemplateColumns: "2fr 1.2fr",
        gap: "2rem",
        alignItems: "flex-start",
      }}
    >
      {/* LEFT COLUMN: Quote builder */}
      <div>
        {/* Header with KR title + auth block */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h1 style={{ margin: 0 }}>KR Pricing System</h1>
          <div style={{ fontSize: "0.9rem", textAlign: "right" }}>
            {account ? (
              <>
                <div>
                  Signed in as <strong>{account.name}</strong>
                </div>
                <button
                  style={{ marginTop: "0.25rem", fontSize: "0.8rem" }}
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button onClick={handleLogin}>Sign in with Microsoft</button>
            )}
          </div>
        </div>

        {authError && (
          <div style={{ color: "red", marginBottom: "0.5rem" }}>
            Auth error: {authError}
          </div>
        )}

        <div
          style={{
            marginTop: "0.25rem",
            fontSize: "0.9rem",
            color: "#555",
          }}
        >
          <div>Customers loaded: {customers.length}</div>
          <div>Items loaded: {items.length}</div>
          {loadingInit && <div>Loading customer/item data...</div>}
        </div>

        {/* Customer + freight */}
        <div style={{ marginTop: "1rem" }}>
          <label>Customer: </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            disabled={!account}
          >
            <option value="">Select...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: "0.75rem" }}>
          <label>
            <input
              type="checkbox"
              checked={includeFreight}
              onChange={(e) => setIncludeFreight(e.target.checked)}
              disabled={!account}
            />{" "}
            Include Freight
          </label>
        </div>

        {/* Lines */}
        <div style={{ marginTop: "1.5rem" }}>
          <h2>Quote Lines</h2>
          <button onClick={addStockLine} disabled={!account}>
            Add Stock Line
          </button>
          <button
            onClick={addCustomLine}
            style={{ marginLeft: "0.75rem" }}
            disabled={!account}
          >
            Add Custom Line
          </button>

          {lines.map((line, idx) => renderLine(line, idx))}
        </div>

        {/* Submit */}
        <div style={{ marginTop: "1.5rem" }}>
          <button onClick={submitQuote} disabled={loadingQuote || !account}>
            {loadingQuote ? "Calculating..." : "Calculate Quote"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: "1rem", color: "red" }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Quote result */}
        {renderQuoteResult()}
      </div>

      {/* RIGHT COLUMN: Quote history */}
      <div>
        <h2>Quote History</h2>
        <div style={{ marginBottom: "0.5rem" }}>
          <button
            onClick={loadQuotesHistoryHandler}
            disabled={loadingHistory || !account}
          >
            {loadingHistory ? "Loading history..." : "Refresh History"}
          </button>
        </div>

        {quotesHistory.length === 0 && !loadingHistory && (
          <p style={{ fontSize: "0.9rem", color: "#555" }}>
            No quotes logged yet, or history not loaded.
          </p>
        )}

        {quotesHistory.length > 0 && (
          <div
            style={{
              maxHeight: "250px",
              overflow: "auto",
              border: "1px solid #ddd",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "4px",
            }}
          >
            {quotesHistory.map((q) => (
              <div
                key={q.id}
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  background:
                    selectedQuote && selectedQuote.id === q.id
                      ? "#eef5ff"
                      : "transparent",
                }}
                onClick={() => loadQuoteById(q.id)}
              >
                <div>
                  <strong>#{q.id}</strong> – {q.customer_id} –{" "}
                  {q.quote_total?.toFixed
                    ? q.quote_total.toFixed(2)
                    : q.quote_total}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  Lines: {q.num_lines ?? "?"} |{" "}
                  {q.created_at ?? "no timestamp"}
                  {q.requested_by ? " | by " + q.requested_by : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedQuote && (
          <div>
            <h3>Selected Quote #{selectedQuote.id}</h3>
            <pre
              style={{
                maxHeight: "300px",
                overflow: "auto",
                background: "#f5f5f5",
                padding: "0.5rem",
              }}
            >
              {JSON.stringify(selectedQuote, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
