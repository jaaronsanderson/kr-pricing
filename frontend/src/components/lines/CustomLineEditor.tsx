import { useMemo } from "react";
import type { CustomLine } from "../../types";
import {
  MATERIALS,
  VINYL_COLORS,
  STYRENE_COLORS,
  APET_COLORS,
  VINYL_SURFACES,
  STYRENE_SURFACES,
  APET_SURFACES,
  MATERIAL_CONSTRAINTS,
  MINIMUM_WEIGHT_LBS,
} from "../../types";
import { cn } from "../../lib/utils";

interface CustomLineEditorProps {
  line: CustomLine;
  index: number;
  onUpdate: (index: number, patch: Partial<CustomLine>) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
}

function getColorOptions(material: string): readonly string[] {
  if (material === "Vinyl") return VINYL_COLORS;
  if (material === "Styrene") return STYRENE_COLORS;
  if (material === "APET") return APET_COLORS;
  return ["White", "Clear"];
}

function getSurfaceOptions(material: string): readonly string[] {
  if (material === "Vinyl") return VINYL_SURFACES;
  if (material === "Styrene") return STYRENE_SURFACES;
  if (material === "APET") return APET_SURFACES;
  return VINYL_SURFACES;
}

function getConstraints(material: string) {
  return MATERIAL_CONSTRAINTS[material] || MATERIAL_CONSTRAINTS.Vinyl;
}

interface FieldValidation {
  isValid: boolean;
  message?: string;
}

function validateGauge(value: number, material: string): FieldValidation {
  const constraints = getConstraints(material);
  if (value < constraints.gauge.min) {
    return { isValid: false, message: `Min: ${constraints.gauge.min}` };
  }
  if (value > constraints.gauge.max) {
    return { isValid: false, message: `Max: ${constraints.gauge.max}` };
  }
  return { isValid: true };
}

function validateWidth(value: number, material: string): FieldValidation {
  const constraints = getConstraints(material);
  if (value < constraints.width.min) {
    return { isValid: false, message: `Min: ${constraints.width.min}"` };
  }
  if (value > constraints.width.max) {
    return { isValid: false, message: `Max: ${constraints.width.max}"` };
  }
  return { isValid: true };
}

function validateLength(value: number, material: string): FieldValidation {
  const constraints = getConstraints(material);
  if (value < constraints.length.min) {
    return { isValid: false, message: `Min: ${constraints.length.min}"` };
  }
  if (value > constraints.length.max) {
    return { isValid: false, message: `Max: ${constraints.length.max}"` };
  }
  return { isValid: true };
}

