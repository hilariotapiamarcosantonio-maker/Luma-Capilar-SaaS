import Link from "next/link";
import { DollarSign, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { brand } from "@/lib/brand";
import { formatDop, getCapilarData } from "@/lib/crm-data/get-capilar-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const data = await getCapilarData();
  const recentSales = data.sales.slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title={brand.productName}
        subtitle="Base operativa de rutas capilares, lineas vendidas, entregas y cuentas por cobrar."
      />

      <Badge
        variant="outline"
        className="border-crm-gold/30 bg-crm-gold/10 text-crm-gold"
      >
        by {brand.parentBrand} - Workspace {brand.workspaceName} -{" "}
        {data.source === "google-sheets" ? "Google Sheets" : "Fallback local"}
      </Badge>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin" className="block">
          <Card className="border-crm-line bg-crm-surface transition-colors hover:border-crm-gold/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-crm-muted">
                VENTAS CONSOLIDADAS
              </CardTitle>
              <DollarSign className="h-4 w-4 text-crm-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crm-text">
                {formatDop(data.totalVentas)}
              </div>
              <p className="mt-1 text-xs text-crm-faint">
                {data.ventasRegistradas} ventas registradas
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/cobrador" className="block">
          <Card className="border-crm-line bg-crm-surface transition-colors hover:border-crm-gold/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-crm-muted">
                SALDO PENDIENTE
              </CardTitle>
              <DollarSign className="h-4 w-4 text-crm-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crm-text">
                {formatDop(data.saldoPendiente)}
              </div>
              <p className="mt-1 text-xs text-crm-faint">
                {data.cuentasPorCobrar} cuentas abiertas
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/promotor" className="block">
          <Card className="border-crm-line bg-crm-surface transition-colors hover:border-crm-gold/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-crm-muted">
                CLIENTES
              </CardTitle>
              <Users className="h-4 w-4 text-crm-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crm-text">
                {data.clientesActivos}
              </div>
              <p className="mt-1 text-xs text-crm-faint">Directorio capilar</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/chofer" className="block">
          <Card className="border-crm-line bg-crm-surface transition-colors hover:border-crm-gold/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-crm-muted">
                LINEAS VENDIDAS
              </CardTitle>
              <Package className="h-4 w-4 text-crm-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crm-gold">
                {data.lineasVendidas}
              </div>
              <p className="mt-1 text-xs text-crm-faint">
                Coco, Cacao, Jengibre y mas
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-crm-line bg-crm-surface">
          <CardHeader>
            <CardTitle className="text-base text-crm-text">
              Lineas por Volumen
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <FunnelChart data={data.byLinea} />
          </CardContent>
        </Card>

        <Card className="border-crm-line bg-crm-surface">
          <CardHeader>
            <CardTitle className="text-base text-crm-text">
              Ultimas Ventas y Entregas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-crm-line bg-crm-surface2 text-xs uppercase text-crm-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">
                      Precio por Linea
                    </th>
                    <th className="px-4 py-3 font-medium">Promotor</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Estatus
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-crm-line">
                  {recentSales.map((sale) => (
                    <tr
                      key={sale.ventaId}
                      className="transition-colors hover:bg-crm-bg2"
                    >
                      <td className="px-4 py-3 text-crm-faint">
                        {sale.fechaEntrega || sale.fechaRegistro}
                      </td>
                      <td className="px-4 py-3 font-medium text-crm-text">
                        {sale.nombreCliente}
                        <div className="text-xs text-crm-faint">
                          {sale.provincia}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-crm-gold">
                        {formatDop(sale.totalVenta)}
                        <div className="text-xs text-crm-faint">
                          {sale.familiaProducto}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-crm-muted">
                        {sale.promotor}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant="outline"
                          className={
                            sale.montoRestante <= 0
                              ? "border-crm-green text-crm-green"
                              : "border-crm-amber text-crm-amber"
                          }
                        >
                          {sale.montoRestante <= 0 ? "Pagada" : "Pendiente"}
                        </Badge>
                        {sale.montoRestante > 0 ? (
                          <div className="mt-1 text-xs text-crm-faint">
                            Saldo {formatDop(sale.montoRestante)}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {recentSales.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-crm-faint"
                      >
                        No hay ventas cargadas.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-crm-line bg-crm-surface">
          <CardHeader>
            <CardTitle className="text-base text-crm-text">
              Promotores Principales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byPromotor.slice(0, 6).map((item) => (
              <div
                key={item.promotor}
                className="flex items-center justify-between border-b border-crm-line pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-crm-text">{item.promotor}</p>
                  <p className="text-xs text-crm-faint">{item.ventas} ventas</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-crm-gold">
                    {formatDop(item.totalVenta)}
                  </p>
                  <p className="text-xs text-crm-faint">
                    Saldo {formatDop(item.saldoPendiente)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-crm-line bg-crm-surface">
          <CardHeader>
            <CardTitle className="text-base text-crm-text">
              Accesos Operativos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin"
              className="rounded-md border border-crm-line bg-crm-surface2 p-4 text-sm font-medium text-crm-text hover:border-crm-gold/60"
            >
              Admin - Ventas_y_Entregas
            </Link>
            <Link
              href="/promotor"
              className="rounded-md border border-crm-line bg-crm-surface2 p-4 text-sm font-medium text-crm-text hover:border-crm-gold/60"
            >
              Promotor - Directorio_Clientes
            </Link>
            <Link
              href="/chofer"
              className="rounded-md border border-crm-line bg-crm-surface2 p-4 text-sm font-medium text-crm-text hover:border-crm-gold/60"
            >
              Chofer - Rutas de entrega
            </Link>
            <Link
              href="/cobrador"
              className="rounded-md border border-crm-line bg-crm-surface2 p-4 text-sm font-medium text-crm-text hover:border-crm-gold/60"
            >
              Cobrador - Cuentas_por_Cobrar
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
