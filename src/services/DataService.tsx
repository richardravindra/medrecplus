import { IndexedDBStorage } from '../utils/IndexedDBStorage';
import { ChunkedDataRestore } from '../utils/ChunkedDataRestore';
import { Patient, Invoice } from '../types';

// Generic type for data entities
type DataEntity = Patient | Invoice | Record<string, unknown>;

export class DataService {
  // Universal data retrieval - tries IndexedDB first, then localStorage
  static async getData(key: string): Promise<DataEntity[]> {
    try {
      // Try IndexedDB first
      const indexedDBData = await IndexedDBStorage.getData(key);
      if (indexedDBData && indexedDBData.length > 0) {
        console.log(`📊 Retrieved ${indexedDBData.length} ${key} from IndexedDB`);
        return indexedDBData;
      }
    } catch (error) {
      console.log(`⚠️ IndexedDB read failed for ${key}, trying localStorage:`, error);
    }

    // Fallback to localStorage (including chunked data)
    try {
      const localStorageData = ChunkedDataRestore.getDataFromStorage(key);
      if (localStorageData && localStorageData.length > 0) {
        console.log(`📊 Retrieved ${localStorageData.length} ${key} from localStorage`);
        return localStorageData;
      }
    } catch (error) {
      console.log(`❌ localStorage read failed for ${key}:`, error);
    }

    console.log(`📭 No data found for ${key}`);
    return [];
  }

  // Synchronous fallback for components that haven't been updated to async yet
  static getDataSync(key: string): DataEntity[] {
    try {
      // Try localStorage first for sync access
      const localStorageData = ChunkedDataRestore.getDataFromStorage(key);
      if (localStorageData && localStorageData.length > 0) {
        console.log(`📊 Sync retrieved ${localStorageData.length} ${key} from localStorage`);
        return localStorageData;
      }
    } catch (error) {
      console.log(`❌ Sync localStorage read failed for ${key}:`, error);
    }

    return [];
  }

  // Get operators
  static async getOperators(): Promise<DataEntity[]> {
    return this.getData('operators');
  }

  static getOperatorsSync(): DataEntity[] {
    return this.getDataSync('operators');
  }

  // Get treatments
  static async getTreatments(): Promise<DataEntity[]> {
    return this.getData('treatments');
  }

  static getTreatmentsSync(): DataEntity[] {
    return this.getDataSync('treatments');
  }

  // Get patients
  static async getPatients(): Promise<Patient[]> {
    return this.getData('patient_management_data') as Patient[];
  }

  static getPatientsSync(): Patient[] {
    return this.getDataSync('patient_management_data') as Patient[];
  }

  // Get appointments
  static async getAppointments(): Promise<DataEntity[]> {
    return this.getData('appointments');
  }

  static getAppointmentsSync(): DataEntity[] {
    return this.getDataSync('appointments');
  }

  // Get invoices
  static async getInvoices(): Promise<Invoice[]> {
    return this.getData('invoices') as Invoice[];
  }

  static getInvoicesSync(): Invoice[] {
    return this.getDataSync('invoices') as Invoice[];
  }

  // Save data (uses appropriate storage based on size)
  static async saveData(key: string, data: DataEntity[]): Promise<void> {
    const dataSize = JSON.stringify(data).length;
    const localStorageLimit = 5 * 1024 * 1024; // 5MB

    if (dataSize > localStorageLimit) {
      console.log(`💾 Saving ${data.length} ${key} to IndexedDB (${(dataSize / 1024 / 1024).toFixed(2)}MB)`);
      await IndexedDBStorage.saveData(key, data);
    } else {
      console.log(`💾 Saving ${data.length} ${key} to localStorage (${(dataSize / 1024).toFixed(2)}KB)`);
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // Get data with search and pagination for patients
  static async getPatientsPaginated(search?: string, page = 1, pageSize = 50): Promise<{
    patients: Patient[];
    totalCount: number;
    totalPages: number;
  }> {
    let patients = await this.getPatients();

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

  // Get data with search and pagination for appointments
  static async getAppointmentsPaginated(search?: string, page = 1, pageSize = 50): Promise<{
    appointments: DataEntity[];
    totalCount: number;
    totalPages: number;
  }> {
    let appointments = await this.getAppointments();

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

  // Get data with search and pagination for invoices
  static async getInvoicesPaginated(search?: string, status?: string, page = 1, pageSize = 50): Promise<{
    invoices: Invoice[];
    totalCount: number;
    totalPages: number;
  }> {
    let invoices = await this.getInvoices();

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
    const patients = await this.getPatients();
    return patients.find(patient => patient.id === id) || null;
  }

  // Get appointments by patient ID
  static async getAppointmentsByPatientId(patientId: number): Promise<DataEntity[]> {
    const appointments = await this.getAppointments();
    return appointments
      .filter(appointment => appointment.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get invoices by patient ID
  static async getInvoicesByPatientId(patientId: number): Promise<Invoice[]> {
    const invoices = await this.getInvoices();
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
    const [patients, appointments, invoices] = await Promise.all([
      this.getPatients(),
      this.getAppointments(),
      this.getInvoices()
    ]);

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

  // Debug method to check data sources
  static async debugDataSources(): Promise<void> {
    console.log('🔍 Debugging data sources...');

    const sources = ['operators', 'treatments', 'patient_management_data', 'appointments', 'invoices'];

    for (const source of sources) {
      try {
        const indexedDBData = await IndexedDBStorage.getData(source);
        const localStorageData = ChunkedDataRestore.getDataFromStorage(source);

        console.log(`📊 ${source}:`, {
          indexedDB: indexedDBData.length,
          localStorage: localStorageData.length,
          total: indexedDBData.length + localStorageData.length
        });
      } catch (error) {
        console.log(`❌ Error checking ${source}:`, error);
      }
    }

    // Check IndexedDB storage info
    try {
      const storageInfo = await IndexedDBStorage.getStorageInfo();
      console.log('💾 IndexedDB Storage Info:', storageInfo);
    } catch (error) {
      console.log('❌ Error getting storage info:', error);
    }
  }

  // Clear all data (both IndexedDB and localStorage)
  static async clearAll(): Promise<void> {
    console.log('🗑️ Clearing all data...');

    try {
      await IndexedDBStorage.clearAll();

      // Clear localStorage
      const keysToKeep = ['currentUser', 'settings'];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }
}