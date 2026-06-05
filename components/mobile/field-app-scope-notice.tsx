import {
  FIELD_APP_CAPABILITIES,
  FIELD_APP_NOT_INCLUDED,
  FIELD_APP_STRATEGY,
  NATIVE_APP_PILOT_THRESHOLD,
} from "@/lib/mobile/scope";
import { cn } from "@/lib/utils";

type FieldAppScopeNoticeProps = {
  variant?: "inline" | "full";
  className?: string;
};

export function FieldAppScopeNotice({
  variant = "inline",
  className,
}: FieldAppScopeNoticeProps) {
  if (variant === "inline") {
    return (
      <p
        role="note"
        className={cn(
          "rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <span className="font-medium text-foreground">Mobile web + offline PWA.</span>{" "}
        Technicians can install Flareflow to their home screen and complete inspections without
        signal — no App Store app yet. Native iOS/Android is deferred until{" "}
        {NATIVE_APP_PILOT_THRESHOLD}+ pilots ask.
      </p>
    );
  }

  return (
    <section
      className={cn(
        "max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
      aria-labelledby="field-app-scope-heading"
    >
      <div>
        <h2
          id="field-app-scope-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Field app (mobile)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{FIELD_APP_STRATEGY}</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Included
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {FIELD_APP_CAPABILITIES.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Not included (yet)
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {FIELD_APP_NOT_INCLUDED.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
