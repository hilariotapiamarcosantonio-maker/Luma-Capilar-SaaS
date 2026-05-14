import { config } from "dotenv";
import { google } from "googleapis";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkAll() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const ranges = [
    "Inventario_Productos!A1:I20",
    "Directorio_Clientes!A1:N20",
    "Ventas_y_Entregas!A1:Y20",
    "Cuentas_por_Cobrar!A1:R20",
  ];

  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    response.data.valueRanges?.forEach((range) => {
      console.log(range.range, range.values?.length || 0, "filas");
    });
  } catch (error) {
    console.error("Error en validacion:", error.message);
  }
}

checkAll();
