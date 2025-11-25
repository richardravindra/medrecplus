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

// Type guard functions
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

function isReceiptConfig(entity: DataEntity): entity is ReceiptConfig {
  return 'header' in entity && 'footer' in entity;
}

// Generic type for data entities - includes all possible types with index signature
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

export class DataService {
  // Universal data retrieval - tries IndexedDB first, then localStorage
  static async getData(key: string): Promise<DataEntity[]> {
    try {
      // Try IndexedDB first
      const indexedDBData = await IndexedDBStorage.getData(key);
      if (indexedDBData && indexedDBData.length > 0) {
        return indexedDBData;
      }
    } catch { // Error handled silently
    }

    // Fallback to localStorage (including chunked data)
    try {
      const localStorageData = ChunkedDataRestore.getDataFromStorage(key);
      if (localStorageData && localStorageData.length > 0) {
        return localStorageData;
      }
    } catch { // Error handled silently
    }

    return [];
  }

  // Synchronous fallback for components that haven't been updated to async yet
  static getDataSync(key: string): DataEntity[] {
    try {
      // Try localStorage first for sync access
      const localStorageData = ChunkedDataRestore.getDataFromStorage(key);
      if (localStorageData && localStorageData.length > 0) {
        return localStorageData;
      }
    } catch { // Error handled silently
    }

    return [];
  }

  // Get patients
  static async getPatients(): Promise<Patient[]> {
    const data = await this.getData('patient_management_data');
    return data.filter(isPatient);
  }

  static getPatientsSync(): Patient[] {
    const data = this.getDataSync('patient_management_data');
    return data.filter(isPatient);
  }

  // Get appointments
  static async getAppointments(): Promise<Appointment[]> {
    const data = await this.getData('appointments');
    return data.filter(isAppointment);
  }

  static getAppointmentsSync(): Appointment[] {
    const data = this.getDataSync('appointments');
    return data.filter(isAppointment);
  }

  // Get invoices
  static async getInvoices(): Promise<Invoice[]> {
    const data = await this.getData('invoices');
    return data.filter(isInvoice);
  }

  static getInvoicesSync(): Invoice[] {
    const data = this.getDataSync('invoices');
    return data.filter(isInvoice);
  }

  // Get operators
  static async getOperators(): Promise<Operator[]> {
    const data = await this.getData('operators');
    return data.filter(isOperator);
  }

  static getOperatorsSync(): Operator[] {
    const data = this.getDataSync('operators');
    return data.filter(isOperator);
  }

  // Get custom examinations
  static async getCustomExaminations(): Promise<CustomExamination[]> {
    const data = await this.getData('custom_examinations');
    return data.filter(isCustomExamination);
  }

  static getCustomExaminationsSync(): CustomExamination[] {
    const data = this.getDataSync('custom_examinations');
    return data.filter(isCustomExamination);
  }

  // Get receipt config
  static async getReceiptConfig(): Promise<ReceiptConfig | null> {
    const data = await this.getData('receipt_config');
    const configs = data.filter(isReceiptConfig);
    return configs.length > 0 ? configs[0] : null;
  }

  static getReceiptConfigSync(): ReceiptConfig | null {
    const data = this.getDataSync('receipt_config');
    const configs = data.filter(isReceiptConfig);
    return configs.length > 0 ? configs[0] : null;
  }

  // Get treatments
  static async getTreatments(): Promise<Treatment[]> {
    const data = await this.getData('treatments');
    // Cast to Treatment[] after validation
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

  static getTreatmentsSync(): Treatment[] {
    const data = this.getDataSync('treatments');
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

  // Save data (uses appropriate storage based on size)
  static async saveData(key: string, data: DataEntity[]): Promise<void> {
    const dataSize = JSON.stringify(data).length;
    const localStorageLimit = 5 * 1024 * 1024; // 5MB

    if (dataSize > localStorageLimit) {
      await IndexedDBStorage.saveData(key, data);
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // Get data with search and pagination for patients
  static async getPatientsPaginated(
    search?: string,
    page = 1,
    pageSize = 50
  ): Promise<{
    patients: Patient[];
    totalCount: number;
    totalPages: number;
  }> {
    let patients = await this.getPatients();

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter(
        patient =>
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
  static async getAppointmentsPaginated(
    search?: string,
    page = 1,
    pageSize = 50
  ): Promise<{
    appointments: Appointment[];
    totalCount: number;
    totalPages: number;
  }> {
    let appointments = await this.getAppointments();

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      appointments = appointments.filter(
        appointment =>
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
  static async getInvoicesPaginated(
    search?: string,
    status?: string,
    page = 1,
    pageSize = 50
  ): Promise<{
    invoices: Invoice[];
    totalCount: number;
    totalPages: number;
  }> {
    let invoices = await this.getInvoices();

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      invoices = invoices.filter(
        invoice =>
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
  static async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
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

    const sources = [
      'operators',
      'treatments',
      'patient_management_data',
      'appointments',
      'invoices'
    ];

    for (const source of sources) {
      try {
        await IndexedDBStorage.getData(source);
        ChunkedDataRestore.getDataFromStorage(source);
      } catch { // Error handled silently
    }
    }

    // Check IndexedDB storage info
    try {
      await IndexedDBStorage.getStorageInfo();
    } catch { // Error handled silently
    }
  }

  // Clear all data (both IndexedDB and localStorage)
  static async clearAll(): Promise<void> {

    await IndexedDBStorage.clearAll();

    // Clear localStorage
    const keysToKeep = ['currentUser', 'settings'];
    const allKeys = Object.keys(localStorage);

    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }
}
