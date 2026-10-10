import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { one } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await currentUser())!;
  const s = await one<{ university_id: string }>("SELECT university_id FROM societies WHERE id = $1", [user.society_id]);
  redirect(`/universities/${s?.university_id ?? ""}/venues`);
}
