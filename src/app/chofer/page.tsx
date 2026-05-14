import { getCapilarData } from "@/lib/crm-data/get-capilar-data";
import { ChoferClient } from "./ChoferClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ChoferPage() {
  const data = await getCapilarData();
  return <ChoferClient data={data} />;
}
