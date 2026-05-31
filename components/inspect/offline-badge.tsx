type OfflineBadgeProps = {
  /** Short label shown in the badge. */
  label?: string;
  className?: string;
};

export function OfflineBadge({
  label = "Saved locally — will sync",
  className = "",
}: OfflineBadgeProps) {
  return (
    <p
      role="status"
      className={`inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-100 ${className}`}
    >
      <span className="size-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
      {label}
    </p>
  );
}
