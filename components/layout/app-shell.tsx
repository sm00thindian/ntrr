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
        <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-56 shrink-0 border-r px-4 py-6 lg:flex lg:flex-col">
          <div className="mb-10">
            <Logo href="/dashboard" size="lg" />
          </div>
          <AppNav variant="sidebar" />
          <div className="border-sidebar-border mt-auto space-y-3 border-t pt-4">
            {userEmail ? (
              <p className="text-sidebar-muted truncate text-xs leading-relaxed" title={userEmail}>
                {userEmail}
              </p>
            ) : null}
            <SignOutButton className="text-sidebar-muted hover:bg-sidebar-accent hover:text-foreground" />
          </div>
        </aside>

        <div className="flex min-h-dvh flex-1 flex-col">
          <header className="safe-top sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <Logo href="/dashboard" size="md" />
            </div>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="font-display text-muted-foreground text-xs tracking-wide">
                {householdName
                  ? `${householdName}${householdRole ? ` · ${householdRole}` : ""}`
                  : "ntrr"}
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Family Care Orchestrator
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <AppIcon size={32} />
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