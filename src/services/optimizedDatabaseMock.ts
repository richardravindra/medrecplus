import { Patient, Appointment, Invoice, VitalSigns, Treatment } from '../types';
import { OptimizedDataService } from './OptimizedDataService';

const STORAGE_KEY = 'patient_management_data';
const RECORD_COUNTER_KEY = 'patient_record_counter';
const APPOINTMENTS_KEY = 'appointments';
const INVOICES_KEY = 'invoices';

// Template data for first-time users
const templateData: Patient[] = [
  {
    id: 1,
    record_number: "PT202500001",
    name: "John Doe",
    age: 45,
    address: "123 Main St, City, State 12345",
    phone_number: "+1-555-0123",
    initial_diagnosis: "Hypertension, Type 2 Diabetes",
    created_at: "2025-01-15T10:30:00Z"
  },
  {
    id: 2,
    record_number: "PT202500002",
    name: "Jane Smith",
    age: 32,
    address: "456 Oak Ave, Town, State 67890",
    phone_number: "+1-555-0456",
    initial_diagnosis: "Diabetes Mellitus Type 1",
    created_at: "2025-01-16T14:20:00Z"
  },
  {
    id: 3,
    record_number: "PT202500003",
    name: "Robert Johnson",
    age: 58,
    address: "789 Pine Rd, Village, State 11111",
    phone_number: "+1-555-0789",
    initial_diagnosis: "Coronary Artery Disease",
    created_at: "2025-01-17T09:15:00Z"
  }
];


const getInitialPatientsSync = (): Patient[] => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (existingData) {
      const parsedData = JSON.parse(existingData);
      if (parsedData.length > 0) {
        return parsedData;
      }
    }
  } catch (error) {
    console.error("Error parsing localStorage data:", error);
  }

  // Return template data if no data found
  return templateData;
};

const getNextId = (): number => {
  const patients = getInitialPatientsSync();
  if (patients.length === 0) return 1;
  return Math.max(...patients.map((p: Patient) => p.id || 0)) + 1;
};

const savePatients = async (patients: Patient[]): Promise<void> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    console.log(`💾 Saved ${patients.length} patients to localStorage`);
  } catch (error) {
    console.error("❌ Failed to save patients:", error);
  }
};

