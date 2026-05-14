import { getCapilarData } from "@/lib/crm-data/get-capilar-data";
import { AdminClient } from "./AdminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getCapilarData();
  return <AdminClient data={data} />;
}
