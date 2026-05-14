import { getSheetsClient } from "./google-sheets";

const SHEETS = {
  sales: "Ventas_y_Entregas",
  receivables: "Cuentas_por_Cobrar",
} as const;

export async function addSale(saleData: Record<string, string | number>) {
  const { sheets, spreadsheetId } = await getSheetsClient();
  if (!sheets || !spreadsheetId) throw new Error("Google Sheets not configured");

  // Get headers first to know the order
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEETS.sales}!A1:Z1`,
  });

  const headers = headerResponse.data.values?.[0] as string[];
  if (!headers) throw new Error("Could not read headers from sales sheet");

  const newRow = headers.map((header) => {
    const value = saleData[header];
    return value !== undefined ? value : "";
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEETS.sales}!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [newRow],
    },
  });

  return true;
}

export async function updateReceivableAbono(cxcId: string, newAbono: number) {
  const { sheets, spreadsheetId } = await getSheetsClient();
  if (!sheets || !spreadsheetId) throw new Error("Google Sheets not configured");

  // Fetch all to find the row
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEETS.receivables}!A:Z`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) throw new Error("Empty receivables sheet");

  const headers = rows[0] as string[];
  const cxcIdIdx = headers.indexOf("cxc_id");
  const abonoIdx = headers.indexOf("total_abonado");
  const saldoIdx = headers.indexOf("saldo_pendiente");
  const ventaTotalIdx = headers.indexOf("total_venta");

  if (cxcIdIdx === -1 || abonoIdx === -1 || saldoIdx === -1 || ventaTotalIdx === -1) {
    throw new Error("Missing required columns in Cuentas_por_Cobrar");
  }

  let targetRowIdx = -1;
  let targetRow = null;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][cxcIdIdx] === cxcId) {
      targetRowIdx = i;
      targetRow = rows[i];
      break;
    }
  }

  if (targetRowIdx === -1 || !targetRow) {
    throw new Error("Receivable not found");
  }

  // Calculate new values
  const currentAbono = Number(targetRow[abonoIdx]?.toString().replace(/[^0-9.-]+/g, "")) || 0;
  const totalVenta = Number(targetRow[ventaTotalIdx]?.toString().replace(/[^0-9.-]+/g, "")) || 0;
  
  const updatedAbono = currentAbono + newAbono;
  const updatedSaldo = totalVenta - updatedAbono;

  // Update specific cells
  // +1 because array is 0-indexed but sheets are 1-indexed (and we need the actual row)
  const rowNumber = targetRowIdx + 1;
  
  // We can do a batchUpdate to be safe, or just update the whole row
  const newRowData = [...targetRow];
  // Ensure array has enough elements
  while (newRowData.length < headers.length) newRowData.push("");
  
  newRowData[abonoIdx] = updatedAbono.toString();
  newRowData[saldoIdx] = updatedSaldo.toString();

  const updateRange = `${SHEETS.receivables}!A${rowNumber}:${String.fromCharCode(65 + headers.length - 1)}${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: updateRange,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [newRowData],
    },
  });

  return { updatedAbono, updatedSaldo };
}
