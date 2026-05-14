"use client";

import { useState, useMemo, useTransition } from "react";
import { MessageCircle, Banknote, TrendingUp, Clock } from "lucide-react";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { SkeletonList, SkeletonMetric } from "@/components/ui/SkeletonLoaders";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRouter } from "next/navigation";
import type { CapilarDashboardData, CapilarReceivable } from "@/types/crm";

function formatDop(n: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);
}

function inRange(dateStr: string, from: string, to: string) {
  if (!dateStr) return false;
  return dateStr >= from && dateStr <= to;
}

const defaultRange: DateRange = { from: "2000-01-01", to: "2099-12-31" };

const glassCard = [
  "relative overflow-hidden rounded-2xl border border-white/10",
  "bg-gradient-to-br from-[#111820]/90 to-[#0d1520]/90",
  "backdrop-blur-sm shadow-xl p-5 space-y-3",
].join(" ");

export function CobradorClient({ data }: { data: CapilarDashboardData }) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [isPending, startTransition] = useTransition();

  const [activeItem, setActiveItem] = useState<CapilarReceivable | null>(null);
  const [abonoAmount, setAbonoAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRange = (r: DateRange) => startTransition(() => setRange(r));

  const filtered = useMemo(
    () => data.receivables.filter((r) => inRange(r.fechaCobro || r.fechaEntrega, range.from, range.to)),
    [data.receivables, range]
  );

  const totalRecaudado = useMemo(
    () => filtered.reduce((sum, r) => sum + r.totalAbonado, 0),
    [filtered]
  );

  const misComisiones = useMemo(
    () => totalRecaudado * data.config.comisionCobroPorcentaje,
    [totalRecaudado, data.config]
  );

  const pendienteTotal = useMemo(
    () => filtered.reduce((sum, r) => sum + r.saldoPendiente, 0),
    [filtered]
  );

  const handleAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !abonoAmount) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/receivables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cxc_id: activeItem.cxcId,
          abono: Number(abonoAmount),
        }),
      });
      if (res.ok) {
        setActiveItem(null);
        setAbonoAmount("");
        router.refresh();
      } else {
        alert("Error al registrar abono");
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
          title="Panel Cobrador"
          subtitle="Cuentas por cobrar con métricas reactivas al filtro de fechas."
        />
        <DateRangePicker value={range} onChange={handleRange} />
      </div>

      {/* Metrics row */}
      {isPending ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SkeletonMetric /><SkeletonMetric /><SkeletonMetric />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            icon={<Banknote className="h-5 w-5 text-crm-green" />}
            label="Total Recaudado"
            value={formatDop(totalRecaudado)}
            color="text-crm-green"
            sub={`${filtered.length} cobros en período`}
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5 text-crm-gold" />}
            label="Mis Comisiones"
            value={formatDop(misComisiones)}
            color="text-crm-gold"
            sub={`${(data.config.comisionCobroPorcentaje * 100).toFixed(0)}% sobre cobros`}
          />
          <MetricCard
            icon={<Clock className="h-5 w-5 text-crm-amber" />}
            label="Pendiente Total"
            value={formatDop(pendienteTotal)}
            color="text-crm-amber"
            sub="Saldo aún sin cobrar"
          />
        </div>
      )}

      {/* Receivable Cards */}
      {isPending ? (
        <SkeletonList count={4} />
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-crm-faint">No hay cobros en el período seleccionado.</p>
          )}
          {filtered.map((item) => (
            <div key={item.cxcId} className={glassCard}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-crm-text">{item.nombreCliente}</p>
                  <p className="text-xs text-crm-faint">{item.lineaVendida} · {item.provincia}</p>
                  <p className="mt-1 text-xs text-crm-muted">
                    Cobro: <span className="text-crm-text">{item.fechaCobro || "Sin fecha"}</span>
                    {" · "}Promotor: <span className="text-crm-text">{item.promotor}</span>
                  </p>
                </div>
                {item.whatsapp && (
                  <a
                    href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${item.nombreCliente}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                               bg-green-500 text-white shadow-lg shadow-green-500/30
                               transition-transform active:scale-95 hover:bg-green-400"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
              </div>

              {/* Amount pills & Action */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2 flex-wrap">
                  <Pill label="Abonado" value={formatDop(item.totalAbonado)} color="bg-crm-green/10 text-crm-green" />
                  <Pill label="Saldo" value={formatDop(item.saldoPendiente)} color={item.saldoPendiente > 0 ? "bg-crm-amber/10 text-crm-amber" : "bg-crm-green/10 text-crm-green"} />
                </div>
                {item.saldoPendiente > 0 && (
                  <button
                    onClick={() => setActiveItem(item)}
                    className="rounded-lg bg-crm-gold/10 px-3 py-1.5 text-xs font-bold text-crm-gold transition-colors hover:bg-crm-gold/20"
                  >
                    Registrar Abono
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Abono Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-crm-surface2 p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-crm-text">Registrar Abono</h3>
            <p className="mb-4 text-sm text-crm-faint">Cliente: <span className="font-medium text-crm-text">{activeItem.nombreCliente}</span></p>
            
            <form onSubmit={handleAbonoSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-crm-faint">Monto a abonar (RD$)</label>
                <input
                  required
                  type="number"
                  min="1"
                  max={activeItem.saldoPendiente}
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                  className="w-full rounded-lg border border-crm-line bg-crm-bg p-2.5 text-sm text-crm-text placeholder:text-crm-faint focus:border-crm-gold focus:outline-none"
                  placeholder={`Máximo: ${formatDop(activeItem.saldoPendiente)}`}
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
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

function MetricCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode; label: string; value: string; color: string; sub: string;
}) {
  return (
    <div className="rounded-2xl border border-crm-line bg-crm-surface p-5 space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide text-crm-faint">{label}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-crm-faint">{sub}</p>
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      <span className="text-current/60">{label}:</span> {value}
    </span>
  );
}
