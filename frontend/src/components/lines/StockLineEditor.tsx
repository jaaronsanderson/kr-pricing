import type { StockLine, Item } from "../../types";
import { cn } from "../../lib/utils";

interface StockLineEditorProps {
  line: StockLine;
  index: number;
  items: Item[];
  onUpdate: (index: number, patch: Partial<StockLine>) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
}

export function StockLineEditor({
  line,
  index,
  items,
  onUpdate,
  onRemove,
  onDuplicate,
}: StockLineEditorProps) {
  const selectedItem = items.find((i) => i.sku === line.itemSku);

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-zinc-300">
      {/* Line Type Badge */}
      <div className="absolute -top-2.5 left-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white shadow-sm">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Stock #{index + 1}
        </span>
      </div>

      {/* Actions */}
      <div className="absolute -top-2.5 right-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onDuplicate(index)}
          className="rounded-full bg-white border border-zinc-200 p-1.5 text-zinc-500 shadow-sm hover:bg-zinc-50 hover:text-zinc-700"
          title="Duplicate line"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
        </button>
        <button
          onClick={() => onRemove(index)}
          className="rounded-full bg-white border border-red-200 p-1.5 text-red-500 shadow-sm hover:bg-red-50 hover:border-red-300"
          title="Remove line"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {/* Item Select */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Select Item
          </label>
          <select
            value={line.itemSku}
            onChange={(e) => onUpdate(index, { itemSku: e.target.value })}
            tabIndex={6}
            className={cn(
              "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              "transition-colors"
            )}
          >
            <option value="">Choose an item...</option>
            {items.map((item) => (
              <option key={item.sku} value={item.sku}>
                {item.sku} — {item.description}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={line.quantity}
            onChange={(e) => onUpdate(index, { quantity: Number(e.target.value) || 1 })}
            onFocus={(e) => e.target.select()}
            tabIndex={7}
            className={cn(
              "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              "transition-colors"
            )}
          />
        </div>

        {/* Item Preview */}
        {selectedItem && (
          <div className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-200 text-xs font-bold text-zinc-600">
              {selectedItem.material?.[0] || "?"}
            </div>
            <div className="text-xs text-zinc-600">
              {selectedItem.gauge && <span>{selectedItem.gauge} mil</span>}
              {selectedItem.width && selectedItem.length && (
                <span className="ml-2">
                  {selectedItem.width}" × {selectedItem.length}"
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
