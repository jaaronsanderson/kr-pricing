import type { AdHocLine } from "../../types";
import { cn } from "../../lib/utils";

interface AdHocLineEditorProps {
  line: AdHocLine;
  index: number;
  onUpdate: (index: number, patch: Partial<AdHocLine>) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
}

export function AdHocLineEditor({
  line,
  index,
  onUpdate,
  onRemove,
  onDuplicate,
}: AdHocLineEditorProps) {
  return (
    <div className="group relative rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-300">
      {/* Line Type Badge */}
      <div className="absolute -top-2.5 left-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-medium text-white shadow-sm">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Ad-Hoc #{index + 1}
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
        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-amber-700">
            Description
          </label>
          <input
            type="text"
            value={line.description}
            onChange={(e) => onUpdate(index, { description: e.target.value })}
            placeholder="Describe this line item..."
            className={cn(
              "w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20",
              "transition-colors placeholder:text-zinc-400"
            )}
          />
        </div>

        {/* Weight per Unit */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-amber-700">
            Weight / Unit (lb)
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={line.weightPerUnit}
            onChange={(e) => onUpdate(index, { weightPerUnit: Number(e.target.value) || 0 })}
            onFocus={(e) => e.target.select()}
            className={cn(
              "w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20",
              "transition-colors"
            )}
          />
        </div>

        {/* Landed Cost */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-amber-700">
            Landed Cost / Unit ($)
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={line.landedCostPerUnit}
            onChange={(e) => onUpdate(index, { landedCostPerUnit: Number(e.target.value) || 0 })}
            onFocus={(e) => e.target.select()}
            className={cn(
              "w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20",
              "transition-colors"
            )}
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-amber-700">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={line.quantity}
            onChange={(e) => onUpdate(index, { quantity: Number(e.target.value) || 1 })}
            onFocus={(e) => e.target.select()}
            className={cn(
              "w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20",
              "transition-colors"
            )}
          />
        </div>

        {/* Calculated Preview */}
        <div className="flex items-center">
          <div className="rounded-lg bg-amber-100/60 px-4 py-2">
            <p className="text-xs text-amber-600">Total Weight</p>
            <p className="text-sm font-semibold text-amber-900">
              {((line.weightPerUnit || 0) * (line.quantity || 0)).toLocaleString()} lb
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
