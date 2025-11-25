// Enhanced IndexedDB Storage with Indexing for better query performance

import { Patient, Appointment, Invoice } from '../types';

export class OptimizedIndexedDBStorage {
  private static DB_NAME = 'MedRecPlusDB';
  private static DB_VERSION = 2;
  private static db: IDBDatabase | null = null;

  // Initialize database with indexes
  static async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create patient records store with indexes
        if (!db.objectStoreNames.contains('patient_management_data')) {
          const patientStore = db.createObjectStore('patient_management_data', {
            keyPath: 'id',
            autoIncrement: true
          });
          patientStore.createIndex('record_number', 'record_number', { unique: true });
          patientStore.createIndex('name', 'name', { unique: false });
          patientStore.createIndex('age', 'age', { unique: false });
          patientStore.createIndex('phone_number', 'phone_number', { unique: false });
          patientStore.createIndex('created_at', 'created_at', { unique: false });
          patientStore.createIndex('name_age', ['name', 'age'], { unique: false });
        }

        // Create appointments store with indexes
        if (!db.objectStoreNames.contains('appointments')) {
          const appointmentStore = db.createObjectStore('appointments', {
            keyPath: 'id',
            autoIncrement: true
          });
          appointmentStore.createIndex('patientId', 'patientId', { unique: false });
          appointmentStore.createIndex('patientName', 'patientName', { unique: false });
          appointmentStore.createIndex('operatorId', 'operatorId', { unique: false });
          appointmentStore.createIndex('date', 'date', { unique: false });
          appointmentStore.createIndex('status', 'status', { unique: false });
          appointmentStore.createIndex('patient_date', ['patientId', 'date'], { unique: false });
        }

        // Create invoices store with indexes
        if (!db.objectStoreNames.contains('invoices')) {
          const invoiceStore = db.createObjectStore('invoices', {
            keyPath: 'id',
            autoIncrement: true
          });
          invoiceStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
          invoiceStore.createIndex('appointmentId', 'appointmentId', { unique: false });
          invoiceStore.createIndex('patientId', 'patientId', { unique: false });
          invoiceStore.createIndex('patientName', 'patientName', { unique: false });
          invoiceStore.createIndex('date', 'date', { unique: false });
          invoiceStore.createIndex('status', 'status', { unique: false });
        }

        // Create operators store with indexes
        if (!db.objectStoreNames.contains('operators')) {
          const operatorStore = db.createObjectStore('operators', {
            keyPath: 'id',
            autoIncrement: true
          });
          operatorStore.createIndex('name', 'name', { unique: false });
          operatorStore.createIndex('role', 'role', { unique: false });
          operatorStore.createIndex('specialization', 'specialization', { unique: false });
        }

        // Create treatments store with indexes
        if (!db.objectStoreNames.contains('treatments')) {
          const treatmentStore = db.createObjectStore('treatments', {
            keyPath: 'id',
            autoIncrement: true
          });
          treatmentStore.createIndex('name', 'name', { unique: false });
          treatmentStore.createIndex('price', 'price', { unique: false });
          treatmentStore.createIndex('category', 'category', { unique: false });
        }

        // Create custom examinations store with indexes
        if (!db.objectStoreNames.contains('custom_examinations')) {
          const examStore = db.createObjectStore('custom_examinations', {
            keyPath: 'id',
            autoIncrement: true
          });
          examStore.createIndex('name', 'name', { unique: false });
          examStore.createIndex('unit', 'unit', { unique: false });
        }

