"use client";

import { useState, useMemo, useTransition } from "react";
import { MapPin, Navigation, Truck, Package } from "lucide-react";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { SkeletonList } from "@/components/ui/SkeletonLoaders";
import { PageHeader } from "@/components/layout/PageHeader";
import type { CapilarDashboardData } from "@/types/crm";

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

export function ChoferClient({ data }: { data: CapilarDashboardData }) {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [isPending, startTransition] = useTransition();

  const handleRange = (r: DateRange) => startTransition(() => setRange(r));

  const deliveries = useMemo(
    () =>
      data.sales
        .filter((s) => inRange(s.fechaEntrega, range.from, range.to))
        .sort((a, b) => {
          const da = `${a.fechaEntrega}-${a.provincia}`;
          const db = `${b.fechaEntrega}-${b.provincia}`;
          return da.localeCompare(db);
        }),
    [data.sales, range]
  );

  // Group by date for visual separation
  const byDate = useMemo(() => {
    const map = new Map<string, typeof deliveries>();
    for (const d of deliveries) {
      const key = d.fechaEntrega || "Sin fecha";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [deliveries]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Rutas y Entregas"
          subtitle="Toca la dirección para abrir el GPS. Organizado por fecha y zona."
        />
        <DateRangePicker value={range} onChange={handleRange} />
      </div>

      {/* Summary badge */}
      <div className="flex items-center gap-3 rounded-xl border border-crm-line bg-crm-surface px-4 py-3">
        <Truck className="h-5 w-5 text-crm-gold" />
        <span className="text-sm font-medium text-crm-text">
          {deliveries.length} entregas en el período
        </span>
      </div>

      {/* Delivery cards */}
      {isPending ? (
        <SkeletonList count={5} />
      ) : (
        <div className="space-y-6">
          {byDate.length === 0 && (
            <p className="py-10 text-center text-sm text-crm-faint">No hay entregas en el período seleccionado.</p>
          )}
          {byDate.map(([date, items]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-crm-line" />
                <span className="rounded-full border border-crm-line bg-crm-surface px-3 py-1 text-xs font-semibold text-crm-gold">
                  {date}
                </span>
                <div className="h-px flex-1 bg-crm-line" />
              </div>

              {/* Cards for this date */}
              <div className="space-y-3">
                {items.map((sale) => {
                  const gpsUrl = `https://maps.google.com/?q=${encodeURIComponent(
                    [sale.direccion, sale.provincia].filter(Boolean).join(", ")
                  )}`;
                  const paid = sale.montoRestante <= 0;

                  return (
                    <div key={sale.ventaId} className={glassCard}>
                      {/* Client row */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-crm-surface3 text-xs font-bold text-crm-gold">
                          {sale.nombreCliente.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-crm-text truncate">{sale.nombreCliente}</p>
                          <p className="text-xs text-crm-faint">{sale.provincia}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-crm-gold" />
                          <span className="text-xs font-medium text-crm-gold">{sale.familiaProducto}</span>
                        </div>
                      </div>

                      {/* GPS button — GIANT tap target */}
                      {sale.direccion ? (
                        <a
                          href={gpsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Abrir GPS para ${sale.nombreCliente}`}
                          className="flex w-full items-center gap-3 rounded-xl
                                     bg-gradient-to-r from-blue-600 to-blue-500
                                     px-4 py-3.5 text-sm font-semibold text-white
                                     shadow-lg shadow-blue-600/30
                                     transition-transform active:scale-[0.98] hover:from-blue-500 hover:to-blue-400
                                     min-h-[52px]"
                        >
                          <Navigation className="h-5 w-5 shrink-0" />
                          <span className="flex-1 text-left leading-tight">
                            {sale.direccion}
                          </span>
                          <MapPin className="h-4 w-4 shrink-0 opacity-70" />
                        </a>
                      ) : (
                        <div className="rounded-xl border border-dashed border-crm-line px-4 py-3 text-xs text-crm-faint">
                          Sin dirección registrada
                        </div>
                      )}

                      {/* Saldo pill */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-crm-faint">Saldo pendiente</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          paid ? "bg-crm-green/15 text-crm-green" : "bg-crm-amber/15 text-crm-amber"
                        }`}>
                          {paid ? "✓ Pagado" : formatDop(sale.montoRestante)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
