import { describe, expect, it } from "vitest";
import { parseCsv, rowToRecord } from "@/lib/import/parse-csv";

describe("parseCsv", () => {
  it("parses quoted commas and headers", () => {
    const text = `branch,customer,address_line1
Main,"Acme, LLC",100 Market St`;
    const { headers, rows } = parseCsv(text);
    expect(headers).toEqual(["branch", "customer", "address_line1"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(["Main", "Acme, LLC", "100 Market St"]);
  });

  it("maps row cells to record keys", () => {
    const record = rowToRecord(["city", "region"], ["Boston", "MA"]);
    expect(record).toEqual({ city: "Boston", region: "MA" });
  });
});
