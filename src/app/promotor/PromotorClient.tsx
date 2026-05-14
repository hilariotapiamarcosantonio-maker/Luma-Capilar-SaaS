"use client";

import { useState, useMemo, useTransition } from "react";
import { MessageCircle, TrendingUp, Award, Target } from "lucide-react";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { SkeletonList } from "@/components/ui/SkeletonLoaders";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRouter } from "next/navigation";
import type { CapilarDashboardData, CapilarSale } from "@/types/crm";

// ── Helpers ──────────────────────────────────────────────────────
function formatDop(n: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);
}

function inRange(dateStr: string, from: string, to: string) {
  if (!dateStr) return false;
  return dateStr >= from && dateStr <= to;
}

function isCashSale(sale: CapilarSale) {
  return !sale.pagosPendientes || sale.pagosPendientes.toLowerCase() === "no" || sale.montoRestante <= 0;
}


const defaultRange: DateRange = { from: "2000-01-01", to: "2099-12-31" };

// ── Glassmorphism card tokens ─────────────────────────────────────
const glassCard = [
  "relative overflow-hidden rounded-2xl border border-white/10",
  "bg-gradient-to-br from-[#111820]/90 to-[#0d1520]/90",
  "backdrop-blur-sm shadow-xl p-5 space-y-3",
].join(" ");

