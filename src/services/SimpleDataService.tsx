import { Patient, Invoice, Appointment, Operator, Treatment, CustomExamination } from '../types';
import { storage } from './UnifiedStorage';
import { medicalCache, memoryManager } from '../utils/SimpleMemoryManager';
import { log } from '../utils/logger';

export interface QueryOptions {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: { [key: string]: unknown };
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

class SimpleDataService {
  // Generic data retrieval with smart caching
  private static async getData<T>(
    key: string,
    queryOptions: QueryOptions = {},
    cacheKey?: string
  ): Promise<PaginatedResult<T>> {
    const cacheKeyFull = cacheKey || `${key}_${JSON.stringify(queryOptions)}`;

    // Debug logging removed - use logger.debug if needed for debugging

    // Smart caching strategy for large datasets
    // For total counts: use a separate cache key to store just the count
    const totalCountCacheKey = `${key}_total_count`;
    const searchCacheKey = `${key}_search_${JSON.stringify(queryOptions)}`;

    // Check if we have cached total count for this data type
    let cachedTotalCount: number | null = null;
    if (['patients', 'appointments', 'invoices'].includes(key)) {
      cachedTotalCount = memoryManager.get('search', totalCountCacheKey) as number | null;
      // Debug logging removed - cached total count for ${key}: ${cachedTotalCount}
    }

    // For search operations, use the search cache
    if (
      queryOptions.search ||
      queryOptions.filters ||
      (queryOptions.page && queryOptions.page > 1)
    ) {
      const cached = medicalCache.getSearchResults(searchCacheKey);
      // Debug logging removed - search cache check for ${key}
      if (cached && Array.isArray(cached)) {
        // Debug logging removed - using search cache for ${key}
        const paginatedResult = this.paginate(cached, queryOptions);

        // Update with cached total count if available
        if (cachedTotalCount !== null) {
          paginatedResult.totalCount = cachedTotalCount;
          paginatedResult.totalPages = Math.ceil(cachedTotalCount / (queryOptions.limit || 50));
        }

        log.debug(
          `Search cache hit for ${key}`,
          {
            cacheKey: searchCacheKey,
            resultCount: cached.length,
            totalCount: paginatedResult.totalCount
          },
          'SimpleDataService'
        );
        return paginatedResult;
      }
    }

    // For first page without search/filters, use basic cache
    if (
      queryOptions.page &&
      queryOptions.page === 1 &&
      !queryOptions.search &&
      !queryOptions.filters
    ) {
      const cached = medicalCache.getSearchResults(cacheKeyFull);
      // Debug logging removed - basic cache check for ${key}
      if (cached && Array.isArray(cached) && cachedTotalCount !== null) {
        // Debug logging removed - using basic cache for ${key}
        const paginatedResult = this.paginate(cached, queryOptions);
        paginatedResult.totalCount = cachedTotalCount;
        paginatedResult.totalPages = Math.ceil(cachedTotalCount / (queryOptions.limit || 50));

        log.debug(
          `Cache hit for ${key}`,
          {
            cacheKey: cacheKeyFull,
            resultCount: cached.length,
            totalCount: cachedTotalCount
          },
          'SimpleDataService'
        );
        return paginatedResult;
      }
    }

    // Debug logging removed - no cache hit for ${key}, fetching from storage

    try {
      // Retrieve from storage
      let data: T[] = [];

      switch (key) {
        case 'patients':
          // Debug logging removed - calling storage.getPatients()
          data = (await storage.getPatients()) as unknown as T[];
          // Debug logging removed - got ${data.length} patients from storage
          break;
        case 'appointments':
          data = (await storage.getAppointments()) as unknown as T[];
          break;
        case 'invoices':
          data = (await storage.getInvoices()) as unknown as T[];
          break;
        case 'operators':
          data = (await storage.getOperators()) as unknown as T[];
          break;
        default:
          data = (await storage.retrieve(key)) as T[];
      }

      // Apply filters and sorting
      const filteredData = this.applyFilters(data, queryOptions);

      // Cache total count for large datasets
      if (['patients', 'appointments', 'invoices'].includes(key)) {
        memoryManager.set('search', totalCountCacheKey, data.length);
        log.debug(`Cached total count for ${key}`, { count: data.length }, 'SimpleDataService');
      }

      // Apply pagination
      const paginatedResult = this.paginate(filteredData, queryOptions);

      // Smart caching strategy
      if (queryOptions.search || queryOptions.filters) {
        // Cache search results
        medicalCache.setSearchResults(searchCacheKey, filteredData);
        log.debug(
          `Cached search results for ${key}`,
          {
            cacheKey: searchCacheKey,
            resultCount: filteredData.length
          },
          'SimpleDataService'
        );
      } else if (queryOptions.page === 1 && !queryOptions.search && !queryOptions.filters) {
        // Cache first page for quick access
        medicalCache.setSearchResults(cacheKeyFull, filteredData);
        log.debug(
          `Cached first page for ${key}`,
          {
            cacheKey: cacheKeyFull,
            resultCount: filteredData.length
          },
          'SimpleDataService'
        );
      }

      log.debug(
        `Retrieved ${paginatedResult.data.length} ${key} records (Total: ${data.length})`,
        undefined,
        'SimpleDataService'
      );
      return paginatedResult;
    } catch (error) {
      log.error(`Failed to retrieve ${key}`, { error }, 'SimpleDataService');
      return {
        data: [],
        totalCount: 0,
        currentPage: queryOptions.page || 1,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      };
    }
  }

