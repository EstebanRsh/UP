import type { LucideIcon } from "lucide-react";

const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";

type Props = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  trend?: "up" | "down";
};

export default function KpiCard({
  title,
  value,
  icon: Icon,
  hint,
  trend,
}: Props) {
  return (
    <div
      className="rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      style={{ borderTopWidth: 4, borderTopColor: CEL }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {title}
          </div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, ${CEL}, ${CEL_DARK})`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {hint && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {trend === "up" && <span className="mr-1">▲</span>}
          {trend === "down" && <span className="mr-1">▼</span>}
          {hint}
        </div>
      )}
    </div>
  );
}
