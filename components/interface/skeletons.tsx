import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder screens — same shapes and tokens as the real pages. */

export function HomeSkeleton() {
  return (
    <div
      aria-label="Loading"
      className="w-full px-4 pb-24 pt-10 md:px-6 md:pb-0 md:pt-14 lg:px-8"
      role="status"
    >
      <Skeleton className="h-9 w-48 md:h-11 md:w-72" />
      <Skeleton className="mt-3 h-4 w-56" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div className="surface-card p-5" key={i}>
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="mt-4 h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div
      aria-label="Loading"
      className="w-full px-4 pb-24 pt-6 md:px-6 md:pb-8 md:pt-8 lg:px-8"
      role="status"
    >
      <Skeleton className="h-7 w-44" />
      <Skeleton className="mt-2 h-3 w-20" />
      <Skeleton className="mt-4 h-9 w-40 rounded-full" />
      <div className="surface-card mt-2 divide-y divide-border/60 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="flex items-center gap-3 px-3 py-2.5" key={i}>
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div
      aria-label="Loading"
      className="w-full px-4 pb-24 pt-6 md:px-6 md:pb-8 md:pt-8 lg:px-8"
      role="status"
    >
      <Skeleton className="h-7 w-36" />
      <Skeleton className="mt-2 h-3 w-44" />
      <div className="mt-6 grid gap-4">
        {[0, 1, 2].map((i) => (
          <div className="surface-card p-4" key={i}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-xl" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