  private static applyFilters<T>(data: T[], options: QueryOptions): T[] {
    let filtered = [...data];

    // Apply search filter
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      // Debug logging removed - applying search filter for "${searchTerm}" to ${data.length} items

      filtered = filtered.filter(item => {
        // Enhanced search specifically for patients
        if (item && typeof item === 'object' && 'record_number' in item) {
          const patient = item as {
            name?: string;
            record_number?: string;
            phone_number?: string;
            address?: string;
            initial_diagnosis?: string;
            [key: string]: unknown;
          };

          // Check all relevant patient fields
          const nameMatch =
            patient.name &&
            typeof patient.name === 'string' &&
            patient.name.toLowerCase().includes(searchTerm);
          const recordMatch =
            patient.record_number &&
            typeof patient.record_number === 'string' &&
            patient.record_number.toLowerCase().includes(searchTerm);
          const phoneMatch =
            patient.phone_number &&
            typeof patient.phone_number === 'string' &&
            patient.phone_number.includes(searchTerm);
          const addressMatch =
            patient.address &&
            typeof patient.address === 'string' &&
            patient.address.toLowerCase().includes(searchTerm);
          const diagnosisMatch =
            patient.initial_diagnosis &&
            typeof patient.initial_diagnosis === 'string' &&
            patient.initial_diagnosis.toLowerCase().includes(searchTerm);

          const matches = nameMatch || recordMatch || phoneMatch || addressMatch || diagnosisMatch;

          if (matches) {
            // Debug logging removed - patient matches search: ${patient.name} (${patient.record_number})
          }

          return matches;
        }

        // Generic search for other item types
        return Object.values(item as Record<string, unknown>).some(
          value => value && typeof value === 'string' && value.toLowerCase().includes(searchTerm)
        );
      });

      // Debug logging removed - search filter result: ${filtered.length} items match "${searchTerm}"
    }

    // Apply custom filters
    if (options.filters) {
      filtered = filtered.filter(item => {
        return Object.entries(options.filters || {}).every(([key, value]) => {
          if (value === undefined || value === null) return true;

          // Handle date range filtering for appointments
          if (key === 'startDate' && (item as { date?: string }).date) {
            const itemDate = (item as { date?: string }).date;
            const appointmentDate = new Date(itemDate || '');
            const startDate = new Date(value as string);
            return appointmentDate >= startDate;
          }

          if (key === 'endDate' && (item as { date?: string }).date) {
            const itemDate = (item as { date?: string }).date;
            const appointmentDate = new Date(itemDate || '');
            const endDate = new Date(value as string);
            return appointmentDate <= endDate;
          }

          // Default exact matching for other filters
          return (item as Record<string, unknown>)[key] === value;
        });
      });
    }

