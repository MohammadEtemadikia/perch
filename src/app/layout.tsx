import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { ToastProvider } from "@/components/Toast";
import { AuthGate } from "@/components/AuthGate";
import { SESSION_COOKIE_NAME, getAuthMethod, isAuthConfigured, verifySessionToken } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Perch",
  description: "Your local project command center.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/icon.png",
  },
};

const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("perch-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const configured = isAuthConfigured();
  const method = getAuthMethod();
  const cookieStore = await cookies();
  const authed = method === "none" ? true : verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const gate: "setup" | "login" | null = !configured ? "setup" : !authed ? "login" : null;
  const locale = getLocale();

  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>
          {gate ? (
            <AuthGate mode={gate} />
          ) : (
            <ToastProvider>
              <div className="flex h-screen w-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
              <CommandPalette />
            </ToastProvider>
          )}
        </I18nProvider>
      </body>
    </html>
  );
}
