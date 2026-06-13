import { describe, expect, it } from "vitest";
import {
  parseNotificationCreatedAt,
  serializeStaffNotificationsFeed,
} from "@/lib/notifications/serialize-feed";

describe("serializeStaffNotificationsFeed", () => {
  it("converts createdAt to ISO strings for client components", () => {
    const createdAt = new Date("2026-06-01T12:00:00.000Z");
    const serialized = serializeStaffNotificationsFeed({
      unreadCount: 1,
      items: [
        {
          id: "n1",
          type: "job_assigned",
          title: "New job",
          body: "Assigned to you",
          href: "/inspect/abc",
          createdAt,
          read: false,
        },
      ],
    });

    expect(serialized.items[0]?.createdAt).toBe("2026-06-01T12:00:00.000Z");
    expect(typeof serialized.items[0]?.createdAt).toBe("string");
  });
});

describe("parseNotificationCreatedAt", () => {
  it("parses ISO strings", () => {
    expect(parseNotificationCreatedAt("2026-06-01T12:00:00.000Z").toISOString()).toBe(
      "2026-06-01T12:00:00.000Z",
    );
  });
});
