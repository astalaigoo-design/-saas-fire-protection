import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type OrgSettingsNavItem = {
  id: string;
  label: string;
};

export const orgSectionAnchorClass = "scroll-mt-24";

type OrgSettingsLayoutProps = {
  navItems: OrgSettingsNavItem[];
  children: ReactNode;
};

type OrgSettingsGroupProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

function NavLink({ item }: { item: OrgSettingsNavItem }) {
  return (
    <Link
      href={`#${item.id}`}
      className={cn(
        "block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors",
        "hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

export function OrgSettingsNav({ items }: { items: OrgSettingsNavItem[] }) {
  if (items.length === 0) return null;

  return (
    <>
      <nav
        className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden"
        aria-label="Organization settings sections"
      >
        <ul className="flex w-max gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        className="hidden shrink-0 lg:block lg:w-52 xl:w-56"
        aria-label="Organization settings sections"
      >
        <ul className="sticky top-20 space-y-0.5 rounded-xl border border-border bg-card p-2 shadow-sm">
          {items.map((item) => (
            <li key={item.id}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export function OrgSettingsGroup({
  title,
  description,
  children,
  className,
}: OrgSettingsGroupProps) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="space-y-1 border-b border-border pb-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export function OrgSettingsLayout({ navItems, children }: OrgSettingsLayoutProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8 xl:gap-10">
      <OrgSettingsNav items={navItems} />
      <div className="min-w-0 flex-1 space-y-12">{children}</div>
    </div>
  );
}
