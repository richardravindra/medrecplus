import { UnifiedStorage } from './UnifiedStorage';
import { CacheManager } from '../utils/CacheManager';
import { SecurityService } from './SecurityService';
import { Patient, Appointment } from '../types';

// Simplified interfaces that work with existing data structure
export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilterOptions {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  patientId?: number;
  [key: string]: unknown;
}

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  treatmentStats: Record<string, number>;
  lastUpdated: string;
}

export class SimpleMedRecDataService {
  private storage: UnifiedStorage;
  private cache: CacheManager;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.storage = UnifiedStorage.getInstance();
    this.cache = new CacheManager(this.CACHE_TTL, 1000);
  }

  // Error handling wrapper
  private async withErrorHandling<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';

      SecurityService.logSecurityEvent('data_service_error', {
        operation,
        error: errorMessage,
        timestamp: Date.now()
      });

      throw new Error(`Failed to ${operation}. Please try again.`);
    }
  }

  // Patient Management
  async getPatients(
    options: PaginationOptions & { filter?: FilterOptions } = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<Patient>> {
    return this.withErrorHandling('get patients', async () => {
      const cacheKey = `patients_${JSON.stringify(options)}`;

      const cached = this.cache.get<PaginatedResult<Patient>>(cacheKey);
      if (cached) {
        return cached;
      }

      const allPatients = await this.storage.getPatients();
      let filteredPatients = [...allPatients];

      // Apply filtering
      if (options.filter) {
        if (options.filter.search) {
          const searchLower = options.filter.search.toLowerCase();
          filteredPatients = filteredPatients.filter(
            p =>
              p.name.toLowerCase().includes(searchLower) ||
              p.phone_number.includes(searchLower) ||
              p.address?.toLowerCase().includes(searchLower)
          );
        }
      }

      // Apply sorting
      if (options.sortBy) {
        filteredPatients.sort((a, b) => {
          const aValue = a[options.sortBy as keyof Patient];
          const bValue = b[options.sortBy as keyof Patient];

          if (aValue === undefined && bValue === undefined) return 0;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;

          const comparison = String(aValue).localeCompare(String(bValue));
          return options.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Apply pagination
      const total = filteredPatients.length;
      const startIndex = (options.page - 1) * options.pageSize;
      const endIndex = startIndex + options.pageSize;
      const data = filteredPatients.slice(startIndex, endIndex);

      const result: PaginatedResult<Patient> = {
        data,
        total,
        page: options.page,
        pageSize: options.pageSize,
        totalPages: Math.ceil(total / options.pageSize),
        hasNext: endIndex < total,
        hasPrev: options.page > 1
      };

      this.cache.set(cacheKey, result);
      return result;
    });
  }

  async getPatientById(id: number): Promise<Patient | null> {
    return this.withErrorHandling(`get patient ${id}`, async () => {
      const cacheKey = `patient_${id}`;
      const cached = this.cache.get<Patient>(cacheKey);

      if (cached) {
        return cached;
      }

      const patients = await this.storage.getPatients();
      const patient = patients.find(p => p.id === id);

      if (patient) {
        this.cache.set(cacheKey, patient);
        return patient;
      }

      return null;
    });
  }

  async createPatient(patientData: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
    return this.withErrorHandling('create patient', async () => {
      const existingPatients = await this.storage.getPatients();

      // Generate a unique record number
      const recordNumber = `REC-${Date.now()}`;

      const newPatient: Patient = {
        record_number: recordNumber,
        name: String(patientData.name || ''),
        age: Number(patientData.age || 0),
        phone_number: String(patientData.phone_number || ''),
        address: patientData.address ? String(patientData.address) : undefined,
        initial_diagnosis: patientData.initial_diagnosis
          ? String(patientData.initial_diagnosis)
          : undefined,
        id: Date.now(), // Simple ID generation
        created_at: new Date().toISOString()
      };

      const updatedPatients = [...existingPatients, newPatient];
      await this.storage.storePatients(updatedPatients);

      this.cache.invalidatePattern('patients_*');

      SecurityService.logSecurityEvent('patient_created', {
        patientId: newPatient.id?.toString() || 'unknown',
        timestamp: Date.now()
      });

      return newPatient;
    });
  }

  async updatePatient(id: number, updates: Partial<Patient>): Promise<Patient> {
    return this.withErrorHandling(`update patient ${id}`, async () => {
      const existingPatients = await this.storage.getPatients();
      const patientIndex = existingPatients.findIndex(p => p.id === id);

      if (patientIndex === -1) {
        throw new Error('Patient not found');
      }

      const updatedPatient: Patient = {
        ...existingPatients[patientIndex],
        ...updates
      };

      existingPatients[patientIndex] = updatedPatient;
      await this.storage.storePatients(existingPatients);

      this.cache.invalidate(`patient_${id}`);
      this.cache.invalidatePattern('patients_*');

      SecurityService.logSecurityEvent('patient_updated', {
        patientId: id.toString(),
        timestamp: Date.now()
      });

      return updatedPatient;
    });
  }

  async deletePatient(id: number): Promise<void> {
    return this.withErrorHandling(`delete patient ${id}`, async () => {
      const [existingPatients, existingAppointments] = await Promise.all([
        this.storage.getPatients(),
        this.storage.getAppointments()
      ]);

      const hasAppointments = existingAppointments.some(apt => apt.patientId === id);
      if (hasAppointments) {
        throw new Error('Cannot delete patient with existing appointments');
      }

      const updatedPatients = existingPatients.filter(p => p.id !== id);
      await this.storage.storePatients(updatedPatients);

      this.cache.invalidate(`patient_${id}`);
      this.cache.invalidatePattern('patients_*');

      SecurityService.logSecurityEvent('patient_deleted', {
        patientId: id.toString(),
        timestamp: Date.now()
      });
    });
  }

  // Search functionality
  async searchPatients(query: string, limit: number = 10): Promise<Patient[]> {
    return this.withErrorHandling(`search patients: ${query}`, async () => {
      const cacheKey = `search_patients_${query}_${limit}`;
      const cached = this.cache.get<Patient[]>(cacheKey);

      if (cached) {
        return cached;
      }

      const allPatients = await this.storage.getPatients();
      const queryLower = query.toLowerCase();

      const results = allPatients
        .filter(
          p =>
            p.name.toLowerCase().includes(queryLower) ||
            p.phone_number.includes(queryLower) ||
            p.address?.toLowerCase().includes(queryLower)
        )
        .slice(0, limit);

      this.cache.set(cacheKey, results, 30 * 1000); // 30 seconds cache
      return results;
    });
  }

  // Appointment Management (Basic implementation)
  async getAppointments(
    options: PaginationOptions & { filter?: FilterOptions } = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<Appointment>> {
    return this.withErrorHandling('get appointments', async () => {
      const cacheKey = `appointments_${JSON.stringify(options)}`;

      const cached = this.cache.get<PaginatedResult<Appointment>>(cacheKey);
      if (cached) {
        return cached;
      }

      const allAppointments = await this.storage.getAppointments();
      let filteredAppointments = [...allAppointments];

      // Apply filtering
      if (options.filter) {
        if (options.filter.search) {
          const searchLower = options.filter.search.toLowerCase();
          filteredAppointments = filteredAppointments.filter(
            a =>
              a.patientName.toLowerCase().includes(searchLower) ||
              a.operatorName.toLowerCase().includes(searchLower)
          );
        }
        if (options.filter.patientId) {
          filteredAppointments = filteredAppointments.filter(
            a => a.patientId === options.filter?.patientId
          );
        }
      }

      // Apply sorting
      if (options.sortBy) {
        filteredAppointments.sort((a, b) => {
          const aValue = a[options.sortBy as keyof Appointment];
          const bValue = b[options.sortBy as keyof Appointment];

          if (aValue === undefined && bValue === undefined) return 0;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;

          const comparison = String(aValue).localeCompare(String(bValue));
          return options.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Apply pagination
      const total = filteredAppointments.length;
      const startIndex = (options.page - 1) * options.pageSize;
      const endIndex = startIndex + options.pageSize;
      const data = filteredAppointments.slice(startIndex, endIndex);

      const result: PaginatedResult<Appointment> = {
        data,
        total,
        page: options.page,
        pageSize: options.pageSize,
        totalPages: Math.ceil(total / options.pageSize),
        hasNext: endIndex < total,
        hasPrev: options.page > 1
      };

      this.cache.set(cacheKey, result);
      return result;
    });
  }

  async getAppointmentById(id: number): Promise<Appointment | null> {
    return this.withErrorHandling(`get appointment ${id}`, async () => {
      const appointments = await this.storage.getAppointments();
      return appointments.find(a => a.id === id) || null;
    });
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    return this.withErrorHandling('get dashboard stats', async () => {
      const cacheKey = 'dashboard_stats';
      const cached = this.cache.get<DashboardStats>(cacheKey);

      if (cached) {
        return cached;
      }

      const [patients, appointments] = await Promise.all([
        this.storage.getPatients(),
        this.storage.getAppointments()
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter(apt => apt.date === today);
      const upcomingAppointments = appointments.filter(apt => apt.date >= today);

      // Simple treatment statistics
      const treatmentStats: Record<string, number> = {};
      appointments.forEach(apt => {
        apt.treatments.forEach(treatment => {
          treatmentStats[treatment.name] = (treatmentStats[treatment.name] || 0) + 1;
        });
      });

      const stats: DashboardStats = {
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        todayAppointments: todayAppointments.length,
        upcomingAppointments: upcomingAppointments.length,
        treatmentStats,
        lastUpdated: new Date().toISOString()
      };

      this.cache.set(cacheKey, stats, 30 * 1000); // 30 seconds cache
      return stats;
    });
  }

  // Utility methods
  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async getStorageStats() {
    return this.withErrorHandling('get storage stats', async () => {
      const [patients, appointments, operators] = await Promise.all([
        this.storage.getPatients(),
        this.storage.getAppointments(),
        this.storage.getOperators()
      ]);

      return {
        totalEntities: 3,
        totalRecords: patients.length + appointments.length + operators.length,
        storageSize: 0,
        entityCounts: {
          patients: patients.length,
          appointments: appointments.length,
          operators: operators.length
        }
      };
    });
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  async healthCheck() {
    try {
      const _stats = await this.getStorageStats();
      return {
        status: 'healthy' as const,
        details: {
          storage: _stats,
          cache: this.getCacheStats(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (_error) {
      return {
        status: 'unhealthy' as const,
        details: {
          error: _error instanceof Error ? _error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Singleton instance
export const dataService = new SimpleMedRecDataService();
