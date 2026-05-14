"use client";

import { useState, useCallback } from "react";
import { Calendar, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateRange = {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
};

type Shortcut = { label: string; range: () => DateRange };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const SHORTCUTS: Shortcut[] = [
  {
    label: "Hoy",
    range: () => ({ from: todayStr(), to: todayStr() }),
  },
  {
    label: "Esta Semana",
    range: () => {
      const now = new Date();
      const day = now.getDay();
      const monday = addDays(now, -((day + 6) % 7));
      const sunday = addDays(monday, 6);
      return {
        from: monday.toISOString().slice(0, 10),
        to: sunday.toISOString().slice(0, 10),
      };
    },
  },
  {
    label: "Este Mes",
    range: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      };
    },
  },
  {
    label: "Este Año",
    range: () => {
      const y = new Date().getFullYear();
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    },
  },
  { label: "Todo", range: () => ({ from: "2000-01-01", to: "2099-12-31" }) },
];

type Props = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
};

export function DateRangePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);

  const apply = useCallback(
    (range: DateRange) => {
      onChange(range);
      setOpen(false);
      setCustom(false);
    },
    [onChange]
  );

  const isToday =
    value.from === todayStr() && value.to === todayStr();

  const label = isToday
    ? "Hoy"
    : value.from === "2000-01-01"
    ? "Todo"
    : `${value.from} → ${value.to}`;

  return (
    <div className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        aria-label="Seleccionar rango de fechas"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] items-center gap-2 rounded-lg border border-crm-line
                   bg-crm-surface px-4 py-2 text-sm font-medium text-crm-text
                   transition-colors hover:bg-crm-surface2"
      >
        <Calendar className="h-4 w-4 text-crm-gold" aria-hidden="true" />
        <span>{label}</span>
        <ChevronRight className={cn("h-3 w-3 text-crm-faint transition-transform", open && "rotate-90")} />
      </button>

      {/* Desktop Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-12 z-50 hidden w-72 rounded-xl border border-crm-line
                     bg-crm-bg2 p-4 shadow-2xl md:block"
        >
          <DatePickerContent
            value={value}
            custom={custom}
            onShortcut={apply}
            onCustomToggle={() => setCustom((c) => !c)}
            onCustomApply={apply}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      {/* Mobile Bottom Sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative w-full rounded-t-2xl border-t border-crm-line bg-crm-bg2 p-6 shadow-2xl
                       animate-in slide-in-from-bottom duration-300"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-crm-line" />
            <DatePickerContent
              value={value}
              custom={custom}
              onShortcut={apply}
              onCustomToggle={() => setCustom((c) => !c)}
              onCustomApply={apply}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Internal Content ─────────────────────────────────────────────
function DatePickerContent({
  value,
  custom,
  onShortcut,
  onCustomToggle,
  onCustomApply,
  onClose,
}: {
  value: DateRange;
  custom: boolean;
  onShortcut: (r: DateRange) => void;
  onCustomToggle: () => void;
  onCustomApply: (r: DateRange) => void;
  onClose: () => void;
}) {
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-crm-text">Filtrar por Fecha</h3>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="rounded-md p-1 text-crm-faint hover:text-crm-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-3 gap-2">
        {SHORTCUTS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onShortcut(s.range())}
            className="rounded-lg border border-crm-line bg-crm-surface px-3 py-2 text-xs
                       font-medium text-crm-muted transition-colors min-h-[44px]
                       hover:border-crm-gold hover:text-crm-gold"
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onCustomToggle}
          className={cn(
            "col-span-3 rounded-lg border border-crm-line bg-crm-surface px-3 py-2 text-xs min-h-[44px]",
            "font-medium transition-colors hover:border-crm-gold hover:text-crm-gold",
            custom ? "border-crm-gold text-crm-gold" : "text-crm-muted"
          )}
        >
          Rango Específico
        </button>
      </div>

      {/* Custom range inputs */}
      {custom && (
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-crm-faint">
                Desde
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-crm-line bg-crm-surface px-3 py-2
                           text-sm text-crm-text outline-none focus:border-crm-gold"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-crm-faint">
                Hasta
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-crm-line bg-crm-surface px-3 py-2
                           text-sm text-crm-text outline-none focus:border-crm-gold"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!from || !to}
            onClick={() => from && to && onCustomApply({ from, to })}
            className="w-full min-h-[44px] rounded-lg bg-crm-gold px-4 py-2.5 text-sm font-semibold
                       text-crm-bg transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            Aplicar Rango
          </button>
        </div>
      )}
    </div>
  );
}