    // Apply sorting
    if (options.sortBy) {
      const sortBy = options.sortBy;
      filtered.sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[sortBy];
        const bValue = (b as Record<string, unknown>)[sortBy];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }

  private static paginate<T>(data: T[], options: QueryOptions): PaginatedResult<T> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedData = data.slice(startIndex, endIndex);
    const totalCount = data.length;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: paginatedData,
      totalCount,
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  // Patients
  static async getPatients(options: QueryOptions = {}): Promise<PaginatedResult<Patient>> {
    // Debug logging removed - getPatients called with options: ${JSON.stringify(options)}

    // Force fresh data retrieval for patients to avoid stale cache issues
    // Debug logging removed - force fresh patient data retrieval

    try {
      // Always get fresh data from storage for patients
      const data = await storage.getPatients();
      // Debug logging removed - got ${data.length} fresh patients from storage

      // Apply filters and sorting manually
      const filteredData = this.applyFilters(data, options);
      // Debug logging removed - filtered patients: ${filteredData.length}

      // Apply pagination manually
      const result = this.paginate(filteredData, options);
      // Debug logging removed - final paginated result: ${result.data.length} patients

      return result;
    } catch (error) {
      log.error('Error getting paginated patients', { error, options }, 'SimpleDataService');
      return {
        data: [],
        totalCount: 0,
        currentPage: options.page || 1,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      };
    }
  }

  static async getPatientById(id: number): Promise<Patient | null> {
    try {
      // Check cache first
      const cached = medicalCache.getPatient(id.toString());
      if (cached && typeof cached === 'object' && 'id' in cached) {
        return cached as Patient;
      }

      const patients = await storage.getPatients();
      const patient = patients.find(p => p.id === id);

      if (patient) {
        medicalCache.setPatient(id.toString(), patient);
      }

      return patient || null;
    } catch (error) {
      log.error('Failed to get patient by ID', { id, error }, 'SimpleDataService');
      return null;
    }
  }

  static async savePatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
    try {
      // Debug logging removed - savePatient called with patient

      const patients = await storage.getPatients();
      // Debug logging removed - current patients from storage: ${patients.length}

      const maxId = patients.length > 0 ? Math.max(...patients.map(p => p.id || 0)) : 0;
      const newPatient: Patient = {
        record_number: patient.record_number as string,
        name: patient.name as string,
        age: patient.age as number,
        phone_number: patient.phone_number as string,
        address: patient.address as string | undefined,
        initial_diagnosis: patient.initial_diagnosis as string | undefined,
        id: maxId + 1,
        created_at: new Date().toISOString()
      };

      // Debug logging removed - new patient created

      patients.push(newPatient);
      // Debug logging removed - updated patients array before saving: ${patients.length}

      await storage.storePatients(patients);
      // Debug logging removed - patients stored successfully

      // Update cache
      if (newPatient.id) {
        medicalCache.setPatient(newPatient.id.toString(), newPatient);
      }

      // Clear relevant caches after creation
      memoryManager.clearCache('search');
      memoryManager.delete('search', 'patients_total_count');

      // Clear medical cache to ensure fresh data
      medicalCache.clearCache('patients');
      medicalCache.clearCache('search');

      // Debug logging removed - caches cleared after patient save

      log.info('Patient saved successfully', { id: newPatient.id }, 'SimpleDataService');
      return newPatient;
    } catch (error) {
      log.error('Failed to save patient', { error }, 'SimpleDataService');
      throw error;
    }
  }

  static async updatePatient(id: number, updates: Partial<Patient>): Promise<Patient | null> {
    try {
      const patients = await storage.getPatients();
      const index = patients.findIndex(p => p.id === id);

      if (index === -1) {
        log.warn('Patient not found for update', { id }, 'SimpleDataService');
        return null;
      }

      const updatedPatient = { ...patients[index], ...updates };
      patients[index] = updatedPatient;
      await storage.storePatients(patients);

      // Update cache
      medicalCache.setPatient(id.toString(), updatedPatient);

      // Clear relevant caches after update
      memoryManager.clearCache('search');
      memoryManager.delete('search', 'patients_total_count');

      // Clear medical cache to ensure fresh data
      medicalCache.clearCache('patients');
      medicalCache.clearCache('search');

      log.info('Patient updated successfully', { id }, 'SimpleDataService');
      return updatedPatient;
    } catch (error) {
      log.error('Failed to update patient', { id, error }, 'SimpleDataService');
      throw error;
    }
  }

