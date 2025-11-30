import { useState } from "react";
import type { QuoteResponse } from "../types";
import { formatMoney, cn } from "../lib/utils";

interface QuoteResultProps {
  quote: QuoteResponse;
}

export function QuoteResult({ quote }: QuoteResultProps) {
  const [showJson, setShowJson] = useState(false);
  const lines = quote.lines || [];

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
          <div className="text-right">
            <p className="text-emerald-100 text-sm">
              {lines.length} line{lines.length !== 1 ? "s" : ""}
            </p>
            <p className="text-white text-sm font-medium">
              {quote.include_freight ? "Freight included" : "No freight"}
            </p>
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
              {lines.map((line, idx) => {
                const desc = line.description || line.sku || `Line ${idx + 1}`;
                const qty = line.quantity ?? "";
                const weight = line.weight_per_unit ?? "";
                const costPerUnit = line.cost_per_unit ?? "";
                const sellPerUnit = line.sell_per_unit ?? "";
                const extended = line.extended_price ?? "";
                const column = line.column ?? "";

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
                      {weight !== "" ? `${weight} lb` : "—"}
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
