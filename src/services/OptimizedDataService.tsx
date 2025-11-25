import { IndexedDBStorage } from '../utils/IndexedDBStorage';
import { ChunkedDataRestore } from '../utils/ChunkedDataRestore';
import {
  Patient,
  Invoice,
  Appointment,
  VitalSigns,
  Treatment,
  Operator,
  CustomExamination,
  ReceiptConfig
} from '../types';
import { log } from '../utils/logger';

// Type guard functions (same as original DataService)
function isPatient(entity: DataEntity): entity is Patient {
  return 'record_number' in entity && 'name' in entity && 'age' in entity;
}

function isInvoice(entity: DataEntity): entity is Invoice {
  return 'invoiceNumber' in entity && 'appointmentId' in entity;
}

function isAppointment(entity: DataEntity): entity is Appointment {
  return (
    'patientName' in entity &&
    'operatorName' in entity &&
    'date' in entity &&
    'vitalSigns' in entity
  );
}

function isOperator(entity: DataEntity): entity is Operator {
  return 'role' in entity && 'id' in entity && 'name' in entity && !('record_number' in entity);
}

function isCustomExamination(entity: DataEntity): entity is CustomExamination {
  return 'unit' in entity && 'id' in entity && 'name' in entity && !('record_number' in entity);
}

