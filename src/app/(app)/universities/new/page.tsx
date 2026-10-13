import { pageUser } from "@/lib/guard";
import { currentUser } from "@/lib/session";
import { isFinal } from "@/lib/rbac";
import { PageHeader } from "@/components/app/ui";
import { OnboardWizard } from "@/components/app/onboard-wizard";

export const dynamic = "force-dynamic";

export default async function NewUniversity() {
  const user = await pageUser();
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Multi-university" title="Onboard a university" description="Four steps: the university, its SOP, its venues, and the first society's president and advisor." />
      {isFinal(user) ? <OnboardWizard /> : <p className="text-sm text-muted-foreground">Only a President/VP can onboard a university. Switch role from the sidebar.</p>}
    </div>
  );
}
