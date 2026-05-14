# Configuracion de Lectura: Google Sheets API

El panel usa `googleapis` para leer estas pestañas:

- `Inventario_Productos`
- `Directorio_Clientes`
- `Ventas_y_Entregas`
- `Cuentas_por_Cobrar`

Variables necesarias en `.env.local`:

```env
SPREADSHEET_ID="id-del-sheet"
GOOGLE_CLIENT_EMAIL="service-account@proyecto.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="private-key-con-saltos-escapados"
```

Importante: el Google Sheet `Luma Route OS - DB Capilar` debe estar compartido
como lector o editor con el correo de la service account. Si no hay permiso, el
panel usa los CSVs locales en `data/luma_route_os` para mantener la validacion
local funcionando.
