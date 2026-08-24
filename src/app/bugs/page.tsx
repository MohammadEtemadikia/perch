import { listAllBugs } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { GlobalBugsBoard } from "@/components/GlobalBugsBoard";

export const dynamic = "force-dynamic";

export default function BugsPage() {
  const bugs = listAllBugs();
  return (
    <div>
      <PageHeader title="Bugs" subtitle="Every known bug across every project." />
      <GlobalBugsBoard bugs={bugs} />
    </div>
  );
}
