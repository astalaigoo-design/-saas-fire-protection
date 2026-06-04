import { describe, expect, it } from "vitest";
import { resolveCustomerImportRows } from "@/lib/customers/import-csv-resolve";
import type { CustomerImportRow } from "@/lib/customers/import-csv-schemas";

const baseRow: CustomerImportRow = {
  branch: "Main",
  name: "Acme PM",
  email: "billing@acme.example",
  phone: undefined,
};

describe("resolveCustomerImportRows", () => {
  it("marks ready when customer is new in branch", () => {
    const { resolved, summary } = resolveCustomerImportRows({
      rows: [{ line: 2, data: baseRow }],
      branches: [{ id: "b1", name: "Main", isDefault: true }],
      customers: [],
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.ready).toBe(1);
    expect(summary.newCustomers).toBe(1);
    expect(resolved[0]?.status).toBe("ready");
  });

  it("flags duplicate when customer already exists in branch", () => {
    const { summary } = resolveCustomerImportRows({
      rows: [{ line: 2, data: baseRow }],
      branches: [{ id: "b1", name: "Main", isDefault: true }],
      customers: [{ id: "c1", name: "Acme PM", branchId: "b1" }],
      defaultBranchId: "b1",
      role: "owner",
      userBranchId: null,
    });

    expect(summary.duplicates).toBe(1);
    expect(summary.ready).toBe(0);
  });
});
