import Link from "next/link";
import { History } from "lucide-react";
import { EmptyState } from "@/components/interface/empty-state";

/** Shown when the session cookie is missing or expired mid-visit. */
export function SessionExpired() {
  return (
    <div className="grid flex-1 place-items-center px-6">
      <EmptyState
        action={
          <Link
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            href="/auth"
          >
            Sign in
          </Link>
        }
        description="Your session ended. Sign in again to keep going."
        icon={History}
        title="Session expired"
      />
    </div>
  );
}