  static async deletePatient(id: number): Promise<boolean> {
    try {
      const patients = await storage.getPatients();
      const filteredPatients = patients.filter(p => p.id !== id);

      if (filteredPatients.length === patients.length) {
        log.warn('Patient not found for deletion', { id }, 'SimpleDataService');
        return false;
      }

      await storage.storePatients(filteredPatients);

      // Remove from cache
      medicalCache.delete('patients', id.toString());

      // Clear relevant caches after deletion
      memoryManager.clearCache('search');
      memoryManager.delete('search', 'patients_total_count');

      // Clear medical cache to ensure fresh data
      medicalCache.clearCache('patients');
      medicalCache.clearCache('search');

      log.info('Patient deleted successfully', { id }, 'SimpleDataService');
      return true;
    } catch (error) {
      log.error('Failed to delete patient', { id, error }, 'SimpleDataService');
      throw error;
    }
  }

  // Appointments
  static async getAppointments(options: QueryOptions = {}): Promise<PaginatedResult<Appointment>> {
    return this.getData<Appointment>('appointments', options);
  }

  static async getAllAppointments(): Promise<Appointment[]> {
    try {
      // Debug logging removed - getAllAppointments fetching ALL appointments without pagination
      // Get appointments directly from storage without any pagination
      const appointments = await storage.getAppointments();
      // Debug logging removed - getAllAppointments retrieved ${appointments.length} appointments from storage
      return appointments;
    } catch (error) {
      log.error('Failed to get all appointments', { error }, 'SimpleDataService');
      return [];
    }
  }

  static async getAllPatients(): Promise<Patient[]> {
    try {
      // Debug logging removed - getAllPatients fetching ALL patients without pagination
      // Get patients directly from storage without any pagination
      const patients = await storage.getPatients();
      // Debug logging removed - getAllPatients retrieved ${patients.length} patients from storage
      return patients;
    } catch (error) {
      log.error('Failed to get all patients', { error }, 'SimpleDataService');
      return [];
    }
  }

  static async getAppointmentById(id: number): Promise<Appointment | null> {
    try {
      const result = await this.getAppointments({ limit: 10000 });
      const appointment = result.data.find(apt => apt.id === id);

      if (appointment) {
        log.debug('Appointment loaded successfully', { id }, 'SimpleDataService');
        return appointment;
      } else {
        log.warn('Appointment not found', { id }, 'SimpleDataService');
        return null;
      }
    } catch (error) {
      log.error('Failed to get appointment by ID', { id, error }, 'SimpleDataService');
      return null;
    }
  }

