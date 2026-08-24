import { listAllTasks } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { GlobalTasksBoard } from "@/components/GlobalTasksBoard";
import { getLocale, getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  const t = getServerT(getLocale());
  const tasks = listAllTasks();
  return (
    <div>
      <PageHeader title={t("tasks.title")} subtitle={t("tasks.subtitle")} />
      <GlobalTasksBoard tasks={tasks} />
    </div>
  );
}
