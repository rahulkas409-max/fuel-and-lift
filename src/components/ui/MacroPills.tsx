import type { Targets } from "@/lib/nutrition";

const PILLS = [
  { key: "kcal", label: "kcal", cls: "bg-card-2 text-ink" },
  { key: "protein", label: "P", unit: "g", cls: "bg-fit-green-soft text-fit-green" },
  { key: "carbs", label: "C", unit: "g", cls: "bg-fit-blue-soft text-fit-blue" },
  { key: "fat", label: "F", unit: "g", cls: "bg-fit-yellow-soft text-fit-yellow" },
] as const;

export function MacroPills({ m, size = "sm" }: { m: Targets; size?: "sm" | "lg" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PILLS.map((p) => (
        <span key={p.key} className={`rounded-full font-medium tabular ${p.cls} ${size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]"}`}>
          {p.key === "kcal" ? `${m.kcal} kcal` : `${p.label} ${m[p.key]}${"unit" in p ? p.unit : ""}`}
        </span>
      ))}
    </div>
  );
}

export function MacroBar({ label, value, target, color, overIsBad = true }: { label: string; value: number; target: number; color: string; overIsBad?: boolean }) {
  const pct = Math.min(100, (value / Math.max(target, 1)) * 100);
  const over = overIsBad && value > target * 1.1;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink-2">{label}</span>
        <span className={`font-mono tabular ${over ? "text-fit-red" : "text-ink-2"}`}>
          {value}
          <span className="text-ink-3"> / {target}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-card-2 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: over ? "var(--fit-red)" : color }} />
      </div>
    </div>
  );
}
