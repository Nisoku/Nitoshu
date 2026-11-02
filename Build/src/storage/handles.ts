const DB_NAME = "nitoshu-handles";
const DB_VERSION = 1;
const STORE = "handles";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise !== null) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  return openDb().then((db) => {
    if (db === null) {
      return null;
    }
    return new Promise<T | null>((resolve) => {
      let transaction: IDBTransaction;
      try {
        transaction = db.transaction(STORE, mode);
      } catch {
        resolve(null);
        return;
      }
      const store = transaction.objectStore(STORE);
      const request = operation(store);
      request.onsuccess = () => resolve((request.result ?? null) as T | null);
      request.onerror = () => resolve(null);
      transaction.onerror = () => resolve(null);
    });
  });
}

export function createHandleId(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef !== undefined && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export async function saveHandle(
  id: string,
  handle: FileSystemHandle,
): Promise<void> {
  await run<void>("readwrite", (store) => store.put(handle, id));
}

export function loadHandle(id: string): Promise<FileSystemHandle | null> {
  return run<FileSystemHandle>("readonly", (store) => store.get(id));
}

export async function removeHandle(id: string): Promise<void> {
  await run<void>("readwrite", (store) => store.delete(id));
}
