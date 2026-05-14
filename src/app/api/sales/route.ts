import { NextResponse } from "next/server";
import { addSale } from "@/lib/sheets-actions";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate some basic fields
    if (!data.nombre_cliente || !data.total_venta || !data.promotor) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (nombre_cliente, total_venta, promotor)" },
        { status: 400 }
      );
    }

    // Add generated fields
    const newSale = {
      ...data,
      venta_id: `V-${Date.now()}`,
      cliente_id: data.cliente_id || `C-${Date.now()}`,
      fecha_registro: new Date().toISOString().split("T")[0],
    };

    await addSale(newSale);

    return NextResponse.json({ success: true, sale: newSale });
  } catch (error) {
    console.error("Error adding sale:", error);
    return NextResponse.json(
      { error: "Error interno al guardar la venta" },
      { status: 500 }
    );
  }
}
