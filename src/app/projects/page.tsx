import { Suspense } from "react";
import { listProjects } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { ProjectsBoard } from "@/components/ProjectsBoard";
import { getLocale, getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const t = getServerT(getLocale());
  const projects = listProjects();
  return (
    <div>
      <PageHeader title={t("projects.title")} subtitle={t("projects.subtitle")} />
      <Suspense>
        <ProjectsBoard projects={projects} />
      </Suspense>
    </div>
  );
}
