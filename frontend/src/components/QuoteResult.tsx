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
    const headerRow = ["Description", "Qty", "Weight (lb)", "Sell/Unit", "Extended"].join("\t");
    
    const lineRows = lines.map((line: any) => {
      const desc = line.description || line.sku || "";
      const qty = line.quantity ?? "";
      const weight = line.weight_per_unit ? Number(line.weight_per_unit).toFixed(2) : "";
      const sellPerUnit = line.sell_price_per_unit ? "$" + Number(line.sell_price_per_unit).toFixed(2) : "";
      const extended = line.extended_sell_price ? "$" + Number(line.extended_sell_price).toFixed(2) : "";
      
      return [desc, qty, weight, sellPerUnit, extended].join("\t");
    });

    const totalRow = ["", "", "", "Total:", "$" + Number(quote.quote_total).toFixed(2)].join("\t");
    
    const clipboardText = [headerRow, ...lineRows, totalRow].join("\n");
    
    navigator.clipboard.writeText(clipboardText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
            <button
              onClick={copyToClipboard}
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