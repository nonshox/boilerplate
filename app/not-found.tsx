import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/interface/empty-state";

export const metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-6">
      <EmptyState
        action={
          <Link
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
            href="/"
          >
            Go home
          </Link>
        }
        description="The page you're looking for doesn't exist or was moved."
        icon={Compass}
        title="Page not found"
      />
    </main>
  );
}
