import { Bell, Settings } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentAccount } from "@/features/auth/session";
import { getUserRow } from "@/features/users/service";
import { HomeSkeleton } from "@/components/interface/skeletons";
import { SessionExpired } from "@/components/interface/session-expired";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <AuthenticatedHome />
    </Suspense>
  );
}

async function AuthenticatedHome() {
  const account = await getCurrentAccount();
  if (!account) {
    return <SessionExpired />;
  }

  // Name is nice-to-have; never let the row break the home page.
  const user = await getUserRow(account.$id).catch(() => null);
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";

  return (
    <main className="w-full px-4 pb-24 pt-8 md:px-6 md:pb-0 md:pt-12 lg:px-8">
      <h1 className="type-title">
        {firstName ? `Hey, ${firstName}.` : "Hey there."}
      </h1>
      <p className="type-lead mt-2">Signed in as {account.email}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          className="surface-card p-4 outline-none transition active:scale-[0.98] hover:border-border/80 focus-visible:ring-2 focus-visible:ring-ring"
          href="/notifications"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
            <Bell aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </span>
          <h3 className="mt-4 text-sm font-bold tracking-tight">
            Notifications
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Everything that happened, newest first. Unread count, grouped.
          </p>
        </Link>
        <Link
          className="surface-card p-4 outline-none transition active:scale-[0.98] hover:border-border/80 focus-visible:ring-2 focus-visible:ring-ring"
          href="/settings"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
            <Settings aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </span>
          <h3 className="mt-4 text-sm font-bold tracking-tight">Settings</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Name, Telegram connection, and your active sessions.
          </p>
        </Link>
      </div>
    </main>
  );
}
