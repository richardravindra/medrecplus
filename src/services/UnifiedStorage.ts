import { Patient, Invoice, Appointment, Operator, Treatment, CustomExamination } from '../types';
import { log } from '../utils/logger';

// Type for any data entity
export type DataEntity = Patient | Invoice | Appointment | Operator | Treatment | Record<string, unknown>;

// Type for settings
export type SettingsValue = string | number | boolean | Record<string, unknown>;

// Type for activity logs
export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  details?: Record<string, unknown>;
}

// Type-safe activity log details
export interface ActivityLogDetails {
  operatorName?: string;
  targetType?: string;
  targetId?: string | number;
  targetName?: string;
  patientId?: string | number;
  patientName?: string;
  description?: string;
}

// Type for receipt config
export interface ReceiptConfig {
  header?: string;
  footer?: string;
  businessName?: string;
  address?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

// Type for security settings
export interface SecuritySettings {
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  encryptionEnabled?: boolean;
  twoFactorEnabled?: boolean;
  [key: string]: unknown;
}

// Type for currency settings
export interface CurrencySettings {
  code?: string;
  symbol?: string;
  decimalPlaces?: number;
  thousandSeparator?: string;
  decimalSeparator?: string;
  [key: string]: unknown;
}

// Storage configuration
interface StorageConfig {
  preferredStorage: 'indexeddb' | 'localstorage';
  enableFallback: boolean;
  chunkThreshold: number; // Size in bytes
}

class UnifiedStorage {
  private static instance: UnifiedStorage;
  private config: StorageConfig;
  private isIndexedDBAvailable: boolean = false;

  private constructor() {
    this.config = {
      preferredStorage: 'indexeddb',
      enableFallback: true,
      chunkThreshold: 1024 * 1024 // 1MB
    };

    this.checkIndexedDBAvailability();
  }

  static getInstance(): UnifiedStorage {
    if (!UnifiedStorage.instance) {
      UnifiedStorage.instance = new UnifiedStorage();
    }
    return UnifiedStorage.instance;
  }

  private async checkIndexedDBAvailability(): Promise<void> {
    try {
      if ('indexedDB' in window) {
        const testDB = await this.openDatabase('test-availability');
        if (testDB) {
          testDB.close();
          this.isIndexedDBAvailable = true;
          log.debug('IndexedDB is available', undefined, 'UnifiedStorage');
        }
      }
    } catch (error) {
      this.isIndexedDBAvailable = false;
      log.debug('IndexedDB not available, will use localStorage', { error }, 'UnifiedStorage');
    }

    // Fallback to localStorage if IndexedDB is not available
    if (!this.isIndexedDBAvailable && this.config.preferredStorage === 'indexeddb') {
      this.config.preferredStorage = 'localstorage';
      log.debug('Falling back to localStorage', undefined, 'UnifiedStorage');
    }
  }