export function CustomLineEditor({
  line,
  index,
  onUpdate,
  onRemove,
  onDuplicate,
}: CustomLineEditorProps) {
  const constraints = getConstraints(line.material);

  // Validation states
  const gaugeValidation = validateGauge(line.gauge, line.material);
  const widthValidation = validateWidth(line.width, line.material);
  const lengthValidation = validateLength(line.length, line.material);

  // Calculate weight info
  const weightInfo = useMemo(() => {
    const weightPerSheet = constraints.weightFactor * line.gauge * line.width * line.length;
    const totalWeight = weightPerSheet * line.sheets;
    const meetsMinimum = totalWeight >= MINIMUM_WEIGHT_LBS;
    const sheetsNeeded = weightPerSheet > 0 ? Math.ceil(2010 / weightPerSheet) : 0;
    return { weightPerSheet, totalWeight, meetsMinimum, sheetsNeeded };
  }, [line.gauge, line.width, line.length, line.sheets, constraints.weightFactor]);

  const handleMaterialChange = (newMaterial: string) => {
    const colors = getColorOptions(newMaterial);
    const surfaces = getSurfaceOptions(newMaterial);
    const newConstraints = getConstraints(newMaterial);

    // Clamp values to new material's valid ranges
    let newGauge = line.gauge;
    let newWidth = line.width;
    let newLength = line.length;

    if (newGauge < newConstraints.gauge.min) newGauge = newConstraints.gauge.min;
    if (newGauge > newConstraints.gauge.max) newGauge = newConstraints.gauge.max;
    if (newWidth < newConstraints.width.min) newWidth = newConstraints.width.min;
    if (newWidth > newConstraints.width.max) newWidth = newConstraints.width.max;
    if (newLength < newConstraints.length.min) newLength = newConstraints.length.min;
    if (newLength > newConstraints.length.max) newLength = newConstraints.length.max;

    onUpdate(index, {
      material: newMaterial,
      color: colors[0] as string,
      surface: surfaces[0] as string,
      gauge: newGauge,
      width: newWidth,
      length: newLength,
    });
  };

  const hasErrors = !gaugeValidation.isValid || !widthValidation.isValid || !lengthValidation.isValid;

  return (
    <div className={cn(
      "group relative rounded-xl border-2 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-sm transition-all hover:shadow-md",
      hasErrors ? "border-red-300 hover:border-red-400" : "border-emerald-200 hover:border-emerald-300"
    )}>
      {/* Line Type Badge */}
      <div className="absolute -top-2.5 left-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-xs font-medium text-white shadow-sm">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Custom #{index + 1}
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

      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {/* Material */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-emerald-700">
            Material
          </label>
          <select
            value={line.material}
            onChange={(e) => handleMaterialChange(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              "transition-colors"
            )}
          >
            {MATERIALS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-emerald-700">
            Color
          </label>
          <select
            value={line.color}
            onChange={(e) => onUpdate(index, { color: e.target.value })}
            className={cn(
              "w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              "transition-colors"
            )}
          >
            {getColorOptions(line.material).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Surface */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-emerald-700">
            Surface
          </label>
          <select
            value={line.surface}
            onChange={(e) => onUpdate(index, { surface: e.target.value })}
            className={cn(
              "w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              "transition-colors"
            )}
          >
            {getSurfaceOptions(line.material).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Gauge */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-emerald-700">
            <span>Gauge</span>
            <span className="normal-case text-zinc-400">
              {constraints.gauge.min} - {constraints.gauge.max}
            </span>
          </label>
          <input
            type="number"
            min={constraints.gauge.min}
            max={constraints.gauge.max}
            step={0.001}
            value={line.gauge}
            onChange={(e) => onUpdate(index, { gauge: Number(e.target.value) || 0 })}
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:outline-none focus:ring-2 transition-colors",
              gaugeValidation.isValid
                ? "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                : "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            )}
          />
          {!gaugeValidation.isValid && (
            <p className="mt-1 text-xs text-red-500">{gaugeValidation.message}</p>
          )}
        </div>

        {/* Width */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-emerald-700">
            <span>Width (in)</span>
            <span className="normal-case text-zinc-400">
              {constraints.width.min}" - {constraints.width.max}"
            </span>
          </label>
          <input
            type="number"
            min={constraints.width.min}
            max={constraints.width.max}
            step={0.1}
            value={line.width}
            onChange={(e) => onUpdate(index, { width: Number(e.target.value) || 0 })}
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:outline-none focus:ring-2 transition-colors",
              widthValidation.isValid
                ? "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                : "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            )}
          />
          {!widthValidation.isValid && (
            <p className="mt-1 text-xs text-red-500">{widthValidation.message}</p>
          )}
        </div>

        {/* Length */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-emerald-700">
            <span>Length (in)</span>
            <span className="normal-case text-zinc-400">
              {constraints.length.min}" - {constraints.length.max}"
            </span>
          </label>
          <input
            type="number"
            min={constraints.length.min}
            max={constraints.length.max}
            step={0.1}
            value={line.length}
            onChange={(e) => onUpdate(index, { length: Number(e.target.value) || 0 })}
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:outline-none focus:ring-2 transition-colors",
              lengthValidation.isValid
                ? "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                : "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            )}
          />
          {!lengthValidation.isValid && (
            <p className="mt-1 text-xs text-red-500">{lengthValidation.message}</p>
          )}
        </div>

        {/* Sheets */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-emerald-700">
            # of Sheets
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={line.sheets}
            onChange={(e) => onUpdate(index, { sheets: Number(e.target.value) || 1 })}
            className={cn(
              "w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              "transition-colors"
            )}
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-emerald-700">
            Description (optional)
          </label>
          <input
            type="text"
            value={line.description || ""}
            onChange={(e) => onUpdate(index, { description: e.target.value })}
            placeholder="Custom description..."
            className={cn(
              "w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-900",
              "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              "transition-colors placeholder:text-zinc-400"
            )}
          />
        </div>
      </div>

      {/* Weight Info */}
      <div className={cn(
        "mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-3 py-2 text-xs",
        weightInfo.meetsMinimum ? "bg-emerald-100/50 text-emerald-700" : "bg-amber-100/50 text-amber-700"
      )}>
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
          </svg>
          <span>
            {weightInfo.weightPerSheet.toFixed(2)} lbs/sheet
          </span>
        </div>
        <span className="text-zinc-400">|</span>
        <span>
          Total: {weightInfo.totalWeight.toFixed(0)} lbs
        </span>
        {!weightInfo.meetsMinimum && (
          <>
            <span className="text-zinc-400">|</span>
            <span className="font-medium">
              Min {MINIMUM_WEIGHT_LBS.toLocaleString()} lbs required (need {weightInfo.sheetsNeeded} sheets)
            </span>
          </>
        )}
      </div>
    </div>
  );
}
