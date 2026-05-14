"use client";

import { useState, useMemo, useTransition } from "react";
import { X, TrendingUp, Award, RotateCcw, ChevronRight } from "lucide-react";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { PageHeader } from "@/components/layout/PageHeader";
import type { CapilarDashboardData, CapilarSale } from "@/types/crm";

function formatDop(n: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);
}

function inRange(dateStr: string, from: string, to: string) {
  if (!dateStr) return false;
  return dateStr >= from && dateStr <= to;
}

const defaultRange: DateRange = { from: "2000-01-01", to: "2099-12-31" };

// ── Drill-down panel ─────────────────────────────────────────────
function DrillDown({
  promotor,
  sales,
  config,
  range,
  onClose,
}: {
  promotor: string;
  sales: CapilarSale[];
  config: CapilarDashboardData["config"];
  range: DateRange;
  onClose: () => void;
}) {
  const myRange = sales.filter((s) =>
    inRange(s.fechaRegistro || s.fechaEntrega, range.from, range.to)
  );

  // Day breakdown
  const byDay = useMemo(() => {
    const map = new Map<string, { ventas: number; monto: number }>();
    for (const s of myRange) {
      const key = s.fechaRegistro || s.fechaEntrega || "Sin fecha";
      const cur = map.get(key) ?? { ventas: 0, monto: 0 };
      cur.ventas += 1;
      cur.monto += s.totalVenta;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10); // last 10 days
  }, [myRange]);

  const totalVenta = myRange.reduce((s, r) => s + r.totalVenta, 0);
  const totalAbonado = myRange.reduce((s, r) => s + r.totalAbonado, 0);
  const cashSales = myRange.filter((s) => !s.pagosPendientes || s.montoRestante <= 0);
  const devoluciones = myRange.filter((s) => s.estadoCobro?.toLowerCase().includes("devoluci")).length;

  const comisionVenta = totalVenta * config.comisionVentaPorcentaje;
  const comisionCobro = totalAbonado * config.comisionCobroPorcentaje;
  const bonos = cashSales.length * config.bonoVentaContado;
  const totalPagar = comisionVenta + comisionCobro + bonos;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto
                      border-l border-crm-line bg-crm-bg2 shadow-2xl
                      animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-crm-line bg-crm-bg2 px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-crm-faint">Drill-Down</p>
          <h2 className="text-base font-bold text-crm-text">{promotor}</h2>
        </div>
        <button
          type="button"
          aria-label="Cerrar panel"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-crm-line
                     text-crm-faint hover:bg-crm-surface hover:text-crm-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 p-5">
        {/* Date context */}
        <p className="text-xs text-crm-faint">
          Período: {range.from === "2000-01-01" ? "Todo el tiempo" : `${range.from} → ${range.to}`}
        </p>

        {/* Commission cards */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Comisión Venta" value={formatDop(comisionVenta)} color="text-crm-gold" />
          <InfoCard label="Comisión Cobro" value={formatDop(comisionCobro)} color="text-crm-green" />
          <InfoCard label="Bonos Contado" value={formatDop(bonos)} color="text-crm-amber" />
          <InfoCard label="Devoluciones" value={String(devoluciones)} color="text-red-400" />
        </div>

        {/* Total a pagar */}
        <div className="flex items-center justify-between rounded-xl bg-crm-gold/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-crm-gold" />
            <span className="text-sm font-semibold text-crm-text">Total a Pagar</span>
          </div>
          <span className="text-xl font-black text-crm-gold">{formatDop(totalPagar)}</span>
        </div>

        {/* Sales volume */}
        <div className="flex gap-3">
          <StatChip icon={<TrendingUp className="h-3.5 w-3.5" />} label={`${myRange.length} ventas`} />
          <StatChip icon={<RotateCcw className="h-3.5 w-3.5" />} label={`${cashSales.length} contado`} />
        </div>

        {/* Daily breakdown */}
        {byDay.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-crm-faint">
              Actividad por Día (últimos 10)
            </p>
            <div className="space-y-1.5">
              {byDay.map(([day, stats]) => {
                const maxMonto = Math.max(...byDay.map(([, s]) => s.monto));
                const pct = maxMonto > 0 ? (stats.monto / maxMonto) * 100 : 0;
                return (
                  <div key={day} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-crm-faint">{day}</span>
                      <span className="font-semibold text-crm-text">
                        {stats.ventas}v · {formatDop(stats.monto)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-crm-surface2">
                      <div
                        className="h-full rounded-full bg-crm-gold transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual sales list */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-crm-faint">
            Ventas ({myRange.length})
          </p>
          <div className="space-y-1">
            {myRange.map((s) => (
              <div
                key={s.ventaId}
                className="flex items-center justify-between rounded-lg border border-crm-line bg-crm-surface/60 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-crm-text">{s.nombreCliente}</p>
                  <p className="text-[10px] text-crm-faint">{s.fechaEntrega} · {s.lineaVendida}</p>
                </div>
                <span className={`ml-2 text-xs font-bold ${s.montoRestante <= 0 ? "text-crm-green" : "text-crm-amber"}`}>
                  {formatDop(s.totalVenta)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Sub-components ───────────────────────────────────────────────
function InfoCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-crm-line bg-crm-surface p-3 space-y-1">
      <p className="text-[10px] text-crm-faint">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-crm-line bg-crm-surface px-3 py-1.5 text-xs font-medium text-crm-muted">
      {icon}{label}
    </div>
  );
}

// ── Main AdminClient ─────────────────────────────────────────────
export function AdminClient({ data }: { data: CapilarDashboardData }) {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [drillPromotor, setDrillPromotor] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleRange = (r: DateRange) => startTransition(() => setRange(r));

  const filteredSales = useMemo(
    () => data.sales.filter((s) => inRange(s.fechaRegistro || s.fechaEntrega, range.from, range.to)),
    [data.sales, range]
  );

  const totalVentas = filteredSales.reduce((s, r) => s + r.totalVenta, 0);
  const totalAbonado = filteredSales.reduce((s, r) => s + r.totalAbonado, 0);
  const saldoPendiente = filteredSales.reduce((s, r) => s + r.montoRestante, 0);

  // Group by promotor for summary
  const promotores = useMemo(() => {
    const map = new Map<string, { ventas: number; totalVenta: number; saldo: number }>();
    for (const s of filteredSales) {
      const k = s.promotor || "Sin promotor";
      const cur = map.get(k) ?? { ventas: 0, totalVenta: 0, saldo: 0 };
      cur.ventas += 1;
      cur.totalVenta += s.totalVenta;
      cur.saldo += s.montoRestante;
      map.set(k, cur);
    }
    return Array.from(map.entries()).sort(([, a], [, b]) => b.totalVenta - a.totalVenta);
  }, [filteredSales]);

  const drillSales = drillPromotor
    ? data.sales.filter((s) => s.promotor === drillPromotor)
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Admin — Modo Dios"
          subtitle="Vista granular con drill-down por promotor. Haz clic en un promotor para el desglose."
        />
        <DateRangePicker value={range} onChange={handleRange} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Ventas Período", value: formatDop(totalVentas), color: "text-crm-text" },
          { label: "Total Abonado", value: formatDop(totalAbonado), color: "text-crm-green" },
          { label: "Saldo Pendiente", value: formatDop(saldoPendiente), color: "text-crm-gold" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-crm-line bg-crm-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-crm-faint">{k.label}</p>
            <p className={`mt-1 text-2xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Promotor summary table (desktop-first) */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-crm-faint">
          Promotores — Haz clic para Drill-Down
        </p>
        <div className="overflow-hidden rounded-xl border border-crm-line bg-crm-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-crm-line bg-crm-surface2 text-xs uppercase text-crm-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Promotor</th>
                  <th className="px-4 py-3 text-right font-medium">Ventas</th>
                  <th className="px-4 py-3 text-right font-medium">Total Venta</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo</th>
                  <th className="px-4 py-3 text-right font-medium">Comisión</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-line">
                {promotores.map(([name, stats]) => {
                  const comision = stats.totalVenta * data.config.comisionVentaPorcentaje;
                  return (
                    <tr
                      key={name}
                      className="cursor-pointer transition-colors hover:bg-crm-bg2"
                      onClick={() => setDrillPromotor(name)}
                    >
                      <td className="px-4 py-3 font-semibold text-crm-text">{name}</td>
                      <td className="px-4 py-3 text-right text-crm-muted">{stats.ventas}</td>
                      <td className="px-4 py-3 text-right font-semibold text-crm-gold">
                        {formatDop(stats.totalVenta)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${stats.saldo > 0 ? "text-crm-amber" : "text-crm-green"}`}>
                        {formatDop(stats.saldo)}
                      </td>
                      <td className="px-4 py-3 text-right text-crm-green">
                        {formatDop(comision)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-crm-faint" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Master sales table */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-crm-faint">
          Todas las Ventas ({filteredSales.length})
        </p>
        <div className="overflow-hidden rounded-xl border border-crm-line bg-crm-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-crm-line bg-crm-surface2 text-xs uppercase text-crm-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Venta</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Línea</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo</th>
                  <th className="px-4 py-3 font-medium">Promotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-line">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.ventaId}
                    className="cursor-pointer hover:bg-crm-bg2"
                    onClick={() => setDrillPromotor(sale.promotor)}
                  >
                    <td className="px-4 py-3 text-crm-faint">
                      {sale.ventaId}
                      <div className="text-xs">{sale.fechaEntrega}</div>
                    </td>
                    <td className="px-4 py-3 text-crm-text">
                      {sale.nombreCliente}
                      <div className="text-xs text-crm-faint">{sale.whatsapp}</div>
                    </td>
                    <td className="px-4 py-3 text-crm-muted">
                      {sale.familiaProducto}
                      <div className="text-xs text-crm-faint">{sale.provincia}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-crm-gold">
                      {formatDop(sale.totalVenta)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        sale.montoRestante <= 0
                          ? "bg-crm-green/15 text-crm-green"
                          : "bg-crm-amber/15 text-crm-amber"
                      }`}>
                        {formatDop(sale.montoRestante)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-crm-muted">{sale.promotor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drill-down overlay */}
      {drillPromotor && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrillPromotor(null)}
            aria-hidden="true"
          />
          <DrillDown
            promotor={drillPromotor}
            sales={drillSales}
            config={data.config}
            range={range}
            onClose={() => setDrillPromotor(null)}
          />
        </>
      )}
    </div>
  );
}
