import type { QuoteLineInput } from "../types";
import { cn } from "../lib/utils";

interface QuoteSummaryCardProps {
  lines: QuoteLineInput[];
  customerId: string;
  includeFreight: boolean;
  isCalculating: boolean;
  onCalculate: () => void;
  disabled: boolean;
}

export function QuoteSummaryCard({
  lines,
  customerId,
  includeFreight,
  isCalculating,
  onCalculate,
  disabled,
}: QuoteSummaryCardProps) {
  const stockCount = lines.filter((l) => l.kind === "stock").length;
  const customCount = lines.filter((l) => l.kind === "custom").length;
  const adHocCount = lines.filter((l) => l.kind === "ad_hoc").length;

  const canCalculate = customerId && lines.length > 0 && !disabled;

  return (
    <div className="sticky top-6 rounded-2xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 px-5 py-4">
        <h3 className="text-sm font-semibold text-white">Quote Summary</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          {customerId || "No customer selected"}
        </p>
      </div>

      {/* Line Counts */}
      <div className="border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Total Lines</span>
          <span className="font-semibold text-zinc-900">{lines.length}</span>
        </div>
        {lines.length > 0 && (
          <div className="mt-3 flex gap-2">
            {stockCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                {stockCount} Stock
              </span>
            )}
            {customCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {customCount} Custom
              </span>
            )}
            {adHocCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {adHocCount} Ad-Hoc
              </span>
            )}
          </div>
        )}
      </div>

      {/* Freight Toggle Display */}
      <div className="border-b border-zinc-100 px-5 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Freight</span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              includeFreight
                ? "bg-emerald-100 text-emerald-700"
                : "bg-zinc-100 text-zinc-500"
            )}
          >
            {includeFreight ? "Included" : "Excluded"}
          </span>
        </div>
      </div>

      {/* Calculate Button */}
      <div className="p-5">
        <button
          onClick={onCalculate}
          disabled={!canCalculate || isCalculating}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-semibold transition-all",
            canCalculate && !isCalculating
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:scale-[1.02] active:scale-[0.98]"
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
          )}
        >
          {isCalculating ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Calculating...
            </span>
          ) : (
            "Calculate Quote"
          )}
        </button>

        {!customerId && lines.length > 0 && (
          <p className="mt-2 text-center text-xs text-amber-600">
            Select a customer to calculate
          </p>
        )}
        {customerId && lines.length === 0 && (
          <p className="mt-2 text-center text-xs text-amber-600">
            Add at least one line item
          </p>
        )}
      </div>
    </div>
  );
}