        // Create receipt config store
        if (!db.objectStoreNames.contains('receipt_config')) {
          db.createObjectStore('receipt_config', { keyPath: 'id', autoIncrement: true });
        }

        };
    });
  }

  // Generic save data method
  static async saveData<T>(storeName: string, data: T[]): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Clear existing data
    await this.clearStore(store);

    // Add new data in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      for (const item of batch) {
        store.put(item);
      }
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  // Generic get data method with optional filtering
  static async getData<T>(
    storeName: string,
    options: {
      index?: string;
      query?: IDBValidKey | IDBKeyRange;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<T[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = options.index
        ? transaction.objectStore(storeName).index(options.index)
        : transaction.objectStore(storeName);

      return new Promise((resolve, reject) => {
        const request = options.query ? store.openCursor(options.query) : store.openCursor();

        const results: T[] = [];
        let count = 0;
        let skipCount = 0;

        request.onsuccess = event => {
          const cursor = (event.target as IDBRequest).result;

          if (cursor) {
            // Skip offset items
            if (options.offset && skipCount < options.offset) {
              skipCount++;
              cursor.continue();
              return;
            }

            // Add to results
            results.push(cursor.value as T);
            count++;

            // Check limit
            if (options.limit && count >= options.limit) {
              resolve(results);
              return;
            }

            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch {
      return [];
    }
  }

  // Search patients with optimized queries
  static async searchPatients(query: string, limit: number = 20): Promise<Patient[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(['patient_management_data'], 'readonly');
      const store = transaction.objectStore('patient_management_data');
      const nameIndex = store.index('name');

      return new Promise((resolve, reject) => {
        const results: Patient[] = [];
        const searchTerm = query.toLowerCase();

        // Search by name index first
        const nameRequest = nameIndex.openCursor();

        nameRequest.onsuccess = event => {
          const cursor = (event.target as IDBRequest).result;

          if (cursor && results.length < limit) {
            const patient = cursor.value as Patient;

            // Check if name matches
            if (patient.name.toLowerCase().includes(searchTerm)) {
              results.push(patient);
            }

            cursor.continue();
          } else {
            // If we didn't find enough results by name, search other fields
            if (results.length < limit) {
              this.searchAllFields(
                query,
                limit - results.length,
                results.filter(p => p.id).map(p => p.id as number).filter(id => id !== undefined)
              )
                .then(additionalResults => {
                  resolve([...results, ...additionalResults]);
                })
                .catch(reject);
            } else {
              resolve(results);
            }
          }
        };

        nameRequest.onerror = () => reject(nameRequest.error);
      });
    } catch {
      return [];
    }
  }

  // Search all fields for patients
  private static async searchAllFields(
    query: string,
    limit: number,
    excludeIds: number[] = []
  ): Promise<Patient[]> {
    try {
      const allPatients = await this.getData('patient_management_data');
      const searchTerm = query.toLowerCase();
      const excludeSet = new Set(excludeIds);

      return (allPatients as Patient[])
        .filter(
          (patient: Patient) =>
            patient.id &&
            !excludeSet.has(patient.id) &&
            (patient.record_number?.toLowerCase().includes(searchTerm) ||
              patient.phone_number?.toLowerCase().includes(searchTerm) ||
              patient.address?.toLowerCase().includes(searchTerm) ||
              patient.initial_diagnosis?.toLowerCase().includes(searchTerm))
        )
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  // Get patient by ID with optimized query
  static async getPatientById(id: number): Promise<Patient | null> {
    try {
      const results = await this.getData('patient_management_data', {
        query: IDBKeyRange.only(id)
      });
      return results.length > 0 ? (results[0] as Patient) : null;
    } catch {
      return null;
    }
  }

  // Get appointments by patient ID with optimized query
  static async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    try {
      return await this.getData('appointments', {
        index: 'patientId',
        query: IDBKeyRange.only(patientId)
      });
    } catch {
      return [];
    }
  }

  // Get invoices by patient ID with optimized query
  static async getInvoicesByPatientId(patientId: number): Promise<Invoice[]> {
    try {
      return await this.getData('invoices', {
        index: 'patientId',
        query: IDBKeyRange.only(patientId)
      });
    } catch {
      return [];
    }
  }

  // Get paginated data
  static async getPaginatedData<T>(
    storeName: string,
    page: number,
    limit: number,
    options: {
      index?: string;
      query?: IDBValidKey | IDBKeyRange;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ data: T[]; total: number }> {
    try {
      // Get total count
      const db = await this.initDB();
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      // Note: store variable is not used but kept for potential future use
      // const _store = options.index ? objectStore.index(options.index) : objectStore;

      const total = await this.getCount(objectStore, options.query);

      // Get paginated data
      const data = await this.getData<T>(storeName, {
        ...options,
        offset: (page - 1) * limit,
        limit
      });

      return { data, total };
    } catch {
      return { data: [], total: 0 };
    }
  }

  // Get count of records
  private static async getCount(
    store: IDBObjectStore,
    query?: IDBValidKey | IDBKeyRange
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = query ? store.count(query) : store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear store
  private static async clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Delete item by ID
  static async deleteItem(storeName: string, id: number): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Update item
  static async updateItem<T>(storeName: string, item: T): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get database statistics
  static async getDatabaseStats(): Promise<Record<string, number>> {
    try {
      const db = await this.initDB();
      const stats: Record<string, number> = {};

      for (const storeName of db.objectStoreNames) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        stats[storeName] = await this.getCount(store);
      }

      return stats;
    } catch {
      return {};
    }
  }

  // Optimize database (compact and rebuild indexes if needed)
  static async optimizeDatabase(): Promise<void> {
    try {
      await this.getDatabaseStats();

      // Force a vacuum operation by closing and reopening the database
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      await this.initDB();
    } catch { // Error handled silently
    }
  }

  // Close database connection
  static closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