// ── Component ─────────────────────────────────────────────────────
export function PromotorClient({ data }: { data: CapilarDashboardData }) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre_cliente: "",
    promotor: "",
    total_venta: "",
    linea_vendida: "",
  });

  const handleRange = (r: DateRange) =>
    startTransition(() => setRange(r));

  // Filter sales by date range
  const filteredSales = useMemo(
    () => data.sales.filter((s) => inRange(s.fechaRegistro || s.fechaEntrega, range.from, range.to)),
    [data.sales, range]
  );

  // Group by promotor
  const byPromotor = useMemo(() => {
    const map = new Map<string, {
      promotor: string;
      ventas: number;
      totalVenta: number;
      totalAbonado: number;
      comisionVenta: number;
      comisionCobro: number;
      bonosContado: number;
      clientes: { nombre: string; whatsapp: string; linea: string; saldo: number; contado: boolean }[];
    }>();

    for (const s of filteredSales) {
      const key = s.promotor || "Sin promotor";
      const cur = map.get(key) ?? {
        promotor: key, ventas: 0, totalVenta: 0, totalAbonado: 0,
        comisionVenta: 0, comisionCobro: 0, bonosContado: 0, clientes: [],
      };
      const cash = isCashSale(s);
      cur.ventas += 1;
      cur.totalVenta += s.totalVenta;
      cur.totalAbonado += s.totalAbonado;
      cur.comisionVenta += s.totalVenta * data.config.comisionVentaPorcentaje;
      cur.comisionCobro += s.totalAbonado * data.config.comisionCobroPorcentaje;
      if (cash) cur.bonosContado += data.config.bonoVentaContado;
      cur.clientes.push({
        nombre: s.nombreCliente,
        whatsapp: s.whatsapp,
        linea: s.lineaVendida,
        saldo: s.montoRestante,
        contado: cash,
      });
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.totalVenta - a.totalVenta);
  }, [filteredSales, data.config]);

  // Weekly lines for progress bar (count of sales in current week)
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  })();
  const weekSales = useMemo(
    () => data.sales.filter((s) => (s.fechaRegistro || s.fechaEntrega) >= weekStart).length,
    [data.sales, weekStart]
  );
  const metaProgress = Math.min((weekSales / data.config.metaSemanalLineas) * 100, 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          total_venta: Number(formData.total_venta),
          monto_restante: Number(formData.total_venta), // Assuming it's fully pending
          total_abonado: 0,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ nombre_cliente: "", promotor: "", total_venta: "", linea_vendida: "" });
        router.refresh();
      } else {
        alert("Error al guardar");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Panel Promotores"
          subtitle="Comisiones, bonos y progreso hacia la meta semanal."
        />
        <DateRangePicker value={range} onChange={handleRange} />
      </div>

      {/* Hero: Weekly Progress */}
      <div className={glassCard}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crm-gold/15">
            <Target className="h-5 w-5 text-crm-gold" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-crm-faint">Meta Semanal</p>
            <p className="text-lg font-bold text-crm-text">
              {weekSales} / {data.config.metaSemanalLineas} líneas
            </p>
          </div>
          <span className="text-xl font-black text-crm-gold">{metaProgress.toFixed(0)}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-3 overflow-hidden rounded-full bg-crm-surface2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-crm-gold via-amber-400 to-yellow-300 transition-all duration-500"
            style={{ width: `${metaProgress}%` }}
          />
        </div>
        <p className="text-[11px] text-crm-faint">
          {metaProgress >= 100 ? "🎉 ¡Meta alcanzada esta semana!" : `Faltan ${data.config.metaSemanalLineas - weekSales} líneas para completar la meta`}
        </p>
      </div>

      {/* Promotor Cards */}
      {isPending ? (
        <SkeletonList count={3} />
      ) : (
        <div className="space-y-4">
          {byPromotor.map((p) => {
            const totalComision = p.comisionVenta + p.comisionCobro + p.bonosContado;
            return (
              <div key={p.promotor} className={glassCard}>
                {/* Promotor header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crm-surface3 text-sm font-bold text-crm-gold">
                      {p.promotor.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-crm-text">{p.promotor}</p>
                      <p className="text-xs text-crm-faint">{p.ventas} ventas · {range.from === "2000-01-01" ? "Todo" : `${range.from} → ${range.to}`}</p>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-crm-green" />
                </div>

                {/* Commission metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <MetricChip label="Comisión Venta" value={formatDop(p.comisionVenta)} color="text-crm-gold" />
                  <MetricChip label="Comisión Cobro" value={formatDop(p.comisionCobro)} color="text-crm-green" />
                  <MetricChip label="Bonos Contado" value={formatDop(p.bonosContado)} color="text-crm-amber" />
                </div>

                {/* Total commission highlight */}
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-crm-gold/10 to-amber-500/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-crm-gold" />
                    <span className="text-sm font-semibold text-crm-text">Total a Pagar</span>
                  </div>
                  <span className="text-lg font-black text-crm-gold">{formatDop(totalComision)}</span>
                </div>

                {/* Cliente cards */}
                <div className="space-y-2 pt-1">
                  {p.clientes.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-crm-line bg-crm-surface/60 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-crm-text">{c.nombre}</p>
                        <p className="text-xs text-crm-faint">{c.linea}</p>
                        {c.saldo > 0 && (
                          <p className="text-xs text-crm-amber">Saldo: {formatDop(c.saldo)}</p>
                        )}
                        {c.contado && (
                          <span className="mt-0.5 inline-block rounded-full bg-crm-green/15 px-2 py-0.5 text-[10px] font-semibold text-crm-green">
                            💰 Contado
                          </span>
                        )}
                      </div>
                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`WhatsApp ${c.nombre}`}
                          className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                                     bg-green-500 text-white shadow-lg shadow-green-500/30
                                     transition-transform active:scale-95 hover:bg-green-400"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-crm-gold text-crm-bg shadow-xl shadow-crm-gold/20 transition-transform active:scale-95"
        aria-label="Registrar Nueva Venta"
      >
        <span className="text-2xl font-light leading-none">+</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-crm-surface2 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-crm-text">Registrar Venta</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-crm-faint">Cliente</label>
                <input
                  required
                  type="text"
                  value={formData.nombre_cliente}
                  onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                  className="w-full rounded-lg border border-crm-line bg-crm-bg p-2.5 text-sm text-crm-text placeholder:text-crm-faint focus:border-crm-gold focus:outline-none"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-crm-faint">Línea/Producto</label>
                <input
                  type="text"
                  value={formData.linea_vendida}
                  onChange={(e) => setFormData({ ...formData, linea_vendida: e.target.value })}
                  className="w-full rounded-lg border border-crm-line bg-crm-bg p-2.5 text-sm text-crm-text placeholder:text-crm-faint focus:border-crm-gold focus:outline-none"
                  placeholder="Ej. Línea Cacao"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-crm-faint">Monto (RD$)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.total_venta}
                    onChange={(e) => setFormData({ ...formData, total_venta: e.target.value })}
                    className="w-full rounded-lg border border-crm-line bg-crm-bg p-2.5 text-sm text-crm-text placeholder:text-crm-faint focus:border-crm-gold focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-crm-faint">Promotor</label>
                  <select
                    required
                    value={formData.promotor}
                    onChange={(e) => setFormData({ ...formData, promotor: e.target.value })}
                    className="w-full rounded-lg border border-crm-line bg-crm-bg p-2.5 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  >
                    <option value="" disabled>Seleccione</option>
                    {byPromotor.map((p) => (
                      <option key={p.promotor} value={p.promotor}>{p.promotor}</option>
                    ))}
                    {byPromotor.length === 0 && <option value="Nuevo">Nuevo Promotor</option>}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-crm-faint hover:text-crm-text"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-crm-gold px-5 py-2 text-sm font-bold text-crm-bg transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-crm-line bg-crm-surface/60 px-3 py-2 text-center">
      <p className="text-[10px] font-medium text-crm-faint">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
