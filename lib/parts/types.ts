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
