import { PageHeader } from "@/components/PageHeader";
import { SettingsForm } from "@/components/SettingsForm";
import { getScanRoots, getSetting } from "@/lib/queries";
import { getDbPath } from "@/lib/db";
import { getAuthMethod } from "@/lib/auth";
import { getLocale, getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const t = getServerT(getLocale());
  return (
    <div>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <SettingsForm scanRoots={getScanRoots()} organizationRoot={getSetting("organization_root") ?? ""} dbPath={getDbPath()} authMethod={getAuthMethod()} />
    </div>
  );
}