export const optimizedDatabaseService = {
  // Lazy loading with pagination
  async getPatients(page: number = 1, limit: number = 10, search?: string): Promise<{ patients: Patient[]; total: number; hasMore: boolean }> {
    try {
      return await OptimizedDataService.getPatientsPaginated(page, limit, search);
    } catch (error) {
      console.error("Error in getPatients:", error);
      // Fallback to sync method
      const patients = getInitialPatientsSync();
      const filtered = search ? patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.record_number.toLowerCase().includes(search.toLowerCase())
      ) : patients;

      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPatients = filtered.sort((a, b) => b.id! - a.id!).slice(startIndex, endIndex);
      const hasMore = endIndex < total;

      return { patients: paginatedPatients, total, hasMore };
    }
  },

  // Get single patient by ID (lazy loading)
  async getPatientById(id: number): Promise<Patient | null> {
    try {
      const patients = await OptimizedDataService.getPatients({
        filters: { id }
      });
      return patients.length > 0 ? patients[0] : null;
    } catch (error) {
      console.error("Error getting patient by ID:", error);
      const patients = getInitialPatientsSync();
      return patients.find(p => p.id === id) || null;
    }
  },

  // Search patients (optimized)
  async searchPatients(query: string, limit: number = 20): Promise<Patient[]> {
    try {
      return await OptimizedDataService.getPatients({ search: query });
    } catch (error) {
      console.error("Error searching patients:", error);
      const patients = getInitialPatientsSync();
      return patients.filter(patient =>
        patient.name.toLowerCase().includes(query.toLowerCase()) ||
        patient.record_number.toLowerCase().includes(query.toLowerCase()) ||
        (patient.phone_number && patient.phone_number.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, limit);
    }
  },

  async addPatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<number> {
    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const existingPatients = await OptimizedDataService.getPatients();
      const newPatient: Patient = {
        id: getNextId(),
        record_number: (patient.record_number as string) || '',
        name: (patient.name as string) || '',
        age: (patient.age as number) || 0,
        address: (patient.address as string) || '',
        phone_number: (patient.phone_number as string) || '',
        initial_diagnosis: (patient.initial_diagnosis as string) || '',
        created_at: new Date().toISOString()
      };

      existingPatients.push(newPatient);
      await savePatients(existingPatients);

      // Clear cache to force refresh
      OptimizedDataService.clearCache('patient_management_data');

      // Update record counter
      const currentCounter = parseInt(localStorage.getItem(RECORD_COUNTER_KEY) || '4');
      try {
        localStorage.setItem(RECORD_COUNTER_KEY, String(currentCounter + 1));
      } catch (error) {
        console.warn("Could not update counter:", error);
      }

      return newPatient.id!;
    } catch (error) {
      console.error("Error adding patient:", error);
      throw error;
    }
  },

  async updatePatient(id: number, patient: Omit<Patient, 'id' | 'created_at'>): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const existingPatients = await OptimizedDataService.getPatients();
      const patientIndex = existingPatients.findIndex((p: Patient) => p.id === id);

      if (patientIndex === -1) {
        throw new Error('Patient not found');
      }

      existingPatients[patientIndex] = {
        ...existingPatients[patientIndex],
        ...patient,
        id: id
      };

      await savePatients(existingPatients);

      // Clear cache to force refresh
      OptimizedDataService.clearCache('patient_management_data');

      return 'Patient updated successfully';
    } catch (error) {
      console.error("Error updating patient:", error);
      throw error;
    }
  },

  async deletePatient(id: number): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const existingPatients = await OptimizedDataService.getPatients();
      const filteredPatients = existingPatients.filter((p: Patient) => p.id !== id);

      if (existingPatients.length === filteredPatients.length) {
        throw new Error('Patient not found');
      }

      await savePatients(filteredPatients);

      // Clear cache to force refresh
      OptimizedDataService.clearCache('patient_management_data');

      return 'Patient deleted successfully';
    } catch (error) {
      console.error("Error deleting patient:", error);
      throw error;
    }
  },

  async generateRecordNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Get current counter
    let counter = parseInt(localStorage.getItem(RECORD_COUNTER_KEY) || '0');
    counter++;

    // Save counter
    localStorage.setItem(RECORD_COUNTER_KEY, counter.toString());

    // Generate record number
    const recordNumber = `PT${year}${month}${String(counter).padStart(4, '0')}`;

    return recordNumber;
  },

  // Batch operations for better performance
  async getPatientsBatch(ids: number[]): Promise<Patient[]> {
    try {
      const allPatients = await OptimizedDataService.getPatients();
      const patients = allPatients.filter(p => ids.includes(p.id!));
      return patients;
    } catch (error) {
      console.error("Error getting patients batch:", error);
      const allPatients = getInitialPatientsSync();
      return allPatients.filter(p => ids.includes(p.id!));
    }
  },

  // Statistics for dashboard
  async getPatientStatistics(): Promise<{
    total: number;
    thisMonth: number;
    thisYear: number;
    averageAge: number;
  }> {
    try {
      const patients = await OptimizedDataService.getPatients();
      const now = new Date();
      const thisMonth = patients.filter(p => {
        if (!p.created_at) return false;
        const createdAt = new Date(p.created_at);
        return createdAt.getMonth() === now.getMonth() &&
               createdAt.getFullYear() === now.getFullYear();
      }).length;

      const thisYear = patients.filter(p => {
        if (!p.created_at) return false;
        const createdAt = new Date(p.created_at);
        return createdAt.getFullYear() === now.getFullYear();
      }).length;

      const averageAge = patients.length > 0
        ? Math.round(patients.reduce((sum, p) => sum + p.age, 0) / patients.length)
        : 0;

      return {
        total: patients.length,
        thisMonth,
        thisYear,
        averageAge
      };
    } catch (error) {
      console.error("Error getting patient statistics:", error);
      return {
        total: 0,
        thisMonth: 0,
        thisYear: 0,
        averageAge: 0
      };
    }
  },

  // Memory management
  clearCache(): void {
    OptimizedDataService.clearCache();
  },

  getCacheInfo(): { size: number; keys: string[] } {
    return OptimizedDataService.getCacheStats();
  },

  // Preload data for better performance
  async preloadData(): Promise<void> {
    await OptimizedDataService.preloadCommonData();
  },

  // Appointments methods
  async getAppointments(page: number = 1, limit: number = 10, search?: string, startDate?: string, endDate?: string): Promise<{ appointments: Appointment[]; total: number; hasMore: boolean }> {
    try {
      // Get appointments from localStorage
      let appointments: Appointment[] = [];
      try {
        const existingAppointments = localStorage.getItem(APPOINTMENTS_KEY);
        if (existingAppointments) {
          appointments = JSON.parse(existingAppointments);
          console.log(`📊 Loaded ${appointments.length} appointments from localStorage`);
        }
      } catch (error) {
        console.error("Error parsing appointments data:", error);
      }

      // Filter by search term and date range
      let filtered = appointments;

      // Apply search filter
      if (search) {
        filtered = filtered.filter(a =>
          a.patientName.toLowerCase().includes(search.toLowerCase()) ||
          a.operatorName.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply date range filter
      if (startDate || endDate) {
        filtered = filtered.filter(a => {
          const appointmentDate = new Date(a.date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date('2100-12-31');
          return appointmentDate >= start && appointmentDate <= end;
        });
      }

      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAppointments = filtered.sort((a, b) => b.id! - a.id!).slice(startIndex, endIndex);
      const hasMore = endIndex < total;

      console.log(`🔍 getAppointments: Returning ${paginatedAppointments.length} appointments (total: ${total})`);
      return { appointments: paginatedAppointments, total, hasMore };
    } catch (error) {
      console.error("Error in getAppointments:", error);
      return { appointments: [], total: 0, hasMore: false };
    }
  },

  async getAppointmentById(id: number): Promise<Appointment | null> {
    try {
      const appointments = await this.getAppointments(1, 1000);
      return appointments.appointments.find(a => a.id === id) || null;
    } catch (error) {
      console.error("Error getting appointment by ID:", error);
      return null;
    }
  },

  async addAppointment(appointment: Omit<Appointment, 'id'>): Promise<number> {
    try {
      const appointments = await this.getAppointments(1, 1000);
      const newAppointment: Appointment = {
        id: Math.max(...appointments.appointments.map(a => a.id || 0), 0) + 1,
        patientName: (appointment.patientName as string) || '',
        patientId: (appointment.patientId as number) || 0,
        operatorName: (appointment.operatorName as string) || '',
        operatorId: (appointment.operatorId as number) || 0,
        date: (appointment.date as string) || new Date().toISOString(),
        vitalSigns: (appointment.vitalSigns as VitalSigns) || { bloodPressure: '', respirationRate: 0, heartRate: 0, borgScale: 0 },
        treatments: (appointment.treatments as Treatment[]) || [],
        totalPrice: (appointment.totalPrice as number) || 0,
        notes: (appointment.notes as string) || '',
        description: (appointment.description as string) || '',
        created_at: (appointment.created_at as string) || new Date().toISOString()
      };

      const updatedAppointments = [...appointments.appointments, newAppointment];
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));

      return newAppointment.id!;
    } catch (error) {
      console.error("Error adding appointment:", error);
      throw error;
    }
  },

  async updateAppointment(id: number, appointment: Omit<Appointment, 'id'>): Promise<string> {
    try {
      const appointments = await this.getAppointments(1, 1000);
      const appointmentIndex = appointments.appointments.findIndex(a => a.id === id);

      if (appointmentIndex === -1) {
        throw new Error('Appointment not found');
      }

      const updatedAppointments = [...appointments.appointments];
      updatedAppointments[appointmentIndex] = { ...updatedAppointments[appointmentIndex], ...appointment, id };

      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
      return 'Appointment updated successfully';
    } catch (error) {
      console.error("Error updating appointment:", error);
      throw error;
    }
  },

  async deleteAppointment(id: number): Promise<string> {
    try {
      const appointments = await this.getAppointments(1, 1000);
      const filteredAppointments = appointments.appointments.filter(a => a.id !== id);

      if (appointments.appointments.length === filteredAppointments.length) {
        throw new Error('Appointment not found');
      }

      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(filteredAppointments));
      return 'Appointment deleted successfully';
    } catch (error) {
      console.error("Error deleting appointment:", error);
      throw error;
    }
  },

  // Invoices methods
  async getInvoices(page: number = 1, limit: number = 10, search?: string, startDate?: string, endDate?: string): Promise<{ invoices: Invoice[]; total: number; hasMore: boolean }> {
    try {
      // Get invoices from localStorage
      let invoices: Invoice[] = [];
      try {
        const existingInvoices = localStorage.getItem(INVOICES_KEY);
        if (existingInvoices) {
          invoices = JSON.parse(existingInvoices);
          console.log(`📊 Loaded ${invoices.length} invoices from localStorage`);
        }
      } catch (error) {
        console.error("Error parsing invoices data:", error);
      }

      // Filter by search term and date range
      let filtered = invoices;

      // Apply search filter
      if (search) {
        filtered = filtered.filter(i =>
          i.patientName.toLowerCase().includes(search.toLowerCase()) ||
          i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          (i.status && i.status.toLowerCase().includes(search.toLowerCase()))
        );
      }

      // Apply date range filter
      if (startDate || endDate) {
        filtered = filtered.filter(i => {
          const invoiceDate = new Date(i.date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date('2100-12-31');
          return invoiceDate >= start && invoiceDate <= end;
        });
      }

      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedInvoices = filtered.sort((a, b) => b.id! - a.id!).slice(startIndex, endIndex);
      const hasMore = endIndex < total;

      console.log(`🔍 getInvoices: Returning ${paginatedInvoices.length} invoices (total: ${total})`);
      return { invoices: paginatedInvoices, total, hasMore };
    } catch (error) {
      console.error("Error in getInvoices:", error);
      return { invoices: [], total: 0, hasMore: false };
    }
  },

  async getInvoiceById(id: number): Promise<Invoice | null> {
    try {
      const invoices = await this.getInvoices(1, 1000);
      return invoices.invoices.find(i => i.id === id) || null;
    } catch (error) {
      console.error("Error getting invoice by ID:", error);
      return null;
    }
  },

  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<number> {
    try {
      const invoices = await this.getInvoices(1, 1000);
      const newInvoice: Invoice = {
        id: Math.max(...invoices.invoices.map(i => i.id || 0), 0) + 1,
        invoiceNumber: (invoice.invoiceNumber as string) || '',
        appointmentId: (invoice.appointmentId as number) || 0,
        patientName: (invoice.patientName as string) || '',
        patientId: (invoice.patientId as number) || 0,
        operatorName: (invoice.operatorName as string) || '',
        operatorId: (invoice.operatorId as number) || 0,
        date: (invoice.date as string) || new Date().toISOString(),
        appointmentDate: (invoice.appointmentDate as string) || new Date().toISOString(),
        vitalSigns: (invoice.vitalSigns as VitalSigns) || { bloodPressure: '', respirationRate: 0, heartRate: 0, borgScale: 0 },
        treatments: (invoice.treatments as Treatment[]) || [],
        totalAmount: (invoice.totalAmount as number) || 0,
        status: (invoice.status as Invoice['status']) || 'unpaid',
        created_at: (invoice.created_at as string) || new Date().toISOString(),
        updated_at: (invoice.updated_at as string) || new Date().toISOString()
      };

      const updatedInvoices = [...invoices.invoices, newInvoice];
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updatedInvoices));

      return newInvoice.id!;
    } catch (error) {
      console.error("Error adding invoice:", error);
      throw error;
    }
  },

  async updateInvoice(id: number, invoice: Omit<Invoice, 'id'>): Promise<string> {
    try {
      const invoices = await this.getInvoices(1, 1000);
      const invoiceIndex = invoices.invoices.findIndex(i => i.id === id);

      if (invoiceIndex === -1) {
        throw new Error('Invoice not found');
      }

      const updatedInvoices = [...invoices.invoices];
      updatedInvoices[invoiceIndex] = { ...updatedInvoices[invoiceIndex], ...invoice, id };

      localStorage.setItem(INVOICES_KEY, JSON.stringify(updatedInvoices));
      return 'Invoice updated successfully';
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
  },

  async deleteInvoice(id: number): Promise<string> {
    try {
      const invoices = await this.getInvoices(1, 1000);
      const filteredInvoices = invoices.invoices.filter(i => i.id !== id);

      if (invoices.invoices.length === filteredInvoices.length) {
        throw new Error('Invoice not found');
      }

      localStorage.setItem(INVOICES_KEY, JSON.stringify(filteredInvoices));
      return 'Invoice deleted successfully';
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw error;
    }
  }
};