import { useState } from "react";
import type { QuoteResponse } from "../types";
import { formatMoney, cn } from "../lib/utils";

interface QuoteResultProps {
  quote: QuoteResponse;
}

export function QuoteResult({ quote }: QuoteResultProps) {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const lines = (quote as any).lines || [];

  const copyToClipboard = () => {
    const freightNote = quote.include_freight ? " delivered" : "";

    const lineRows = lines.map((line: any) => {
      const desc = line.description || line.sku || "";
      const qty = line.quantity ?? "";
      const unit = "sheets";
      const sellPerUnit = line.sell_price_per_unit
        ? "$" + Number(line.sell_price_per_unit).toFixed(2) + " per sheet" + freightNote
        : "";

      return [desc, qty, unit, sellPerUnit].join("\t");
    });

    const clipboardText = lineRows.join("\n");

    navigator.clipboard.writeText(clipboardText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    const freightNote = quote.include_freight ? " (Freight Included)" : " (No Freight)";

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Please allow popups to print the quote.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quote - ${quote.customer_id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 15px; }
            .total { font-size: 28px; font-weight: bold; color: #10b981; }
            .meta { color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f5f5f5; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #ddd; }
            th:not(:first-child) { text-align: right; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            td:not(:first-child) { text-align: right; font-variant-numeric: tabular-nums; }
            .type-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-right: 8px; }
            .type-stock { background: #e5e5e5; color: #525252; }
            .type-custom { background: #d1fae5; color: #047857; }
            .type-adhoc { background: #fef3c7; color: #b45309; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Quote for ${quote.customer_id}</h1>
              <div class="subtitle">${lines.length} line${lines.length !== 1 ? "s" : ""}${freightNote}</div>
            </div>
            <div style="text-align: right;">
              <div class="meta">Quote Total</div>
              <div class="total">${formatMoney(quote.quote_total)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Weight</th>
                <th>Sell/Unit</th>
                <th>Extended</th>
              </tr>
            </thead>
            <tbody>
              ${lines.map((line: any) => {
                const desc = line.description || line.sku || "—";
                const typeClass = line.type === "stock" ? "type-stock" : line.type === "custom" ? "type-custom" : "type-adhoc";
                const typeLabel = line.type === "stock" ? "S" : line.type === "custom" ? "C" : "A";
                return `
                  <tr>
                    <td><span class="type-badge ${typeClass}">${typeLabel}</span>${desc}</td>
                    <td>${line.quantity ?? "—"}</td>
                    <td>${line.weight_per_unit ? Number(line.weight_per_unit).toFixed(2) + " lb" : "—"}</td>
                    <td>${line.sell_price_per_unit ? formatMoney(line.sell_price_per_unit) : "—"}</td>
                    <td style="font-weight: 600;">${line.extended_sell_price ? formatMoney(line.extended_sell_price) : "—"}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>

          <div class="footer">
            Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    // Fallback for browsers that don't fire onload
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm">Quote Total</p>
            <p className="text-3xl font-bold text-white tracking-tight">
              {formatMoney(quote.quote_total)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-emerald-100 text-sm">
                {lines.length} line{lines.length !== 1 ? "s" : ""}
              </p>
              <p className="text-white text-sm font-medium">
                {quote.include_freight ? "Freight included" : "No freight"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                tabIndex={9}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all bg-white/20 text-white hover:bg-white/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Print
              </button>
              <button
                onClick={copyToClipboard}
                tabIndex={10}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  copied
                    ? "bg-white text-emerald-600"
                    : "bg-white/20 text-white hover:bg-white/30"
                )}
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    Copy Quote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Meta */}
      <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Customer</span>
          <span className="font-medium text-zinc-900">{quote.customer_id}</span>
        </div>
      </div>

      {/* Line Items Table */}
      {lines.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Weight
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Cost/Unit
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Sell/Unit
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Extended
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Col
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {lines.map((line: any, idx: number) => {
                const desc = line.description || line.sku || `Line ${idx + 1}`;
                const qty = line.quantity ?? "";
                const weight = line.weight_per_unit ?? "";
                const costPerUnit = line.base_cost_per_unit ?? "";
                const sellPerUnit = line.sell_price_per_unit ?? "";
                const extended = line.extended_sell_price ?? "";
                const column = line.total_column ?? "";

                return (
                  <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 text-zinc-900">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                            line.type === "stock" && "bg-zinc-200 text-zinc-600",
                            line.type === "custom" && "bg-emerald-100 text-emerald-700",
                            line.type === "ad_hoc" && "bg-amber-100 text-amber-700"
                          )}
                        >
                          {line.type === "stock" ? "S" : line.type === "custom" ? "C" : "A"}
                        </span>
                        <span className="truncate max-w-[200px]">{desc}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 tabular-nums">
                      {qty}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 tabular-nums">
                      {weight !== "" ? `${Number(weight).toFixed(2)} lb` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 tabular-nums">
                      {costPerUnit !== "" ? formatMoney(costPerUnit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 tabular-nums">
                      {sellPerUnit !== "" ? formatMoney(sellPerUnit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 tabular-nums">
                      {extended !== "" ? formatMoney(extended) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500 tabular-nums">
                      {column}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Actions */}
      <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-3">
        <button
          onClick={() => setShowJson((prev) => !prev)}
          className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          {showJson ? "Hide raw JSON" : "Show raw JSON"}
        </button>
      </div>

      {/* JSON Preview */}
      {showJson && (
        <div className="border-t border-zinc-100 bg-zinc-900 p-4">
          <pre className="text-xs text-zinc-300 overflow-auto max-h-64">
            {JSON.stringify(quote, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}