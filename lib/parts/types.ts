/** JSON-safe part row for Server → Client boundaries. */
export type ClientPartRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitCents: number;
  quantityOnHand: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartActionResult = { ok: true } | { ok: false; error: string };

export type PartFormAction = (
  prev: PartActionResult,
  formData: FormData,
) => Promise<PartActionResult>;

export type PartsCatalogActions = {
  createPart: PartFormAction;
  updatePart: PartFormAction;
  adjustPartStock: PartFormAction;
};
