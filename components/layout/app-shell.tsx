import { AppIcon } from "@/components/brand/app-icon";
import { Logo } from "@/components/brand/logo";
import { AppNav } from "@/components/layout/app-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { HouseholdRole } from "@/lib/permissions/roles";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
  householdName?: string | null;
  householdRole?: HouseholdRole | null;
};

export function AppShell({
  children,
  userEmail,
  householdName,
  householdRole,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl">
        <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 px-4 py-6 lg:flex lg:flex-col">
          <div className="mb-8">
            <Logo href="/dashboard" variant="inverse" size="lg" />
            {householdName ? (
              <p className="mt-3 text-sm font-medium text-white/90">{householdName}</p>
            ) : null}
            <p className="font-display text-sidebar-muted mt-1 text-xs">
              {householdRole ? `${householdRole} · ` : ""}
              Family Care Orchestrator
            </p>
          </div>
          <AppNav variant="sidebar" />
          <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
            {userEmail ? (
              <p className="text-sidebar-muted truncate text-xs" title={userEmail}>
                {userEmail}
              </p>
            ) : null}
            <SignOutButton className="text-sidebar-muted hover:bg-white/10 hover:text-white" />
          </div>
        </aside>

        <div className="flex min-h-dvh flex-1 flex-col">
          <header className="safe-top sticky top-0 z-40 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <Logo href="/dashboard" size="md" />
            </div>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="font-display text-muted-foreground text-xs">Family Care Orchestrator</p>
              <p className="truncate text-sm font-medium">
                {householdName ? (
                  <>
                    {householdName}
                    {householdRole ? (
                      <span className="text-muted-foreground font-normal"> · {householdRole}</span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    Calm coordination for caregiving families
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AppIcon size={28} className="lg:hidden" />
              <div className="lg:hidden">
                <SignOutButton variant="ghost" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">{children}</main>
        </div>
      </div>

      <AppNav variant="bottom" />
    </div>
  );
}