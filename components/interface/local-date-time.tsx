/**
 * Renders an ISO timestamp in the viewer's locale. The server can't know the
 * locale, so the text is intentionally re-evaluated on the client with
 * hydration warnings suppressed for this one string.
 */
export function LocalDateTime({ value }: { value: string }) {
  const date = new Date(value);
  const text = Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return <span suppressHydrationWarning>{text}</span>;
}
