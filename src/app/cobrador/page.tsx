import { getCapilarData } from "@/lib/crm-data/get-capilar-data";
import { CobradorClient } from "./CobradorClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CobradorPage() {
  const data = await getCapilarData();
  return <CobradorClient data={data} />;
}
