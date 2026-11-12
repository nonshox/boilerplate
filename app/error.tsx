"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/interface/empty-state";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid flex-1 place-items-center px-6">
      <EmptyState
        action={
          <div className="flex items-center gap-2">
            <Button onClick={reset} type="button">
              Try again
            </Button>
            <Button onClick={() => router.push("/")} type="button" variant="outline">
              Go home
            </Button>
          </div>
        }
        description="Something went wrong on our end. Your session and data are safe — try again."
        icon={TriangleAlert}
        title="Something went wrong"
      />
    </main>
  );
}
