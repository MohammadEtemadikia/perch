import { listProjects, getSetting } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { OrganizationPlanner } from "@/components/OrganizationPlanner";

export const dynamic = "force-dynamic";

export default function OrganizationPage() {
  const projects = listProjects().filter((p) => p.local_path);
  const orgRoot = getSetting("organization_root") ?? "";

  return (
    <div>
      <PageHeader title="Project Organization" subtitle="Plan folder moves safely — every move is a dry run first, and nothing happens without your explicit confirmation." />
      <OrganizationPlanner projects={projects} orgRoot={orgRoot} />
    </div>
  );
}
