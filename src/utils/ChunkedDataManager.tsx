import { ChunkedDataRestore } from './ChunkedDataRestore';
import { IndexedDBStorage } from './IndexedDBStorage';
import { Patient, Invoice } from '../types';

// Generic type for data entities
type DataEntity = Patient | Invoice | Record<string, unknown>;

export class ChunkedDataManager {
  // Get data with chunked storage support
  static async getData(key: string): Promise<DataEntity[]> {
    try {
      // Try IndexedDB first
      return await IndexedDBStorage.getData(key);
    } catch {
      // Fallback to chunked localStorage
      return ChunkedDataRestore.getDataFromStorage(key);
    }
  }

  // Save data with chunked storage support
  static async saveData(key: string, data: DataEntity[]): Promise<void> {
    const dataSize = JSON.stringify(data).length;
    const localStorageLimit = 5 * 1024 * 1024; // 5MB

    if (dataSize > localStorageLimit) {
      // Use IndexedDB for large datasets
      await IndexedDBStorage.saveData(key, data);
    } else {
      // Use localStorage for smaller datasets
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // Get patients with search and pagination support
  static async getPatients(search?: string, page = 1, pageSize = 50): Promise<{
    patients: Patient[];
    totalCount: number;
    totalPages: number;
  }> {
    let patients = await this.getData('patient_management_data');

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter(patient =>
        patient.name?.toLowerCase().includes(searchLower) ||
        patient.record_number?.toLowerCase().includes(searchLower) ||
        patient.phone_number?.toLowerCase().includes(searchLower) ||
        patient.initial_diagnosis?.toLowerCase().includes(searchLower)
      );
    }

    const totalCount = patients.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      patients: patients.slice(startIndex, endIndex),
      totalCount,
      totalPages
    };
  }

  // Get appointments with search and pagination support
  static async getAppointments(search?: string, page = 1, pageSize = 50): Promise<{
    appointments: DataEntity[];
    totalCount: number;
    totalPages: number;
  }> {
    let appointments = await this.getData('appointments');

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      appointments = appointments.filter(appointment =>
        appointment.patientName?.toLowerCase().includes(searchLower) ||
        appointment.operatorName?.toLowerCase().includes(searchLower) ||
        appointment.date?.includes(search)
      );
    }

    // Sort by date (newest first)
    appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCount = appointments.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      appointments: appointments.slice(startIndex, endIndex),
      totalCount,
      totalPages
    };
  }

  // Get invoices with search and pagination support
  static async getInvoices(search?: string, status?: string, page = 1, pageSize = 50): Promise<{
    invoices: Invoice[];
    totalCount: number;
    totalPages: number;
  }> {
    let invoices = await this.getData('invoices');

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      invoices = invoices.filter(invoice =>
        invoice.patientName?.toLowerCase().includes(searchLower) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
        invoice.operatorName?.toLowerCase().includes(searchLower)
      );
    }

    if (status && status !== 'all') {
      invoices = invoices.filter(invoice => invoice.status === status);
    }

    // Sort by date (newest first)
    invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCount = invoices.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      invoices: invoices.slice(startIndex, endIndex),
      totalCount,
      totalPages
    };
  }

  // Get single patient by ID
  static async getPatientById(id: number): Promise<Patient | null> {
    const patients = await this.getData('patient_management_data') as Patient[];
    return patients.find(patient => patient.id === id) || null;
  }

  // Get appointments by patient ID
  static async getAppointmentsByPatientId(patientId: number): Promise<DataEntity[]> {
    const appointments = await this.getData('appointments');
    return appointments
      .filter(appointment => appointment.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get invoices by patient ID
  static async getInvoicesByPatientId(patientId: number): Promise<Invoice[]> {
    const invoices = await this.getData('invoices') as Invoice[];
    return invoices
      .filter(invoice => invoice.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get statistics
  static async getStatistics(): Promise<{
    totalPatients: number;
    totalAppointments: number;
    totalInvoices: number;
    totalRevenue: number;
    recentAppointments: DataEntity[];
    recentInvoices: Invoice[];
  }> {
    const patients = await this.getData('patient_management_data');
    const appointments = await this.getData('appointments');
    const invoices = await this.getData('invoices');

    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    const recentAppointments = appointments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const recentInvoices = invoices
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      totalInvoices: invoices.length,
      totalRevenue,
      recentAppointments,
      recentInvoices
    };
  }

  // Check if data is stored in chunks
  static isDataChunked(key: string): boolean {
    return !!localStorage.getItem(`${key}_chunk_count`);
  }

  // Get storage info
  static async getStorageInfo(): Promise<{
    totalKeys: number;
    chunkedKeys: string[];
    estimatedSize: string;
    indexedDBInfo: { available: boolean; quota?: number; used?: number; } | null;
  }> {
    let totalKeys = 0;
    const chunkedKeys: string[] = [];
    let totalSize = 0;

    // Count localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalKeys++;
        const value = localStorage.getItem(key) || '';
        totalSize += value.length;

        if (key.includes('_chunk_')) {
          const baseKey = key.split('_chunk_')[0];
          if (!chunkedKeys.includes(baseKey)) {
            chunkedKeys.push(baseKey);
          }
        } else if (localStorage.getItem(`${key}_chunk_count`)) {
          if (!chunkedKeys.includes(key)) {
            chunkedKeys.push(key);
          }
        }
      }
    }

    // Get IndexedDB info
    const indexedDBInfo = await IndexedDBStorage.getStorageInfo();

    const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);

    return {
      totalKeys,
      chunkedKeys,
      estimatedSize: `${sizeInMB} MB (localStorage) + ${indexedDBInfo.totalSize}`,
      indexedDBInfo
    };
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    try {
      // Clear IndexedDB
      await IndexedDBStorage.clearAll();

      // Clear localStorage
      const keysToKeep = ['currentUser', 'settings'];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Clear all data error:', error);
      throw error;
    }
  }

  // Cleanup old data
  static async cleanupOldData(daysOld = 30): Promise<void> {
    try {
      await IndexedDBStorage.cleanupOldData(daysOld);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}