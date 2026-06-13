"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  markAllStaffNotificationsRead,
  markStaffNotificationRead,
} from "@/lib/notifications/actions";
import {
  parseNotificationCreatedAt,
  type ClientStaffNotificationsFeed,
} from "@/lib/notifications/serialize-feed";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

type StaffNotificationBellProps = {
  feed: ClientStaffNotificationsFeed;
  role?: AppRole;
  /** Dark field inspect chrome vs dashboard header. */
  variant?: "dashboard" | "field";
};

function formatRelativeTime(createdAt: string): string {
  const date = parseNotificationCreatedAt(createdAt);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function UnreadBadge({
  count,
  pulse,
}: {
  count: number;
  pulse?: boolean;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground",
        pulse && "animate-pulse",
      )}
      aria-hidden
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Field inspect: link only — no dropdown while working on a checklist. */
function FieldNotificationLink({
  feed,
  role,
}: {
  feed: ClientStaffNotificationsFeed;
  role?: AppRole;
}) {
  const isTechnician = role === "technician";
  const href = isTechnician ? "/dashboard/my-jobs" : "/dashboard/operations";

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "relative min-h-10 min-w-10 shrink-0 border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white",
      )}
      aria-label={
        feed.unreadCount > 0
          ? `Notifications, ${feed.unreadCount} unread — back to jobs`
          : "Back to jobs"
      }
    >
      <BellIcon className="size-5" />
      <UnreadBadge count={feed.unreadCount} pulse={isTechnician} />
    </Link>
  );
}

export function StaffNotificationBell({
  feed,
  role,
  variant = "dashboard",
}: StaffNotificationBellProps) {
  if (variant === "field") {
    return <FieldNotificationLink feed={feed} role={role} />;
  }

  const isTechnician = role === "technician";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllStaffNotificationsRead();
      router.refresh();
    });
  };

  const handleOpenItem = (id: string, href: string | null, read: boolean) => {
    startTransition(async () => {
      if (!read) {
        await markStaffNotificationRead(id);
      }
      setOpen(false);
      router.refresh();
      if (href) {
        router.push(href);
      }
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative min-h-10 min-w-10 shrink-0",
        )}
        aria-label={
          feed.unreadCount > 0
            ? `Notifications, ${feed.unreadCount} unread`
            : "Notifications"
        }
      >
        <BellIcon className="size-5" />
        <UnreadBadge count={feed.unreadCount} pulse={isTechnician} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {feed.unreadCount > 0 ? (
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto px-0 text-xs font-normal"
              disabled={pending}
              onClick={handleMarkAll}
            >
              Mark all read
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {feed.items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            {isTechnician
              ? "No job alerts yet. New assigns and schedule changes appear here — often faster than email or SMS."
              : "No notifications yet."}
          </p>
        ) : (
          feed.items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className={cn(
                "flex cursor-pointer flex-col items-start gap-0.5 py-2",
                !item.read && "bg-muted/50",
              )}
              onSelect={(event) => {
                event.preventDefault();
                handleOpenItem(item.id, item.href, item.read);
              }}
            >
              <span className="font-medium leading-snug">{item.title}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(item.createdAt)}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-sm"
          onSelect={(event) => {
            event.preventDefault();
            setOpen(false);
            router.push(isTechnician ? "/dashboard/my-jobs" : "/dashboard/operations");
          }}
        >
          {isTechnician ? "View all on My jobs" : "View activity log"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
