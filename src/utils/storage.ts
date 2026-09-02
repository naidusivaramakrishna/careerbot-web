/**
 * IndexedDB Storage Utility
 * Provides a simple abstraction layer for IndexedDB operations
 * with automatic database initialization and error handling
 */

interface StorageConfig {
  dbName: string;
  storeName: string;
  version?: number;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = {
      version: 1,
      ...config,
    };
  }

  /**
   * Initialize the IndexedDB database
   * Creates object stores if they don't exist
   */
  private async initDB(): Promise<IDBDatabase> {
    // SSR Guard: Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('IndexedDB is only available in browser environment');
    }

    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not supported in this browser');
    }

    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        if (process.env.NODE_ENV === "development") {
          // // console.error("IndexedDB initialization error:", request.error);
        }
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          db.createObjectStore(this.config.storeName, { keyPath: "id", autoIncrement: true });

          if (process.env.NODE_ENV === "development") {
            // // console.log(`Created object store: ${this.config.storeName}`);
          }
        }
      };
    });
  }

  /**
   * Store or update a value in IndexedDB
   */
  async set<T extends Record<string, unknown>>(key: string, value: T): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.config.storeName, "readwrite");
      const store = transaction.objectStore(this.config.storeName);

      const request = store.put({ id: key, data: value, timestamp: Date.now() });

      return new Promise((resolve, reject) => {
        request.onerror = () => {
          if (process.env.NODE_ENV === "development") {
            // // console.error("Error storing value:", request.error);
          }
          reject(new Error(`Failed to store value: ${request.error?.message}`));
        };
        request.onsuccess = () => resolve();
      });
    } catch (error: unknown) {
      if (process.env.NODE_ENV === "development") {
        // // console.error("Storage.set error:", error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  /**
   * Retrieve a value from IndexedDB
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.config.storeName, "readonly");
      const store = transaction.objectStore(this.config.storeName);

      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onerror = () => {
          if (process.env.NODE_ENV === "development") {
            // // console.error("Error retrieving value:", request.error);
          }
          reject(new Error(`Failed to retrieve value: ${request.error?.message}`));
        };
        request.onsuccess = () => {
          const result = request.result as { data?: T } | undefined;
          resolve(result?.data ?? null);
        };
      });
    } catch {
      if (process.env.NODE_ENV === "development") {
        // // console.error("Storage.get error:", error instanceof Error ? error.message : String(error));
      }
      return null;
    }
  }

  /**
   * Check if a key exists in IndexedDB
   */
  async has(key: string): Promise<boolean> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.config.storeName, "readonly");
      const store = transaction.objectStore(this.config.storeName);

      const request = store.getKey(key);

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(new Error(`Failed to check key: ${request.error?.message}`));
        request.onsuccess = () => resolve(request.result !== undefined);
      });
    } catch {
      if (process.env.NODE_ENV === "development") {
        // // console.error("Storage.has error:", error);
      }
      return false;
    }
  }

  /**
   * Remove a value from IndexedDB
   */
  async remove(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.config.storeName, "readwrite");
      const store = transaction.objectStore(this.config.storeName);

      const request = store.delete(key);

      return new Promise((resolve, reject) => {
        request.onerror = () => {
          if (process.env.NODE_ENV === "development") {
            // // console.error("Error removing value:", request.error);
          }
          reject(new Error(`Failed to remove value: ${request.error?.message}`));
        };
        request.onsuccess = () => resolve();
      });
    } catch (error: unknown) {
      if (process.env.NODE_ENV === "development") {
        // // console.error("Storage.remove error:", error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  /**
   * Clear all values from the object store
   */
  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.config.storeName, "readwrite");
      const store = transaction.objectStore(this.config.storeName);

      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onerror = () => {
          if (process.env.NODE_ENV === "development") {
            // // console.error("Error clearing store:", request.error);
          }
          reject(new Error(`Failed to clear store: ${request.error?.message}`));
        };
        request.onsuccess = () => resolve();
      });
    } catch (error: unknown) {
      if (process.env.NODE_ENV === "development") {
        // // console.error("Storage.clear error:", error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  /**
   * Get all values from the object store
   */
  async getAll<T = unknown>(): Promise<T[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.config.storeName, "readonly");
      const store = transaction.objectStore(this.config.storeName);

      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onerror = () => {
          if (process.env.NODE_ENV === "development") {
            // // console.error("Error getting all values:", request.error);
          }
          reject(new Error(`Failed to get all values: ${request.error?.message}`));
        };
        request.onsuccess = () => {
          const results = (request.result as unknown[]).map((item: unknown) => {
            if (typeof item === "object" && item !== null && "data" in item) {
              return (item as { data: T }).data;
            }
            return item as T;
          });
          resolve(results);
        };
      });
    } catch {
      if (process.env.NODE_ENV === "development") {
        // // console.error("Storage.getAll error:", error);
      }
      return [];
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Factory function to create a new IndexedDB storage instance
 */
export function createStorage(
  dbName: string,
  storeName: string,
  version?: number
): IndexedDBStorage {
  return new IndexedDBStorage({ dbName, storeName, version });
}

/**
 * Resume-specific storage instance
 */
export const resumeStorage = createStorage("careerbotDB", "resumes");

/**
 * Job descriptions storage instance
 */
export const jobStorage = createStorage("careerbotDB", "jobDescriptions");

/**
 * Cache storage instance for API responses
 */
export const cacheStorage = createStorage("careerbotDB", "cache");

export default IndexedDBStorage;
