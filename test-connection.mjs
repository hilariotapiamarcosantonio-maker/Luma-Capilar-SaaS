import { config } from "dotenv";
import { google } from "googleapis";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function testConnection() {
  console.log("Validando conexion a Luma Route OS - DB Capilar...");

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.error("Faltan SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY.");
    process.exit(1);
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Ventas_y_Entregas!A1:Y5",
    });

    console.log("Conexion exitosa.");
    console.log("Filas de prueba:", response.data.values?.length || 0);
  } catch (error) {
    console.error("Error de conexion:", error.message);
  }
}

testConnection();
