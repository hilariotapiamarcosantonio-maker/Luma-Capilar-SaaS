import { getCapilarData } from "@/lib/crm-data/get-capilar-data";
import { PromotorClient } from "./PromotorClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PromotorPage() {
  const data = await getCapilarData();
  return <PromotorClient data={data} />;
}
