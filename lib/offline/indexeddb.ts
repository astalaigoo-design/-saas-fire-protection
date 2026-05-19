import type {
  CachedInspectionSnapshot,
  OfflineMutation,
  OfflineMutationPayloadMap,
  OfflineMutationType,
} from "@/lib/offline/inspection-types";

const DB_NAME = "flareflow-offline";
const DB_VERSION = 1;
const SNAPSHOT_STORE = "inspection-snapshots";
const OUTBOX_STORE = "inspection-outbox";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: "inspectionId" });
      }
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const outbox = db.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
        outbox.createIndex("inspectionId", "inspectionId", { unique: false });
        outbox.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Failed opening IndexedDB"));
    request.onsuccess = () => resolve(request.result);
  });
}

function transaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = executor(store);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        request.onsuccess = () => resolve(request.result);
      }),
  );
}

export async function saveInspectionSnapshot(
  snapshot: CachedInspectionSnapshot,
): Promise<void> {
  await transaction(SNAPSHOT_STORE, "readwrite", (store) => store.put(snapshot));
}

export async function getInspectionSnapshot(
  inspectionId: string,
): Promise<CachedInspectionSnapshot | null> {
  const result = await transaction<CachedInspectionSnapshot | undefined>(
    SNAPSHOT_STORE,
    "readonly",
    (store) => store.get(inspectionId),
  );
  return result ?? null;
}

export async function enqueueOfflineMutation<T extends OfflineMutationType>(
  input: {
    inspectionId: string;
    type: T;
    payload: OfflineMutationPayloadMap[T];
  },
): Promise<OfflineMutation<T>> {
  const mutation: OfflineMutation<T> = {
    id: crypto.randomUUID(),
    idempotencyKey: crypto.randomUUID(),
    inspectionId: input.inspectionId,
    type: input.type,
    payload: input.payload,
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
  };
  await transaction(OUTBOX_STORE, "readwrite", (store) => store.put(mutation));
  return mutation;
}

export async function listOfflineMutations(
  inspectionId?: string,
): Promise<OfflineMutation[]> {
  const all = await transaction<OfflineMutation[]>(OUTBOX_STORE, "readonly", (store) =>
    store.getAll(),
  );
  const filtered = inspectionId
    ? all.filter((row) => row.inspectionId === inspectionId)
    : all;
  return filtered.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeOfflineMutation(id: string): Promise<void> {
  await transaction(OUTBOX_STORE, "readwrite", (store) => store.delete(id));
}

export async function markOfflineMutationAttempt(
  id: string,
  error: string,
): Promise<void> {
  const existing = await transaction<OfflineMutation | undefined>(
    OUTBOX_STORE,
    "readonly",
    (store) => store.get(id),
  );
  if (!existing) return;

  const updated: OfflineMutation = {
    ...existing,
    attempts: existing.attempts + 1,
    lastError: error,
  };

  await transaction(OUTBOX_STORE, "readwrite", (store) => store.put(updated));
}

export async function removeTempPhotoUploads(
  inspectionId: string,
  tempId: string,
): Promise<void> {
  const mutations = await listOfflineMutations(inspectionId);
  const matches = mutations.filter(
    (row) => row.type === "photo.upload" && row.payload.tempId === tempId,
  );
  await Promise.all(matches.map((row) => removeOfflineMutation(row.id)));
}
