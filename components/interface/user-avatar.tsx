type UserAvatarProps = {
  name?: string;
  size?: number;
  className?: string;
};

/** Initials-only avatar. Mono's core has no avatar uploads. */
export function UserAvatar({ name, size = 40, className }: UserAvatarProps) {
  const dimension = `${size}px`;
  const initial = (name?.trim() || "?").charAt(0).toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-muted font-semibold text-muted-foreground ring-1 ring-border/60 ${className ?? ""}`}
      style={{ height: dimension, width: dimension, fontSize: size * 0.36 }}
    >
      {initial}
    </span>
  );
}
