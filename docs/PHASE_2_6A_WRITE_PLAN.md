# Write Plan

The next safe write path is to append controlled operational rows to
`Ventas_y_Entregas` and derive collection work from `Cuentas_por_Cobrar`.

Recommended write sequence:

- Validate cliente, whatsapp, provincia, linea, total venta, abono, saldo, and promotor.
- Append the sale into `Ventas_y_Entregas`.
- Recompute or append the related row in `Cuentas_por_Cobrar` when saldo is greater than zero.
- Keep source and audit columns populated for every write.
