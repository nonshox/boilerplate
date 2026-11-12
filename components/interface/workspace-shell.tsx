"use client";

import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  House,
  LogOut,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/features/auth/client-api";
import { fetchUser } from "@/features/users/client-api";
import { useNotificationStore } from "@/features/notifications/store";
import { UserAvatar } from "@/components/interface/user-avatar";

/** Bottom bar destinations on mobile (home lives in the top bar via the Mono logo). */
const mobileItems = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/** Exact route titles for the breadcrumb trail. */
const routeTitles: Record<string, string> = {
  "/notifications": "Notifications",
  "/settings": "Settings",
};

/**
 * App chrome.
 * - Desktop: sticky, full-width top bar (back · Mono · bell · account menu)
 *   plus a tiny breadcrumb row (back · home · › · page) beneath it.
 * - Mobile: slim top bar (back · Mono) + bottom thumb bar (Notifications · Settings).
 * Keep destinations non-duplicated between the two.
 */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const unread = useNotificationStore((state) => state.unreadCount);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetchUser()
      .then((user) => {
        if (!active) return;
        setEmail(user.email);
        setName(user.name);
      })
      .catch(() => {
        // Chrome still works without the label; dropdown falls back to email.
      });
    return () => {
      active = false;
    };
  }, []);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } finally {
      router.replace("/auth");
      router.refresh();
    }
  };

  return (
    <>
      {/* Single frosted chrome: one blur, one hairline — no split seams */}
      <div className="sticky top-0 z-40 shrink-0 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <header
          className={`h-12 shrink-0 ${
            pathname !== "/" ? "border-b border-border/60" : ""
          }`}
        >
        <div className="flex h-full w-full items-center justify-between px-3 md:px-6 lg:px-8">
          <div className="flex items-center gap-1">
            <Link
              aria-label="Mono — home"
              className="flex items-center gap-2 rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              href="/"
            >
              <Image alt="" className="rounded-md" height={28} priority src="/logotype/logotype.png" width={28} />
              <span className="text-sm font-bold tracking-tight">Mono</span>
            </Link>
          </div>

          {/* Desktop-only controls; mobile gets the bottom bar instead. */}
          <div className="hidden items-center gap-1.5 md:flex">
            <Link
              aria-label={
                unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
              }
              className="relative grid size-9 place-items-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              href="/notifications"
            >
              <Bell
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.8}
              />
              {unread > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-badge px-1 text-[9px] font-semibold tabular-nums leading-none text-white"
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="flex items-center gap-1 rounded-full p-1 outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <UserAvatar name={name || email || "?"} size={28} />
                <ChevronDown
                  aria-hidden="true"
                  className="size-3.5 text-muted-foreground"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" sideOffset={8}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <span className="block text-xs font-semibold text-foreground">
                      {name || "Account"}
                    </span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {email}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings aria-hidden="true" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={signingOut}
                  onClick={() => void signOut()}
                  variant="destructive"
                >
                  <LogOut aria-hidden="true" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        </header>

        {/* Tiny breadcrumb row — desktop only (mobile top bar already carries back) */}
        {pathname !== "/" && (
          <div
            aria-label="Breadcrumb"
            className="hidden h-8 shrink-0 items-center md:flex"
          >
          <div className="flex w-full items-center gap-1 px-4 md:px-6 lg:px-8">
            <button
              aria-label="Back"
              className="grid size-6 place-items-center rounded-md text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => router.back()}
              title="Back"
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
            </button>
            <Link
              aria-label="Home"
              className="grid size-6 place-items-center rounded-md text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              href="/"
              title="Home"
            >
              <House aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
            </Link>
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 text-muted-foreground/50"
              strokeWidth={1.8}
            />
            <span aria-current="page" className="text-xs font-medium text-foreground">
              {routeTitles[pathname] ??
                pathname
                  .split("/")
                  .filter(Boolean)
                  .map((segment) =>
                    segment
                      .replaceAll("-", " ")
                      .replace(/^./, (char) => char.toUpperCase()),
                  )
                  .join(" / ")}
            </span>
          </div>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>

      {/* Mobile-only floating tab bar — icon-only, no labels */}
      <div className="pointer-events-none sticky bottom-2 z-30 flex shrink-0 justify-center px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
        <nav
          aria-label="Primary"
          className="pointer-events-auto flex h-11 items-center rounded-full border border-border/60 bg-background/70 px-1.5 shadow-dock backdrop-blur-xl"
        >
          {mobileItems.map((item, index) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const badge = item.href === "/notifications" ? unread : 0;

            return (
              <div className="flex items-center" key={item.href}>
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-0.5 h-4 w-px shrink-0 bg-border"
                  />
                )}
                <Link
                  aria-current={isActive ? "page" : undefined}
                  aria-label={
                    badge > 0
                      ? `${item.label}, ${badge} unread`
                      : item.label
                  }
                  className={`relative grid size-9 place-items-center rounded-full outline-none transition active:scale-90 focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  href={item.href}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={isActive ? 2.1 : 1.75}
                  />
                  {badge > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0 top-0 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-badge px-0.5 text-[8px] font-bold tabular-nums leading-none text-white ring-2 ring-card"
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}
