import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineItemRequest,
  QuoteRequest,
  QuoteResponse,
  LineType,
  Customer,
  Item,
} from "./types";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [includeFreight, setIncludeFreight] = useState(true);

  const [lines, setLines] = useState<LineItemRequest[]>([
    { type: "stock", sku: "", quantity: 1 },
  ]);

  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load customers + items on mount
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [custRes, itemRes] = await Promise.all([
          axios.get<Customer[]>(`${API_BASE}/customers`),
          axios.get<Item[]>(`${API_BASE}/items`),
        ]);

        setCustomers(custRes.data);
        if (!customerId && custRes.data.length > 0) {
          setCustomerId(custRes.data[0].id);
        }

        setItems(itemRes.data);
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };

    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLine = (index: number, patch: Partial<LineItemRequest>) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, { type: "stock", sku: "", quantity: 1 }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index: number, type: LineType) => {
    if (type === "stock") {
      updateLine(index, { type, sku: "", quantity: 1 });
    } else if (type === "custom") {
      updateLine(index, {
        type,
        material: "Vinyl",
        gauge: 0.06,
        width: 48,
        length: 96,
        sheets: 1,
        quantity: 1,
      });
    } else {
      // ad_hoc
      updateLine(index, {
        type,
        description: "",
        weight_per_unit: 0,
        landed_cost_per_unit: 0,
        quantity: 1,
      });
    }
  };

  const submitQuote = async () => {
    setLoading(true);
    setError(null);
    setQuote(null);

    const payload: QuoteRequest = {
      customer_id: customerId,
      include_freight: includeFreight,
      lines,
    };

    try {
      const res = await axios.post<QuoteResponse>(`${API_BASE}/quote`, payload);
      setQuote(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Error calling API");
    } finally {
      setLoading(false);
    }
  };

  // Pre-compute totals when quote exists
  let totalCost = 0;
  let totalSell = 0;
  let totalMargin = 0;
  let totalMarginPct = 0;

  if (quote) {
    totalSell = quote.quote_total;
    totalCost = quote.lines.reduce(
      (acc, l) => acc + l.base_cost_per_unit * l.quantity,
      0
    );
    totalMargin = totalSell - totalCost;
    totalMarginPct = totalSell > 0 ? (totalMargin / totalSell) * 100 : 0;
  }

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
        K&R Pricing – Quote Builder
      </h1>

      {/* Top controls */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <label>Customer:&nbsp;</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{ padding: "0.25rem 0.5rem" }}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} – {c.name}
              </option>
            ))}
          </select>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <input
            type="checkbox"
            checked={includeFreight}
            onChange={(e) => setIncludeFreight(e.target.checked)}
          />
          Include freight
        </label>

        <button
          onClick={submitQuote}
          disabled={loading}
          style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          {loading ? "Pricing..." : "Get Quote"}
        </button>
      </div>

      {/* Line editor */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {lines.map((line, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "1rem",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <strong>Line {idx + 1}</strong>
              <select
                value={line.type}
                onChange={(e) =>
                  handleTypeChange(idx, e.target.value as LineType)
                }
              >
                <option value="stock">Stock</option>
                <option value="custom">Custom</option>
                <option value="ad_hoc">Ad-hoc</option>
              </select>
              <button
                onClick={() => removeLine(idx)}
                style={{ marginLeft: "auto" }}
              >
                ✕
              </button>
            </div>

            {/* STOCK */}
            {line.type === "stock" && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ marginBottom: "0.5rem" }}>
                  <label>SKU:&nbsp;</label>
                  <select
                    value={line.sku || ""}
                    onChange={(e) =>
                      updateLine(idx, {
                        sku: e.target.value || undefined,
                      })
                    }
                    style={{ minWidth: 320 }}
                  >
                    <option value="">-- Select item --</option>
                    {items.map((item) => (
                      <option key={item.sku} value={item.sku}>
                        {item.sku} – {item.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Qty:&nbsp;</label>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(idx, { quantity: Number(e.target.value) })
                    }
                    style={{ width: 80 }}
                  />
                </div>
              </div>
            )}

            {/* CUSTOM */}
            {line.type === "custom" && (
              <div
                style={{
                  marginTop: "0.75rem",
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <label>Material:&nbsp;</label>
                  <input
                    value={line.material || ""}
                    onChange={(e) =>
                      updateLine(idx, { material: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Gauge:&nbsp;</label>
                  <input
                    type="number"
                    step="0.01"
                    value={line.gauge ?? ""}
                    onChange={(e) =>
                      updateLine(idx, { gauge: Number(e.target.value) })
                    }
                    style={{ width: 80 }}
                  />
                </div>
                <div>
                  <label>Width:&nbsp;</label>
                  <input
                    type="number"
                    value={line.width ?? ""}
                    onChange={(e) =>
                      updateLine(idx, { width: Number(e.target.value) })
                    }
                    style={{ width: 80 }}
                  />
                </div>
                <div>
                  <label>Length:&nbsp;</label>
                  <input
                    type="number"
                    value={line.length ?? ""}
                    onChange={(e) =>
                      updateLine(idx, { length: Number(e.target.value) })
                    }
                    style={{ width: 80 }}
                  />
                </div>
                <div>
                  <label>Sheets:&nbsp;</label>
                  <input
                    type="number"
                    value={line.sheets ?? ""}
                    onChange={(e) =>
                      updateLine(idx, { sheets: Number(e.target.value) })
                    }
                    style={{ width: 80 }}
                  />
                </div>
              </div>
            )}

            {/* AD_HOC */}
            {line.type === "ad_hoc" && (
              <div
                style={{
                  marginTop: "0.75rem",
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <label>Description:&nbsp;</label>
                  <input
                    value={line.description || ""}
                    onChange={(e) =>
                      updateLine(idx, { description: e.target.value })
                    }
                    style={{ minWidth: 240 }}
                  />
                </div>
                <div>
                  <label>Weight/unit:&nbsp;</label>
                  <input
                    type="number"
                    step="0.01"
                    value={line.weight_per_unit ?? ""}
                    onChange={(e) =>
                      updateLine(idx, {
                        weight_per_unit: Number(e.target.value),
                      })
                    }
                    style={{ width: 100 }}
                  />
                </div>
                <div>
                  <label>Landed cost/unit:&nbsp;</label>
                  <input
                    type="number"
                    step="0.01"
                    value={line.landed_cost_per_unit ?? ""}
                    onChange={(e) =>
                      updateLine(idx, {
                        landed_cost_per_unit: Number(e.target.value),
                      })
                    }
                    style={{ width: 120 }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addLine}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
      >
        + Add Line
      </button>

      {/* Error */}
      {error && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Quote result with margin details */}
      {quote && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Quote Result</h2>
          <p>
            Customer: <strong>{quote.customer_id}</strong> | Freight:{" "}
            <strong>{quote.include_freight ? "Yes" : "No"}</strong>
          </p>

          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              maxWidth: 1000,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "left",
                    padding: "0.25rem",
                  }}
                >
                  Item
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "right",
                    padding: "0.25rem",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "right",
                    padding: "0.25rem",
                  }}
                >
                  Cost/unit
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "right",
                    padding: "0.25rem",
                  }}
                >
                  Sell/unit
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "right",
                    padding: "0.25rem",
                  }}
                >
                  Extended Sell
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "right",
                    padding: "0.25rem",
                  }}
                >
                  Margin $
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "right",
                    padding: "0.25rem",
                  }}
                >
                  Margin %
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ccc",
                    textAlign: "right",
                    padding: "0.25rem",
                  }}
                >
                  Column
                </th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((l, i) => {
                const extendedCost = l.base_cost_per_unit * l.quantity;
                const lineMargin = l.extended_sell_price - extendedCost;
                const lineMarginPct =
                  l.extended_sell_price > 0
                    ? (lineMargin / l.extended_sell_price) * 100
                    : 0;

                return (
                  <tr key={i}>
                    <td style={{ padding: "0.25rem" }}>
                      {l.sku || l.description || l.type}
                    </td>
                    <td style={{ padding: "0.25rem", textAlign: "right" }}>
                      {l.quantity}
                    </td>
                    <td style={{ padding: "0.25rem", textAlign: "right" }}>
                      {l.base_cost_per_unit.toFixed(3)}
                    </td>
                    <td style={{ padding: "0.25rem", textAlign: "right" }}>
                      {l.sell_price_per_unit.toFixed(3)}
                    </td>
                    <td style={{ padding: "0.25rem", textAlign: "right" }}>
                      {l.extended_sell_price.toFixed(2)}
                    </td>
                    <td style={{ padding: "0.25rem", textAlign: "right" }}>
                      {lineMargin.toFixed(2)}
                    </td>
                    <td style={{ padding: "0.25rem", textAlign: "right" }}>
                      {lineMarginPct.toFixed(1)}%
                    </td>
                    <td style={{ padding: "0.25rem", textAlign: "right" }}>
                      {l.total_column}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={4}
                  style={{ padding: "0.25rem", textAlign: "right" }}
                >
                  <strong>Totals:</strong>
                </td>
                <td style={{ padding: "0.25rem", textAlign: "right" }}>
                  <strong>{totalSell.toFixed(2)}</strong>
                </td>
                <td style={{ padding: "0.25rem", textAlign: "right" }}>
                  <strong>{totalMargin.toFixed(2)}</strong>
                </td>
                <td style={{ padding: "0.25rem", textAlign: "right" }}>
                  <strong>{totalMarginPct.toFixed(1)}%</strong>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
