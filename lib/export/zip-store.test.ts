import { describe, expect, it } from "vitest";
import { createZipStore } from "@/lib/export/zip-store";

describe("createZipStore", () => {
  it("creates a readable ZIP with local and central directory signatures", () => {
    const zip = createZipStore([
      { name: "hello.csv", data: Buffer.from("a,b\n1,2", "utf8") },
      { name: "world.csv", data: Buffer.from("x,y", "utf8") },
    ]);

    expect(zip.length).toBeGreaterThan(100);
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);

    const centralOffset = zip.lastIndexOf("world.csv", zip.length, "utf8");
    expect(centralOffset).toBeGreaterThan(0);
    expect(zip.includes(Buffer.from("hello.csv"))).toBe(true);
  });
});
