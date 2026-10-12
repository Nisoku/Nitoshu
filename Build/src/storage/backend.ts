const PREFIX = "nitoshu:";
const DB_NAME = "nitoshu";
const DB_STORE = "kv";

interface StorageBackend {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

let backend: StorageBackend | null = null;
let initPromise: Promise<void> | null = null;

function memoryBackend(): StorageBackend {
  const store = new Map<string, string>();
  return {
    read: async (key) => store.get(key) ?? null,
    write: async (key, value) => {
      store.set(key, value);
    },
    remove: async (key) => {
      store.delete(key);
    },
  };
}

function opfsBackend(root: FileSystemDirectoryHandle): StorageBackend {
  async function handleFor(key: string, create: boolean) {
    return root.getFileHandle(PREFIX + key, { create });
  }
  return {
    read: async (key) => {
      try {
        const handle = await handleFor(key, false);
        const file = await handle.getFile();
        return await file.text();
      } catch {
        return null;
      }
    },
    write: async (key, value) => {
      const handle = await handleFor(key, true);
      const writable = await handle.createWritable();
      try {
        await writable.write(value);
      } finally {
        await writable.close();
      }
    },
    remove: async (key) => {
      try {
        await root.removeEntry(PREFIX + key);
      } catch {
        // Ignore missing entries.
      }
    },
  };
}

function idbBackend(db: Promise<IDBDatabase>): StorageBackend {
  return {
    read: async (key) => {
      const value = await idbRequest(db, "readonly", (store) =>
        store.get(key),
      );
      return value === undefined || value === null ? null : String(value);
    },
    write: (key, value) => idbRequest(db, "readwrite", (store) => {
      store.put(value, key);
      return store.get(key);
    }),
    remove: (key) => idbRequest(db, "readwrite", (store) => {
      store.delete(key);
      return store.get(key);
    }),
  };
}

function idbRequest<T>(
  dbPromise: Promise<IDBDatabase>,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<unknown>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    void dbPromise.then(
      (db) => {
        const transaction = db.transaction(DB_STORE, mode);
        const store = transaction.objectStore(DB_STORE);
        const request = operation(store);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB"));
        transaction.onerror = () =>
          reject(transaction.error ?? new Error("IndexedDB transaction"));
      },
      (error) => reject(error),
    );
  });
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const idb = window.indexedDB;
    if (idb === undefined) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = idb.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

async function detectBackend(): Promise<StorageBackend> {
  const storage = navigator.storage;
  if (storage !== undefined && typeof storage.getDirectory === "function") {
    try {
      const root = await storage.getDirectory();
      return opfsBackend(root);
    } catch {
      // OPFS unavailable (e.g. insecure context) - fall through to IndexedDB.
    }
  }
  if (window.indexedDB !== undefined) {
    try {
      const db = openIdb();
      await db;
      return idbBackend(db);
    } catch {
      // IndexedDB unavailable - fall through to in-memory.
    }
  }
  return memoryBackend();
}

export function initStorage(): Promise<void> {
  if (initPromise === null) {
    initPromise = detectBackend().then((next) => {
      backend = next;
    });
  }
  return initPromise;
}

async function getBackend(): Promise<StorageBackend> {
  await initStorage();
  return backend ?? memoryBackend();
}

export async function readJson<T>(
  key: string,
  fallback: T,
): Promise<T> {
  try {
    const raw = await (await getBackend()).read(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await (await getBackend()).write(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures (quota, disabled storage).
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await (await getBackend()).remove(key);
  } catch {
    // Ignore.
  }
}