  static async saveAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    try {
      const appointments = await storage.getAppointments();
      const maxId = appointments.length > 0 ? Math.max(...appointments.map(a => a.id || 0)) : 0;
      const newAppointment: Appointment = {
        ...(appointment as Appointment),
        id: maxId + 1
      };

      appointments.push(newAppointment);
      await storage.storeAppointments(appointments);

      // Clear relevant caches after creation
      memoryManager.clearCache('search');
      memoryManager.delete('search', 'appointments_total_count');

      log.info('Appointment saved successfully', { id: newAppointment.id }, 'SimpleDataService');
      return newAppointment;
    } catch (error) {
      log.error('Failed to save appointment', { error }, 'SimpleDataService');
      throw error;
    }
  }

  static async deleteAppointment(id: number): Promise<boolean> {
    try {
      // Debug logging removed - deleting appointment ${id}
      const appointments = await storage.getAppointments();
      // Debug logging removed - found ${appointments.length} appointments before deletion

      const filteredAppointments = appointments.filter(apt => apt.id !== id);

      if (filteredAppointments.length === appointments.length) {
        log.warn('Appointment not found for deletion', { id }, 'SimpleDataService');
        return false;
      }

      await storage.storeAppointments(filteredAppointments);
      // Debug logging removed - stored ${filteredAppointments.length} appointments after deletion

      // Clear ALL caches aggressively after deletion

      try {
        memoryManager.clearCache('search');
      } catch { // Error handled silently
    }

      try {
        memoryManager.clearCache('default');
      } catch { // Error handled silently
    }

      try {
        memoryManager.delete('search', 'appointments_total_count');
      } catch { // Error handled silently
    }

      // Also clear any appointment-related medical cache entries
      try {
        medicalCache.clearCache('all');
      } catch { // Error handled silently
    }

      // Clear localStorage cache entries as well
      const localStorageKeys = [
        'appointments',
        'appointments_total_count',
        'appointments_search_',
        'appointments_search',
        'appointments_cache'
      ];

      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch { // Error handled silently
    }
      });


      log.info(
        'Appointment deleted successfully',
        { id, remainingCount: filteredAppointments.length },
        'SimpleDataService'
      );
      return true;
    } catch (error) {
      log.error('Failed to delete appointment', { id, error }, 'SimpleDataService');
      throw error;
    }
  }

  static async updateAppointment(
    id: number,
    updates: Partial<Appointment>
  ): Promise<Appointment | null> {
    try {
      const appointments = await storage.getAppointments();
      const index = appointments.findIndex(apt => apt.id === id);

      if (index === -1) {
        log.warn('Appointment not found for update', { id }, 'SimpleDataService');
        return null;
      }

      const updatedAppointment = { ...appointments[index], ...updates };
      appointments[index] = updatedAppointment;
      await storage.storeAppointments(appointments);

      // Clear relevant caches after update
      memoryManager.clearCache('search');
      memoryManager.delete('search', 'appointments_total_count');

      log.info('Appointment updated successfully', { id }, 'SimpleDataService');
      return updatedAppointment;
    } catch (error) {
      log.error('Failed to update appointment', { id, error }, 'SimpleDataService');
      throw error;
    }
  }

  // Invoices
  static async getInvoices(options: QueryOptions = {}): Promise<PaginatedResult<Invoice>> {
    return this.getData<Invoice>('invoices', options, `invoices_${JSON.stringify(options)}`);
  }

  static async getAllInvoices(): Promise<Invoice[]> {
    try {
      // Debug logging removed - getAllInvoices fetching ALL invoices without pagination
      // Get invoices directly from storage without any pagination
      const invoices = await storage.getInvoices();
      // Debug logging removed - getAllInvoices retrieved ${invoices.length} invoices from storage
      return invoices;
    } catch (error) {
      log.error('Failed to get all invoices', { error }, 'SimpleDataService');
      return [];
    }
  }

  static async getInvoiceById(id: number): Promise<Invoice | null> {
    try {
      const result = await this.getInvoices({ limit: 10000 });
      const invoice = result.data.find(inv => inv.id === id);

      if (invoice) {
        log.debug('Invoice loaded successfully', { id }, 'SimpleDataService');
        return invoice;
      } else {
        log.warn('Invoice not found', { id }, 'SimpleDataService');
        return null;
      }
    } catch (error) {
      log.error('Failed to get invoice by ID', { id, error }, 'SimpleDataService');
      return null;
    }
  }

  static async saveInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    try {
      const invoices = await storage.getInvoices();
      const maxId = invoices.length > 0 ? Math.max(...invoices.map(i => i.id || 0)) : 0;
      const newInvoice: Invoice = {
        ...(invoice as Invoice),
        id: maxId + 1
      };

      invoices.push(newInvoice);
      await storage.storeInvoices(invoices);

      // Clear relevant caches after creation
      memoryManager.clearCache('search');
      memoryManager.delete('search', 'invoices_total_count');

      log.info('Invoice saved successfully', { id: newInvoice.id }, 'SimpleDataService');
      return newInvoice;
    } catch (error) {
      log.error('Failed to save invoice', { error }, 'SimpleDataService');
      throw error;
    }
  }

  static async deleteInvoice(id: number): Promise<boolean> {
    try {
      const invoices = await storage.getInvoices();

      const filteredInvoices = invoices.filter(inv => inv.id !== id);

      if (filteredInvoices.length === invoices.length) {
        log.warn('Invoice not found for deletion', { id }, 'SimpleDataService');
        return false;
      }

      await storage.storeInvoices(filteredInvoices);

      // Clear ALL caches aggressively after deletion

      try {
        memoryManager.clearCache('search');
      } catch { // Error handled silently
    }

      try {
        memoryManager.clearCache('default');
      } catch { // Error handled silently
    }

      try {
        memoryManager.delete('search', 'invoices_total_count');
      } catch { // Error handled silently
    }

      // Also clear any invoice-related medical cache entries
      try {
        medicalCache.clearCache('all');
      } catch { // Error handled silently
    }

      // Clear localStorage cache entries as well
      const localStorageKeys = [
        'invoices',
        'invoices_total_count',
        'invoices_search_',
        'invoices_search',
        'invoices_cache'
      ];

      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch { // Error handled silently
    }
      });


      log.info(
        'Invoice deleted successfully',
        { id, remainingCount: filteredInvoices.length },
        'SimpleDataService'
      );
      return true;
    } catch (error) {
      log.error('Failed to delete invoice', { id, error }, 'SimpleDataService');
      throw error;
    }
  }

  static async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const invoices = await storage.getInvoices();
      const index = invoices.findIndex(inv => inv.id === id);

      if (index === -1) {
        log.warn('Invoice not found for update', { id }, 'SimpleDataService');
        return null;
      }

      const updatedInvoice = { ...invoices[index], ...updates };
      invoices[index] = updatedInvoice;
      await storage.storeInvoices(invoices);

      // Clear relevant caches after update
      memoryManager.clearCache('search');
      memoryManager.delete('search', 'invoices_total_count');

      log.info('Invoice updated successfully', { id }, 'SimpleDataService');
      return updatedInvoice;
    } catch (error) {
      log.error('Failed to update invoice', { id, error }, 'SimpleDataService');
      throw error;
    }
  }

  // Operators (static data)
  static async getOperators(): Promise<Operator[]> {
    try {
      // Check cache first but with shorter cache time since operators can be deleted
      const cached = medicalCache.getOperators();
      if (cached && Array.isArray(cached)) {
        // Debug logging removed - using cached operators: ${cached.length}
        return cached;
      }

      // Debug logging removed - fetching fresh operators from storage
      const operators = await storage.getOperators();
      // Debug logging removed - retrieved operators from storage: ${operators.length}

      // Cache for moderate time since operators can change
      medicalCache.setOperators(operators);

      return operators;
    } catch (error) {
      log.error('Failed to get operators', { error }, 'SimpleDataService');
      return [];
    }
  }

  static async saveOperator(operator: Operator): Promise<Operator> {
    try {
      const operators = await storage.getOperators();

      const existingIndex = operators.findIndex(o => o.id === operator.id);

      let savedOperator: Operator;
      if (existingIndex >= 0) {
        operators[existingIndex] = operator;
        savedOperator = operator;
      } else {
        const newOperator = {
          ...operator,
          id: Math.max(...operators.map(o => o.id || 0), 0) + 1
        };
        operators.push(newOperator);
        savedOperator = newOperator;
      }

      await storage.storeOperators(operators);

      // Update cache
      medicalCache.setOperators(operators);

      log.info('Operator saved successfully', { id: savedOperator.id }, 'SimpleDataService');
      return savedOperator;
    } catch (error) {
      log.error('Failed to save operator', { error }, 'SimpleDataService');
      throw error;
    }
  }

  // Force reload operators bypassing cache
  static async getOperatorsFresh(): Promise<Operator[]> {
    try {
      // Debug logging removed - force fetching fresh operators from storage

      // Clear cache first
      medicalCache.clearCache('operators');

      // Get fresh data from storage
      const operators = await storage.getOperators();
      // Debug logging removed - retrieved fresh operators from storage: ${operators.length}

      // Update cache with fresh data
      medicalCache.setOperators(operators);

      return operators;
    } catch (error) {
      log.error('Failed to get fresh operators', { error }, 'SimpleDataService');
      return [];
    }
  }

  static async deleteOperator(id: number): Promise<boolean> {
    try {
      const operators = await storage.getOperators();

      const filteredOperators = operators.filter(op => op.id !== id);

      if (filteredOperators.length === operators.length) {
        log.warn('Operator not found for deletion', { id }, 'SimpleDataService');
        return false;
      }

      await storage.storeOperators(filteredOperators);

      // Clear ALL caches aggressively after deletion

      try {
        memoryManager.clearCache('search');
      } catch { // Error handled silently
    }

      try {
        memoryManager.clearCache('default');
      } catch { // Error handled silently
    }

      // Also clear any operator-related medical cache entries
      try {
        medicalCache.clearCache('all');
      } catch { // Error handled silently
    }

      // Clear localStorage cache entries as well
      const localStorageKeys = [
        'operators',
        'operators_search_',
        'operators_search',
        'operators_cache'
      ];

      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch { // Error handled silently
    }
      });

      // Clear medical cache as well
      try {
        medicalCache.clearCache('operators');
      } catch { // Error handled silently
    }


      log.info(
        'Operator deleted successfully',
        { id, remainingCount: filteredOperators.length },
        'SimpleDataService'
      );
      return true;
    } catch (error) {
      log.error('Failed to delete operator', { id, error }, 'SimpleDataService');
      throw error;
    }
  }

  // Clear operators cache method
  static async clearOperatorsCache(): Promise<void> {
    try {

      // Clear medical cache
      medicalCache.clearCache('operators');

      // Clear localStorage entries
      const localStorageKeys = [
        'operators',
        'operators_search_',
        'operators_search',
        'operators_cache'
      ];

      localStorageKeys.forEach(key => {
        try {
          Object.keys(localStorage).forEach(localStorageKey => {
            if (localStorageKey.includes(key)) {
              localStorage.removeItem(localStorageKey);
            }
          });
        } catch { // Error handled silently
    }
      });

      log.info('Operators cache cleared', {}, 'SimpleDataService');
    } catch (error) {
      log.error('Failed to clear operators cache', { error }, 'SimpleDataService');
    }
  }

  // Treatments
  static async getTreatments(): Promise<Treatment[]> {
    try {
      const cached = medicalCache.getTreatments();
      if (cached && Array.isArray(cached)) {
        return cached;
      }

      // Use generic retrieve method since UnifiedStorage doesn't have specific getTreatments method
      const treatments = await storage.retrieve('treatments');
      medicalCache.setTreatments(treatments as Treatment[]);
      return treatments as Treatment[];
    } catch (error) {
      log.error('Failed to get treatments', { error }, 'SimpleDataService');
      return [];
    }
  }

  static async saveTreatments(treatments: Treatment[]): Promise<void> {
    try {
      await storage.store('treatments', treatments);
      medicalCache.setTreatments(treatments);
      log.info('Treatments saved successfully', { count: treatments.length }, 'SimpleDataService');
    } catch (error) {
      log.error('Failed to save treatments', { error }, 'SimpleDataService');
      throw error;
    }
  }

  static async migrateTreatmentsFromLocalStorage(): Promise<void> {
    try {
      // Check if treatments already exist in the new storage
      const existingTreatments = await this.getTreatments();
      if (existingTreatments.length > 0) {
        log.debug(
          'Treatments already exist in storage, skipping migration',
          undefined,
          'SimpleDataService'
        );
        return;
      }

      // Check for treatments in localStorage (legacy)
      const localStorageTreatments = localStorage.getItem('treatments');
      if (localStorageTreatments) {
        const treatments: Treatment[] = JSON.parse(localStorageTreatments);
        if (treatments.length > 0) {
          await this.saveTreatments(treatments);
          log.info(
            'Migrated treatments from localStorage',
            { count: treatments.length },
            'SimpleDataService'
          );
          // Optionally clear localStorage after successful migration
          localStorage.removeItem('treatments');
        }
      }
    } catch (error) {
      log.error('Failed to migrate treatments from localStorage', { error }, 'SimpleDataService');
    }
  }

  // Custom examinations - using storage interface if available, fallback to empty array
  static async getCustomExaminations(): Promise<CustomExamination[]> {
    try {
      // Check cache first for static data
      const cached = medicalCache.getCustomExaminations();
      if (cached && Array.isArray(cached)) {
        return cached;
      }

      // Try to get from storage if the method exists
      if (storage.getCustomExaminations) {
        const examinations = await storage.getCustomExaminations();
        // Cache the result
        medicalCache.setCustomExaminations(examinations);
        return examinations;
      }
      // Fallback to empty array
      return [];
    } catch (error) {
      log.error('Failed to get custom examinations', { error }, 'SimpleDataService');
      return [];
    }
  }

  // Clear custom examinations cache
  static clearCustomExaminationsCache(): void {
    // Clear any cached custom examinations data
    medicalCache.clearCustomExaminations();
    log.debug('Custom examinations cache cleared', {}, 'SimpleDataService');
  }

  // Statistics
  static async getStatistics(): Promise<{
    totalPatients: number;
    totalAppointments: number;
    totalInvoices: number;
    totalRevenue: number;
  }> {
    try {
      const [patients, appointments, invoices] = await Promise.all([
        storage.getPatients(),
        storage.getAppointments(),
        storage.getInvoices()
      ]);

      const totalRevenue = invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

      return {
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        totalInvoices: invoices.length,
        totalRevenue
      };
    } catch (error) {
      log.error('Failed to get statistics', { error }, 'SimpleDataService');
      return {
        totalPatients: 0,
        totalAppointments: 0,
        totalInvoices: 0,
        totalRevenue: 0
      };
    }
  }

  // Utility methods
  static async clearPatientsCache(): Promise<void> {
    try {
      // Clear all patient-related caches
      memoryManager.clearCache('search');
      memoryManager.delete('search', 'patients_total_count');
      medicalCache.clearCache('patients');
      medicalCache.clearCache('search');

      // Clear localStorage entries related to patients
      const localStorageKeys = [
        'patients',
        'patients_total_count',
        'patients_search_',
        'patients_search',
        'patients_cache'
      ];

      localStorageKeys.forEach(key => {
        try {
          // Only clear keys that start with our patterns to avoid clearing unrelated data
          Object.keys(localStorage).forEach(localStorageKey => {
            if (localStorageKey.includes(key)) {
              localStorage.removeItem(localStorageKey);
            }
          });
        } catch { // Error handled silently
    }
      });

      log.info('Patient caches cleared successfully', {}, 'SimpleDataService');
    } catch (error) {
      log.error('Failed to clear patient caches', { error }, 'SimpleDataService');
    }
  }

  // Debug method to check storage contents
  static async debugPatientStorage(): Promise<void> {
    try {
      // Debug logging removed - checking patient storage
    } catch { // Error handled silently
    }
  }

  static async generateRecordNumber(): Promise<string> {
    try {
      const patients = await storage.getPatients();
      const year = new Date().getFullYear();
      const nextNumber = patients.length + 1;
      return `PT${year}${String(nextNumber).padStart(6, '0')}`;
    } catch (_error) {
      log.error('Failed to generate record number', { error: _error }, 'SimpleDataService');
      // Fallback to timestamp-based number
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      return `PT${year}${timestamp}`;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await storage.clear();
      medicalCache.clearCache('patients');
      medicalCache.clearCache('appointments');
      medicalCache.clearCache('invoices');
      medicalCache.clearCache('static');
      medicalCache.clearCache('search');

      log.info('All data cleared successfully', undefined, 'SimpleDataService');
    } catch (_error) {
      log.error('Failed to clear all data', { error: _error }, 'SimpleDataService');
      throw _error;
    }
  }
}

// Export databaseService interface for compatibility
// eslint-disable-next-line react-refresh/only-export-components
export { databaseService } from './databaseService';

export default SimpleDataService;