  private async openDatabase(name: string): Promise<IDBDatabase | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
      };
    });
  }

  private async storeInIndexedDB(key: string, data: DataEntity[]): Promise<void> {
    if (!this.isIndexedDBAvailable) {
      throw new Error('IndexedDB not available');
    }

    const db = await this.openDatabase('medrec-storage');
    if (!db) throw new Error('Failed to open database');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.put(data, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      transaction.oncomplete = () => db.close();
    });
  }

  private async retrieveFromIndexedDB(key: string): Promise<DataEntity[]> {
    if (!this.isIndexedDBAvailable) {
      throw new Error('IndexedDB not available');
    }

    const db = await this.openDatabase('medrec-storage');
    if (!db) return [];

    return new Promise((resolve) => {
      const transaction = db.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const request = store.get(key);

      request.onerror = () => {
        log.error('IndexedDB retrieval failed', { error: request.error }, 'UnifiedStorage');
        resolve([]);
      };
      request.onsuccess = () => {
        const data = request.result || [];
        db.close();
        resolve(data);
      };
    });
  }

  private storeInLocalStorage(key: string, data: DataEntity[]): void {
    try {
      const serialized = JSON.stringify(data);
      const size = new Blob([serialized]).size;

      if (size > this.config.chunkThreshold) {
        this.storeChunkedInLocalStorage(key, serialized);
      } else {
        localStorage.setItem(key, serialized);
      }

      log.debug(`Stored ${data.length} items in localStorage`, { key, size }, 'UnifiedStorage');
    } catch (error) {
      log.error('localStorage storage failed', { error, key }, 'UnifiedStorage');
      throw error;
    }
  }

  private storeChunkedInLocalStorage(key: string, serialized: string): void {
    const chunkSize = 512 * 1024; // 512KB chunks
    const chunks: string[] = [];

    for (let i = 0; i < serialized.length; i += chunkSize) {
      chunks.push(serialized.slice(i, i + chunkSize));
    }

    // Store chunk count
    localStorage.setItem(`${key}_chunk_count`, chunks.length.toString());

    // Store chunks
    chunks.forEach((chunk, index) => {
      localStorage.setItem(`${key}_chunk_${index}`, chunk);
    });

    log.debug(`Stored ${chunks.length} chunks for ${key}`, { chunks: chunks.length }, 'UnifiedStorage');
  }

  private retrieveFromLocalStorage(key: string): DataEntity[] {
    try {
      // Try direct retrieval first
      const directData = localStorage.getItem(key);
      if (directData) {
        return JSON.parse(directData);
      }

      // Try chunked retrieval
      const chunkCount = localStorage.getItem(`${key}_chunk_count`);
      if (chunkCount) {
        const chunks: string[] = [];
        const count = parseInt(chunkCount);

        for (let i = 0; i < count; i++) {
          const chunk = localStorage.getItem(`${key}_chunk_${i}`);
          if (chunk) {
            chunks.push(chunk);
          } else {
            throw new Error(`Missing chunk ${i} for ${key}`);
          }
        }

        const serialized = chunks.join('');
        return JSON.parse(serialized);
      }

      return [];
    } catch (error) {
      log.error('localStorage retrieval failed', { error, key }, 'UnifiedStorage');
      return [];
    }
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    if (!this.isIndexedDBAvailable) {
      return;
    }

    const db = await this.openDatabase('medrec-storage');
    if (!db) return;

    return new Promise((resolve) => {
      const transaction = db.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.delete(key);

      request.onerror = () => log.error('IndexedDB deletion failed', { error: request.error }, 'UnifiedStorage');
      request.onsuccess = () => resolve();
      transaction.oncomplete = () => db.close();
    });
  }

  private removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key);

      // Remove chunked data if it exists
      const chunkCount = localStorage.getItem(`${key}_chunk_count`);
      if (chunkCount) {
        const count = parseInt(chunkCount);
        for (let i = 0; i < count; i++) {
          localStorage.removeItem(`${key}_chunk_${i}`);
        }
        localStorage.removeItem(`${key}_chunk_count`);
      }
    } catch (error) {
      log.error('localStorage deletion failed', { error, key }, 'UnifiedStorage');
    }
  }

  // Public API
  async store(key: string, data: DataEntity[]): Promise<void> {
    if (!data) {
      log.debug('No data to store', { key }, 'UnifiedStorage');
      return;
    }

    // Store empty arrays too - this is needed for proper deletion
    if (data.length === 0) {
      log.debug(`Storing empty array to clear data for ${key}`, { key }, 'UnifiedStorage');
    }

    try {
      if (this.config.preferredStorage === 'indexeddb' && this.isIndexedDBAvailable) {
        await this.storeInIndexedDB(key, data);
        log.debug(`Stored ${data.length} items in IndexedDB`, { key }, 'UnifiedStorage');
      } else {
        this.storeInLocalStorage(key, data);
      }
    } catch (error) {
      log.error('Storage failed', { error, key }, 'UnifiedStorage');

      // Try fallback if enabled
      if (this.config.enableFallback) {
        try {
          if (this.config.preferredStorage === 'indexeddb') {
            this.storeInLocalStorage(key, data);
            log.debug('Fallback to localStorage successful', { key }, 'UnifiedStorage');
          } else {
            await this.storeInIndexedDB(key, data);
            log.debug('Fallback to IndexedDB successful', { key }, 'UnifiedStorage');
          }
        } catch (fallbackError) {
          log.error('All storage methods failed', { error: fallbackError, key }, 'UnifiedStorage');
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  }

  async retrieve(key: string): Promise<DataEntity[]> {
    try {
      if (this.config.preferredStorage === 'indexeddb' && this.isIndexedDBAvailable) {
        const data = await this.retrieveFromIndexedDB(key);
        if (data && data.length > 0) {
          log.debug(`Retrieved ${data.length} items from IndexedDB`, { key }, 'UnifiedStorage');
          return data;
        }
      }

      // Fallback to localStorage
      const data = this.retrieveFromLocalStorage(key);
      if (data && data.length > 0) {
        log.debug(`Retrieved ${data.length} items from localStorage`, { key }, 'UnifiedStorage');
        return data;
      }

      log.debug('No data found', { key }, 'UnifiedStorage');
      return [];
    } catch (error) {
      log.error('Retrieval failed', { error, key }, 'UnifiedStorage');
      return [];
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.removeFromIndexedDB(key);
      this.removeFromLocalStorage(key);
      log.debug(`Removed data for key: ${key}`, { key }, 'UnifiedStorage');
    } catch (error) {
      log.error('Removal failed', { error, key }, 'UnifiedStorage');
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear IndexedDB
      if (this.isIndexedDBAvailable) {
        const db = await this.openDatabase('medrec-storage');
        if (db) {
          await new Promise<void>((resolve) => {
            const transaction = db.transaction(['data'], 'readwrite');
            const store = transaction.objectStore('data');
            const request = store.clear();

            request.onerror = () => log.error('IndexedDB clear failed', { error: request.error }, 'UnifiedStorage');
            request.onsuccess = () => resolve();
            transaction.oncomplete = () => db.close();
          });
        }
      }

      // Clear localStorage (keeping only essential keys)
      const keysToKeep = ['currentUser', 'settings', 'medrec_dev_encryption_setup'];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      log.debug('All storage cleared', undefined, 'UnifiedStorage');
    } catch (error) {
      log.error('Storage clear failed', { error }, 'UnifiedStorage');
    }
  }

  // Utility methods
  async getStorageInfo(): Promise<{
    preferredStorage: string;
    indexedDBAvailable: boolean;
    localStorageSize: number;
    localStorageKeys: number;
  }> {
    let localStorageSize = 0;
    let localStorageKeys = 0;

    // Calculate localStorage usage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        localStorageSize += value.length;
        localStorageKeys++;
      }
    }

    return {
      preferredStorage: this.config.preferredStorage,
      indexedDBAvailable: this.isIndexedDBAvailable,
      localStorageSize,
      localStorageKeys
    };
  }

  // Type-specific convenience methods
  async storePatients(patients: Patient[]): Promise<void> {
    await this.store('patients', patients);
  }

  async getPatients(): Promise<Patient[]> {
    // First try the new key
    let data = await this.retrieve('patients');

    // If no data found, try the legacy key for backward compatibility
    if (data.length === 0) {
      data = await this.retrieve('patient_management_data');
      if (data.length > 0) {
        log.debug('Found patients data under legacy key, migrating to new key', { count: data.length }, 'UnifiedStorage');
        // Migrate to new key for future use
        await this.store('patients', data);
        log.debug('Successfully migrated patients data to new key', undefined, 'UnifiedStorage');
      }
    }

    return data.filter(item => 'record_number' in item && 'name' in item && 'age' in item) as Patient[];
  }

  async storeAppointments(appointments: Appointment[]): Promise<void> {
    await this.store('appointments', appointments);
  }

  async getAppointments(): Promise<Appointment[]> {
    const data = await this.retrieve('appointments');
    return data.filter(item => 'patientName' in item && 'operatorName' in item && 'date' in item) as Appointment[];
  }

  async storeInvoices(invoices: Invoice[]): Promise<void> {
    await this.store('invoices', invoices);
  }

  async getInvoices(): Promise<Invoice[]> {
    const data = await this.retrieve('invoices');
    return data.filter(item => 'invoiceNumber' in item && 'totalAmount' in item) as Invoice[];
  }

  async storeOperators(operators: Operator[]): Promise<void> {
    await this.store('operators', operators);
  }

  async getOperators(): Promise<Operator[]> {
    const data = await this.retrieve('operators');
    return data.filter(item => 'role' in item && 'name' in item && !('record_number' in item)) as Operator[];
  }

  async storeTreatments(treatments: Treatment[]): Promise<void> {
    await this.store('treatments', treatments);
  }

  async getTreatments(): Promise<Treatment[]> {
    const data = await this.retrieve('treatments');
    return data.filter(item => ('price' in item && 'name' in item) || ('id' in item && 'name' in item && 'price' in item)) as Treatment[];
  }

  async storeCustomExaminations(examinations: CustomExamination[]): Promise<void> {
    await this.store('custom_examinations', examinations);
  }

  async getCustomExaminations(): Promise<CustomExamination[]> {
    const data = await this.retrieve('custom_examinations');
    return data.filter(item => 'name' in item && 'unit' in item && 'created_at' in item) as CustomExamination[];
  }

  // Settings Management
  async storeSettings(settings: Record<string, SettingsValue>): Promise<void> {
    try {
      // Store in IndexedDB first
      await this.store('app_settings', [settings]);

      // Also store in localStorage as backup for development persistence
      localStorage.setItem('medrec_dev_settings_backup', JSON.stringify(settings));
      // Debug logging removed - settings stored in both IndexedDB and localStorage backup
    } catch (error) {
      console.error('❌ Failed to store settings:', error);
      // Fallback to localStorage only
      try {
        localStorage.setItem('medrec_dev_settings_backup', JSON.stringify(settings));
        // Debug logging removed - settings stored in localStorage fallback only
      } catch (fallbackError) {
        console.error('❌ Even localStorage fallback failed:', fallbackError);
      }
    }
  }

  async getSettings(): Promise<Record<string, SettingsValue>> {
    try {
      // Try IndexedDB first
      const data = await this.retrieve('app_settings');
      if (data.length > 0) {
        // Debug logging removed - settings retrieved from IndexedDB
        return data[0] as Record<string, SettingsValue>;
      }
    } catch (error) {
      console.warn('⚠️ Failed to retrieve from IndexedDB:', error);
    }

    // Fallback to localStorage backup
    try {
      const backupSettings = localStorage.getItem('medrec_dev_settings_backup');
      if (backupSettings) {
        // Debug logging removed - settings retrieved from localStorage backup
        return JSON.parse(backupSettings);
      }
    } catch (error) {
      console.warn('⚠️ Failed to retrieve from localStorage backup:', error);
    }

    // Debug logging removed - no settings found, returning empty object
    return {};
  }

  async updateSetting(key: string, value: SettingsValue): Promise<void> {
    const currentSettings = await this.getSettings();
    currentSettings[key] = value;
    await this.storeSettings(currentSettings);
  }

  async getSetting(key: string, defaultValue?: SettingsValue): Promise<SettingsValue> {
    const settings = await this.getSettings();
    return settings[key] !== undefined ? settings[key] : (defaultValue || '' as SettingsValue);
  }

  // Activity Logs Management
  async storeActivityLogs(logs: ActivityLog[]): Promise<void> {
    await this.store('activity_logs', logs as unknown as DataEntity[]);
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return await this.retrieve('activity_logs') as unknown as ActivityLog[];
  }

  async addActivityLog(log: ActivityLog): Promise<void> {
    const logs = await this.getActivityLogs();
    logs.push(log);
    await this.storeActivityLogs(logs);
  }

  // Receipt Configuration Management
  async storeReceiptConfig(config: ReceiptConfig): Promise<void> {
    await this.updateSetting('receipt_config', config);
  }

  async getReceiptConfig(): Promise<ReceiptConfig> {
    return await this.getSetting('receipt_config', {} as unknown as SettingsValue) as ReceiptConfig;
  }

  // Security Settings Management
  async storeSecuritySettings(settings: SecuritySettings): Promise<void> {
    await this.updateSetting('security_settings', settings);
  }

  async getSecuritySettings(): Promise<SecuritySettings> {
    return await this.getSetting('security_settings', {} as unknown as SettingsValue) as SecuritySettings;
  }

  // Currency Settings Management
  async storeCurrencySettings(settings: CurrencySettings): Promise<void> {
    await this.updateSetting('currency_settings', settings);
  }

  async getCurrencySettings(): Promise<CurrencySettings> {
    return await this.getSetting('currency_settings', {
      currency: 'IDR',
      symbol: 'Rp',
      locale: 'id-ID'
    } as unknown as SettingsValue) as CurrencySettings;
  }

  // Log Tracking Management
  async setLogsLastSeen(logId: string): Promise<void> {
    await this.updateSetting('logs_last_seen', logId as unknown as SettingsValue);
  }

  async getLogsLastSeen(): Promise<string> {
    return await this.getSetting('logs_last_seen', '0' as unknown as SettingsValue) as string;
  }

  // Password/Encryption Management
  async storePassword(password: string): Promise<void> {
    await this.updateSetting('medrec_dev_password', password);
  }

  async getPassword(): Promise<string | null> {
    return await this.getSetting('medrec_dev_password', null as unknown as SettingsValue) as string | null;
  }

  async clearPassword(): Promise<void> {
    await this.updateSetting('medrec_dev_password', null as unknown as SettingsValue);
  }

  async setEncryptionSetup(complete: boolean): Promise<void> {
    await this.updateSetting('medrec_dev_encryption_setup', complete);
  }

  async getEncryptionSetup(): Promise<boolean> {
    return await this.getSetting('medrec_dev_encryption_setup', false as unknown as SettingsValue) as boolean;
  }

  async clearEncryptionSetup(): Promise<void> {
    await this.updateSetting('medrec_dev_encryption_setup', false);
  }

  // Development helper: Force settings sync
  async syncSettings(): Promise<void> {
    // Debug logging removed - forcing settings sync
    try {
      const currentSettings = await this.getSettings();
      // Debug logging removed - current settings before sync
      await this.storeSettings(currentSettings);
      // Debug logging removed - settings sync complete
    } catch (error) {
      console.error('❌ Settings sync failed:', error);
    }
  }

  // Type-safe utility functions
  static convertActivityLogToLogEntry(activityLog: ActivityLog): {
    id: number;
    action: string;
    operatorName: string;
    targetType: 'patient' | 'appointment' | 'invoice';
    targetId?: number;
    targetName?: string;
    patientId?: number;
    patientName?: string;
    timestamp: string;
    details?: string;
  } {
    const details = activityLog.details as ActivityLogDetails || {};

    return {
      id: parseInt(activityLog.id) || Date.now(),
      action: activityLog.action,
      operatorName: details.operatorName || 'Unknown',
      targetType: (details.targetType as 'patient' | 'appointment' | 'invoice') || 'patient',
      targetId: details.targetId ? parseInt(String(details.targetId)) : undefined,
      targetName: details.targetName,
      patientId: details.patientId ? parseInt(String(details.patientId)) : undefined,
      patientName: details.patientName,
      timestamp: activityLog.timestamp,
      details: details.description
    };
  }
}

// Export singleton instance and class
export const storage = UnifiedStorage.getInstance();
export { UnifiedStorage };

export default storage;