export type DataEntity =
  | (Patient & Record<string, unknown>)
  | (Invoice & Record<string, unknown>)
  | (Appointment & Record<string, unknown>)
  | (Operator & Record<string, unknown>)
  | (CustomExamination & Record<string, unknown>)
  | (ReceiptConfig & Record<string, unknown>)
  | (Record<string, unknown> & {
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

// Cache configuration
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  queryHash: string;
}

// Pagination interface
interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Query options interface
interface QueryOptions {
  search?: string;
  filters?: Record<string, string | number | boolean>;
  pagination?: PaginationOptions;
}

export class OptimizedDataService {
  private static cache = new Map<string, CacheEntry<DataEntity[]>>();
  private static readonly DEFAULT_CACHE_CONFIG: CacheConfig = {
    maxSize: 100,
    ttl: 5 * 60 * 1000 // 5 minutes
  };

  // Memory cleanup interval
  private static cleanupInterval: number | null = null;

  static {
    // Start cleanup interval
    this.startCleanupInterval();
  }

  // Private helper methods
  private static startCleanupInterval(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = window.setInterval(() => {
      this.cleanupCache();
    }, 60000); // Cleanup every minute
  }

  private static cleanupCache(): void {
    const now = Date.now();
    const config = this.DEFAULT_CACHE_CONFIG;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > config.ttl) {
        this.cache.delete(key);
      }
    }

    // If cache is too large, remove oldest entries
    if (this.cache.size > config.maxSize) {
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const toRemove = entries.slice(0, this.cache.size - config.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private static generateQueryHash(options: QueryOptions): string {
    return JSON.stringify(options);
  }

  private static async getDataWithCache(
    key: string,
    options: QueryOptions = {}
  ): Promise<DataEntity[]> {
    const queryHash = this.generateQueryHash(options);
    const cacheKey = `${key}_${queryHash}`;
    const now = Date.now();

    // Check cache first
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && now - cachedEntry.timestamp < this.DEFAULT_CACHE_CONFIG.ttl) {
      log.debug(`Cache hit for ${key}`, { queryHash }, 'DataService');
      return cachedEntry.data;
    }

    // Load data from storage
    log.debug(`Loading ${key} from storage`, undefined, 'DataService');
    const data = await this.getDataFromStorage(key);

    // Apply filters and pagination
    const filteredData = this.applyFilters(data, options);

    // Cache the result
    this.cache.set(cacheKey, {
      data: filteredData,
      timestamp: now,
      queryHash
    });

    log.debug(`Loaded and cached ${filteredData.length} ${key} records`, undefined, 'DataService');
    return filteredData;
  }

  private static async getDataFromStorage(key: string): Promise<DataEntity[]> {
    try {
      // Try IndexedDB first
      const indexedDBData = await IndexedDBStorage.getData(key);
      if (indexedDBData && indexedDBData.length > 0) {
        log.debug(
          `Retrieved ${indexedDBData.length} ${key} from IndexedDB`,
          undefined,
          'DataService'
        );
        return indexedDBData;
      }
    } catch (error) {
      log.warn(`IndexedDB read failed for ${key}, trying localStorage`, { error }, 'DataService');
    }

    // Fallback to localStorage
    try {
      const localStorageData = ChunkedDataRestore.getDataFromStorage(key);
      if (localStorageData && localStorageData.length > 0) {
        log.debug(
          `Retrieved ${localStorageData.length} ${key} from localStorage`,
          undefined,
          'DataService'
        );
        return localStorageData;
      }
    } catch (error) {
      log.error(`localStorage read failed for ${key}`, { error }, 'DataService');
    }

    return [];
  }

  private static applyFilters(data: DataEntity[], options: QueryOptions): DataEntity[] {
    let filtered = [...data];

    // Apply search filter
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = filtered.filter(item => {
        return Object.values(item).some(
          value => value && typeof value === 'string' && value.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Apply custom filters
    if (options.filters) {
      filtered = filtered.filter(item => {
        return Object.entries(options.filters || {}).every(([key, value]) => {
          if (value === undefined || value === null) return true;
          return (item as Record<string, unknown>)[key] === value;
        });
      });
    }

    // Apply pagination
    if (options.pagination) {
      const { page, limit, sortBy, sortOrder } = options.pagination;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      // Apply sorting
      if (sortBy) {
        filtered.sort((a, b) => {
          const aValue = (a as Record<string, unknown>)[sortBy];
          const bValue = (b as Record<string, unknown>)[sortBy];

          if (aValue === undefined || aValue === null) return 1;
          if (bValue === undefined || bValue === null) return -1;

          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          if (aValue > bValue) comparison = 1;

          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      filtered = filtered.slice(startIndex, endIndex);
    }

    return filtered;
  }

  // Optimized data access methods
  static async getPatients(options: QueryOptions = {}): Promise<Patient[]> {
    const data = await this.getDataWithCache('patient_management_data', options);
    return data.filter(isPatient);
  }

  static async getPatientsPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ patients: Patient[]; total: number; hasMore: boolean }> {
    const allPatients = await this.getPatients({ search });
    const total = allPatients.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const patients = allPatients.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    return { patients, total, hasMore };
  }

  static async getAppointments(options: QueryOptions = {}): Promise<Appointment[]> {
    const data = await this.getDataWithCache('appointments', options);
    return data.filter(isAppointment);
  }

  static async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return this.getAppointments({
      filters: { patientId }
    });
  }

  static async getInvoices(options: QueryOptions = {}): Promise<Invoice[]> {
    const data = await this.getDataWithCache('invoices', options);
    return data.filter(isInvoice);
  }

  static async getInvoicesByPatientId(patientId: number): Promise<Invoice[]> {
    return this.getInvoices({
      filters: { patientId }
    });
  }

  static async getOperators(options: QueryOptions = {}): Promise<Operator[]> {
    const data = await this.getDataWithCache('operators', options);
    return data.filter(isOperator);
  }

  static async getCustomExaminations(options: QueryOptions = {}): Promise<CustomExamination[]> {
    const data = await this.getDataWithCache('custom_examinations', options);
    return data.filter(isCustomExamination);
  }

  static async getTreatments(options: QueryOptions = {}): Promise<Treatment[]> {
    const data = await this.getDataWithCache('treatments', options);
    return data.filter((item): item is Treatment => {
      if (typeof item !== 'object' || item === null) return false;
      const candidate = item as Record<string, unknown>;
      return (
        typeof candidate.id === 'number' &&
        typeof candidate.name === 'string' &&
        typeof candidate.price === 'number'
      );
    });
  }

  // Cache management methods
  static clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    log.debug(
      `Cache cleared${pattern ? ` for pattern: ${pattern}` : ''}`,
      undefined,
      'DataService'
    );
  }

  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Preload commonly accessed data
  static async preloadCommonData(): Promise<void> {
    log.debug('Preloading commonly accessed data...', undefined, 'DataService');

    try {
      // Preload first page of patients (most common access)
      await this.getPatientsPaginated(1, 10);

      // Preload operators (needed for dropdowns)
      await this.getOperators();

      // Preload treatments (needed for appointment forms)
      await this.getTreatments();

      log.debug('Common data preloaded successfully', undefined, 'DataService');
    } catch (error) {
      log.error('Error preloading common data', { error }, 'DataService');
    }
  }

  // Cleanup method for app shutdown
  static cleanup(): void {
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    log.debug('OptimizedDataService cleaned up', undefined, 'DataService');
  }
}
