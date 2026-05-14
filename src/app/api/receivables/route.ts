import { NextResponse } from "next/server";
import { updateReceivableAbono } from "@/lib/sheets-actions";

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.cxc_id || data.abono === undefined) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (cxc_id, abono)" },
        { status: 400 }
      );
    }

    const result = await updateReceivableAbono(data.cxc_id, Number(data.abono));

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error updating receivable:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el abono" },
      { status: 500 }
    );
  }
}
