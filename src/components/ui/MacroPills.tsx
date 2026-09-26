import type { Targets } from "@/lib/nutrition";

const PILLS = [
  { key: "kcal", label: "kcal", cls: "bg-amber/15 text-amber" },
  { key: "protein", label: "P", unit: "g", cls: "bg-emerald/15 text-emerald" },
  { key: "carbs", label: "C", unit: "g", cls: "bg-sky-400/15 text-sky-300" },
  { key: "fat", label: "F", unit: "g", cls: "bg-rose-400/15 text-rose-300" },
] as const;

export function MacroPills({ m, size = "sm" }: { m: Targets; size?: "sm" | "lg" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PILLS.map((p) => (
        <span key={p.key} className={`rounded-full font-mono tabular ${p.cls} ${size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]"}`}>
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
        <span className="text-slate-400">{label}</span>
        <span className={`font-mono tabular ${over ? "text-rose-300" : "text-slate-300"}`}>
          {value}
          <span className="text-slate-500"> / {target}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: over ? "#fb7185" : color }} />
      </div>
    </div>
  );
}
