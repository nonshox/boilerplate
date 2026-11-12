import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Canonical empty/error presentation — icon tile, title, hint, optional action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-3 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-7" strokeWidth={1.5} />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
