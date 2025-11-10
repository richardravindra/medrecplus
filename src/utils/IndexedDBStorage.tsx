import { Patient, Invoice, Appointment, VitalSigns, Treatment, Operator, CustomExamination, ReceiptConfig } from '../types';

// Generic type for data entities - includes all possible types with index signature
type DataEntity = (Patient & Record<string, unknown>) |
                   (Invoice & Record<string, unknown>) |
                   (Appointment & Record<string, unknown>) |
                   (Operator & Record<string, unknown>) |
                   (CustomExamination & Record<string, unknown>) |
                   (ReceiptConfig & Record<string, unknown>) |
                   (Record<string, unknown> & {
  patientName?: string;
  patientId?: number;
  operatorName?: string;
  operatorId?: number;
  date?: string;
  invoiceNumber?: string;
  status?: string;
  totalAmount?: number;
  vitalSigns?: VitalSigns;
  treatments?: Treatment[];
});

interface StorageItem {
  id?: number;
  data: DataEntity[];
  timestamp: number;
  type: string;
}

export class IndexedDBStorage {
  private static DB_NAME = 'MedicalRecordsDB';
  private static DB_VERSION = 1;
  private static STORE_NAME = 'medical_data';

  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IndexedDBStorage.DB_NAME, IndexedDBStorage.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(IndexedDBStorage.STORE_NAME)) {
          const store = db.createObjectStore(IndexedDBStorage.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Create indexes for efficient querying
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  static async saveData(type: string, data: DataEntity[]): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      // Clear existing data of this type
      const clearRequest = store.index('type').openCursor(IDBKeyRange.only(type));
      clearRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Save new data in chunks to avoid blocking
      const chunkSize = 1000;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);

        const storageItem: StorageItem = {
          data: chunk,
          timestamp: Date.now(),
          type: type
        };
        store.add(storageItem);
      }

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('IndexedDB save error:', error);
      // Fallback to localStorage for small datasets
      if (data.length < 1000) {
        localStorage.setItem(type, JSON.stringify(data));
      } else {
        throw error;
      }
    }
  }

  static async getData(type: string): Promise<DataEntity[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('type');
      const request = index.getAll(type);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const items = request.result;
          const data: DataEntity[] = [];

          // Flatten all chunks
          for (const item of items) {
            data.push(...item.data);
          }

          resolve(data);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB read error:', error);
      // Fallback to localStorage
      const data = localStorage.getItem(type);
      return data ? JSON.parse(data) : [];
    }
  }

  static async clearData(type: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('type');

      const request = index.openCursor(IDBKeyRange.only(type));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
      // Fallback to localStorage
      localStorage.removeItem(type);
    }
  }

  static async getStorageInfo(): Promise<{
    totalItems: number;
    totalSize: string;
    types: { type: string; count: number }[];
    quotaUsed: number;
    quotaAvailable: number;
    available: boolean;
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quotaUsed = estimate.usage || 0;
        const quotaAvailable = estimate.quota || 0;

        const db = await this.getDB();
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);

        const types = new Map<string, number>();
        let totalItems = 0;

        return new Promise((resolve) => {
          const request = store.openCursor();
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              const item = cursor.value as StorageItem;
              totalItems++;
              types.set(item.type, (types.get(item.type) || 0) + 1);
              cursor.continue();
            } else {
              const typesArray = Array.from(types.entries()).map(([type, count]) => ({
                type,
                count
              }));

              resolve({
                totalItems,
                totalSize: `${(quotaUsed / 1024 / 1024).toFixed(2)} MB`,
                types: typesArray,
                quotaUsed,
                quotaAvailable,
                available: true
              });
            }
          };
        });
      } else {
        // Fallback for browsers without storage API
        return {
          totalItems: 0,
          totalSize: 'Unknown',
          types: [],
          quotaUsed: 0,
          quotaAvailable: 0,
          available: false
        };
      }
    } catch (error) {
      console.error('Storage info error:', error);
      return {
        totalItems: 0,
        totalSize: 'Unknown',
        types: [],
        quotaUsed: 0,
        quotaAvailable: 0,
        available: false
      };
    }
  }

  static async clearAll(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.clear();

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('IndexedDB clear all error:', error);
      // Fallback: clear all localStorage
      const keysToKeep = ['currentUser', 'settings'];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  static async checkQuota(fileSize: number): Promise<{
    canStore: boolean;
    reason?: string;
    recommendation?: string;
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quotaUsed = estimate.usage || 0;
        const quotaAvailable = (estimate.quota || 0) - quotaUsed;

        if (fileSize > quotaAvailable) {
          const availableMB = Math.round(quotaAvailable / 1024 / 1024);
          const neededMB = Math.round(fileSize / 1024 / 1024);

          return {
            canStore: false,
            reason: `Insufficient storage space. Need ${neededMB}MB but only ${availableMB}MB available.`,
            recommendation: 'Clear existing data or use a smaller backup file.'
          };
        }

        return { canStore: true };
      } else {
        // Fallback check
        const totalSize = JSON.stringify(localStorage).length;
        const maxSize = 5 * 1024 * 1024; // 5MB estimate for localStorage

        if (totalSize + fileSize > maxSize) {
          return {
            canStore: false,
            reason: 'localStorage may be exceeded. Use Enhanced Restore with IndexedDB.',
            recommendation: 'The Enhanced Restore system will automatically use IndexedDB for large files.'
          };
        }

        return { canStore: true };
      }
    } catch (error) {
      console.error('Quota check error:', error);
      return { canStore: true }; // Assume it can store if we can't check
    }
  }

  static async cleanupOldData(daysOld = 30): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');

      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const range = IDBKeyRange.upperBound(cutoffTime);

      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}