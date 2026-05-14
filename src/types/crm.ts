// ── Business Config (Pilar 1: Motor de Comisiones) ──────────────────────────
export interface BusinessConfig {
  comisionVentaPorcentaje: number;  // e.g. 0.05 = 5%
  comisionCobroPorcentaje: number;  // e.g. 0.03 = 3%
  bonoVentaContado: number;         // Fixed bonus per cash sale
  metaSemanalLineas: number;        // Weekly line target
}

export interface CapilarSale {
  ventaId: string;
  clienteId: string;
  fechaRegistro: string;
  fechaEntrega: string;
  fechaCobro: string;
  provincia: string;
  nombreCliente: string;
  whatsapp: string;
  direccion: string;
  cedula: string;
  lineaVendida: string;
  familiaProducto: string;
  otrosProductos: string;
  totalVenta: number;
  pagosPendientes: string;
  montoAbonado1: number;
  montoAbonado2: number;
  totalAbonado: number;
  montoRestante: number;
  estadoCobro: string;
  promotor: string;
  fuenteArchivo: string;
  fuenteHoja: string;
  filaOrigen: string;
  fuentesConsolidadas: string;
}

export interface CapilarClient {
  clienteId: string;
  nombreCliente: string;
  whatsapp: string;
  cedula: string;
  provincia: string;
  direccion: string;
  promotorPrincipal: string;
  primeraEntrega: string;
  ultimaEntrega: string;
  ventasRegistradas: number;
  totalCompras: number;
  totalAbonado: number;
  saldoPendiente: number;
  fuentes: string;
}

export interface CapilarProduct {
  productoId: string;
  nombreProducto: string;
  familiaProducto: string;
  lineaOriginal: string;
  precioReferencia: number;
  cantidadDisponible: string;
  ventasRegistradas: number;
  fuente: string;
  notas: string;
}

export interface CapilarReceivable {
  cxcId: string;
  ventaId: string;
  clienteId: string;
  nombreCliente: string;
  whatsapp: string;
  provincia: string;
  direccion: string;
  lineaVendida: string;
  fechaEntrega: string;
  fechaCobro: string;
  totalVenta: number;
  totalAbonado: number;
  saldoPendiente: number;
  pagosPendientes: string;
  estado: string;
  promotor: string;
  diasVencido: string;
  fuente: string;
}

export interface CapilarDashboardData {
  totalVentas: number;
  totalAbonado: number;
  saldoPendiente: number;
  clientesActivos: number;
  ventasRegistradas: number;
  cuentasPorCobrar: number;
  lineasVendidas: number;
  byLinea: { name: string; value: number; fill: string }[];
  byPromotor: {
    promotor: string;
    ventas: number;
    totalVenta: number;
    totalAbonado: number;
    saldoPendiente: number;
  }[];
  sales: CapilarSale[];
  clients: CapilarClient[];
  products: CapilarProduct[];
  receivables: CapilarReceivable[];
  source: "google-sheets" | "local-fallback";
  config: BusinessConfig;
}
