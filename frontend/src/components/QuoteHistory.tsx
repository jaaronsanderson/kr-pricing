import { useState } from "react";
import type { QuoteSummary, QuoteRecord } from "../types";
import { formatMoney, formatDate, cn } from "../lib/utils";

interface QuoteHistoryProps {
  quotes: QuoteSummary[];
  selectedQuote: QuoteRecord | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectQuote: (id: number) => void;
  disabled: boolean;
  tabIndex?: number;
}

export function QuoteHistory({
  quotes,
  selectedQuote,
  isLoading,
  onRefresh,
  onSelectQuote,
  disabled,
  tabIndex = 0,
}: QuoteHistoryProps) {
  const [showSelectedJson, setShowSelectedJson] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-fit">
      {/* Header */}
      <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-sm font-semibold text-zinc-900">Quote History</h2>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading || disabled}
            tabIndex={tabIndex}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              isLoading || disabled
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
            )}
          >
            {isLoading ? (
              <>
                <svg
                  className="h-3 w-3 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                Loading...
              </>
            ) : (
              <>
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quote List */}
      <div className="max-h-[300px] overflow-y-auto">
        {quotes.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <svg
              className="mx-auto h-8 w-8 text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="mt-2 text-sm text-zinc-500">No quotes yet</p>
            <p className="text-xs text-zinc-400">
              Click Refresh to load history
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {quotes.map((q) => (
              <button
                key={q.id}
                onClick={() => onSelectQuote(q.id)}
                tabIndex={tabIndex}
                className={cn(
                  "w-full px-5 py-3 text-left transition-colors",
                  selectedQuote?.id === q.id
                    ? "bg-emerald-50 border-l-2 border-emerald-500"
                    : "hover:bg-zinc-50 border-l-2 border-transparent"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-zinc-400">
                      #{q.id}
                    </span>
                    <span className="ml-2 text-sm font-medium text-zinc-900">
                      {q.customer_id}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                    {formatMoney(q.quote_total)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                  <span>{q.num_lines ?? "?"} lines</span>
                  <span>•</span>
                  <span>{formatDate(q.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Quote Detail */}
      {selectedQuote && (
        <div className="border-t border-zinc-200">
          <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">
                Quote #{selectedQuote.id} Detail
              </h3>
              <button
                onClick={() => setShowSelectedJson((prev) => !prev)}
                tabIndex={tabIndex}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                {showSelectedJson ? "Hide" : "Show"} JSON
              </button>
            </div>
          </div>
          {showSelectedJson && (
            <div className="bg-zinc-900 p-4">
              <pre className="text-xs text-zinc-300 overflow-auto max-h-48">
                {JSON.stringify(selectedQuote, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
