import { NextResponse } from "next/server";
import { getCapilarData } from "@/lib/crm-data/get-capilar-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCapilarData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Error interno al obtener datos" },
      { status: 500 }
    );
  }
}
