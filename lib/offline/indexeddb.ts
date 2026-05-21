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
const FALLBACK_OUTBOX_KEY = "offline-outbox-fallback-v1";
const FALLBACK_SNAPSHOT_PREFIX = "offline-snapshot-fallback:";

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

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readFallbackOutbox(): OfflineMutation[] {
  if (!canUseLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(FALLBACK_OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as OfflineMutation[]) : [];
  } catch {
    return [];
  }
}

function writeFallbackOutbox(mutations: OfflineMutation[]) {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(FALLBACK_OUTBOX_KEY, JSON.stringify(mutations));
  } catch {
    // Ignore quota/security errors. Callers still continue in-memory flow.
  }
}

function readFallbackSnapshot(inspectionId: string): CachedInspectionSnapshot | null {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(`${FALLBACK_SNAPSHOT_PREFIX}${inspectionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedInspectionSnapshot;
    return parsed;
  } catch {
    return null;
  }
}

function writeFallbackSnapshot(snapshot: CachedInspectionSnapshot) {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(
      `${FALLBACK_SNAPSHOT_PREFIX}${snapshot.inspectionId}`,
      JSON.stringify(snapshot),
    );
  } catch {
    // Ignore quota/security errors.
  }
}

export async function saveInspectionSnapshot(
  snapshot: CachedInspectionSnapshot,
): Promise<void> {
  try {
    await transaction(SNAPSHOT_STORE, "readwrite", (store) => store.put(snapshot));
  } catch {
    writeFallbackSnapshot(snapshot);
  }
}

export async function getInspectionSnapshot(
  inspectionId: string,
): Promise<CachedInspectionSnapshot | null> {
  try {
    const result = await transaction<CachedInspectionSnapshot | undefined>(
      SNAPSHOT_STORE,
      "readonly",
      (store) => store.get(inspectionId),
    );
    return result ?? null;
  } catch {
    return readFallbackSnapshot(inspectionId);
  }
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
  try {
    await transaction(OUTBOX_STORE, "readwrite", (store) => store.put(mutation));
  } catch {
    const all = readFallbackOutbox();
    all.push(mutation as OfflineMutation);
    writeFallbackOutbox(all);
  }
  return mutation;
}

export async function listOfflineMutations(
  inspectionId?: string,
): Promise<OfflineMutation[]> {
  let all: OfflineMutation[] = [];
  try {
    all = await transaction<OfflineMutation[]>(OUTBOX_STORE, "readonly", (store) =>
      store.getAll(),
    );
  } catch {
    all = readFallbackOutbox();
  }
  const filtered = inspectionId
    ? all.filter((row) => row.inspectionId === inspectionId)
    : all;
  return filtered.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeOfflineMutation(id: string): Promise<void> {
  try {
    await transaction(OUTBOX_STORE, "readwrite", (store) => store.delete(id));
  } catch {
    const all = readFallbackOutbox();
    writeFallbackOutbox(all.filter((row) => row.id !== id));
  }
}

export async function markOfflineMutationAttempt(
  id: string,
  error: string,
): Promise<void> {
  let existing: OfflineMutation | undefined;
  try {
    existing = await transaction<OfflineMutation | undefined>(
      OUTBOX_STORE,
      "readonly",
      (store) => store.get(id),
    );
  } catch {
    existing = readFallbackOutbox().find((row) => row.id === id);
  }
  if (!existing) return;

  const updated: OfflineMutation = {
    ...existing,
    attempts: existing.attempts + 1,
    lastError: error,
  };

  try {
    await transaction(OUTBOX_STORE, "readwrite", (store) => store.put(updated));
  } catch {
    const all = readFallbackOutbox();
    writeFallbackOutbox(all.map((row) => (row.id === id ? updated : row)));
  }
}

export async function removeTempPhotoUploads(
  inspectionId: string,
  tempId: string,
): Promise<void> {
  const mutations = await listOfflineMutations(inspectionId);
  const matches = mutations.filter((row): row is OfflineMutation<"photo.upload"> => {
    if (row.type !== "photo.upload") return false;
    const payload = row.payload as Partial<OfflineMutationPayloadMap["photo.upload"]>;
    return typeof payload.tempId === "string" && payload.tempId === tempId;
  });
  await Promise.all(matches.map((row) => removeOfflineMutation(row.id)));
}
