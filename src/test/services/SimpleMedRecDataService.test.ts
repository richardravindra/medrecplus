import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleMedRecDataService } from '../../services/SimpleMedRecDataService';
import { UnifiedStorage } from '../../services/UnifiedStorage';
import { CacheManager } from '../../utils/CacheManager';

// Mock the dependencies
vi.mock('../../services/UnifiedStorage');
vi.mock('../../utils/CacheManager');
vi.mock('../../utils/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('SimpleMedRecDataService', () => {
  let dataService: SimpleMedRecDataService;
  let mockStorage: vi.Mocked<UnifiedStorage>;
  let mockCache: vi.Mocked<CacheManager>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the singleton instance method instead of constructor
    mockStorage = {
      getPatients: vi.fn(),
      storePatients: vi.fn(),
      getAppointments: vi.fn(),
      storeAppointments: vi.fn(),
      getInvoices: vi.fn(),
      storeInvoices: vi.fn(),
      deleteInvoice: vi.fn(),
      getInvoiceById: vi.fn(),
      updateInvoice: vi.fn(),
      getPatientById: vi.fn(),
      getOperators: vi.fn(),
      storeOperators: vi.fn(),
      getTreatments: vi.fn(),
      storeTreatments: vi.fn()
    } as any;

    mockCache = new CacheManager() as vi.Mocked<CacheManager>;

    dataService = new SimpleMedRecDataService();
    (dataService as any).storage = mockStorage;
    (dataService as any).cache = mockCache;
  });

  describe('getPatients', () => {
    it('should return cached patients when available', async () => {
      const cachedPatients = {
        data: [{ id: 1, name: 'John Doe', age: 35, phone_number: '+1234567890' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };

      mockCache.get.mockReturnValue(cachedPatients);

      const result = await dataService.getPatients();

      expect(result).toEqual(cachedPatients);
      expect(mockCache.get).toHaveBeenCalledWith('patients_{"page":1,"pageSize":20}');
      expect(mockStorage.getPatients).not.toHaveBeenCalled();
    });

    it('should fetch patients from storage when not cached', async () => {
      const patients = [{
        id: 1,
        name: 'John Doe',
        age: 35,
        phone_number: '+1234567890',
        record_number: 'REC-123456',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }];

      mockCache.get.mockReturnValue(null);
      mockStorage.getPatients.mockResolvedValue(patients);

      const result = await dataService.getPatients();

      expect(result).toEqual(patients);
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockStorage.getPatients).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      mockCache.get.mockReturnValue(null);
      mockStorage.getPatients.mockRejectedValue(new Error('Storage error'));

      await expect(dataService.getPatients()).rejects.toThrow(
        'Failed to load patients. Please try again.'
      );
    });
  });

  describe('createPatient', () => {
    it('should create patient and invalidate caches', async () => {
      const patientData = {
        name: 'Jane Doe',
        age: 30,
        phone_number: '+1234567890',
        record_number: 'REC-123457'
      };

      const createdPatient = {
        id: 2,
        ...patientData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockStorage.storePatients.mockResolvedValue([createdPatient]);

      const result = await dataService.createPatient(patientData);

      expect(result).toEqual(createdPatient);
      expect(mockStorage.storePatients).toHaveBeenCalledWith([createdPatient]);
      expect(mockCache.invalidatePattern).toHaveBeenCalledWith('patients_*');
    });
  });

  describe('searchPatients', () => {
    it('should search patients with caching', async () => {
      const searchQuery = 'John';
      const searchResults = [{
        id: 1,
        name: 'John Doe',
        age: 35,
        phone_number: '+1234567890',
        record_number: 'REC-123456',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }];

      mockCache.get.mockReturnValue(null);
      mockStorage.getPatients.mockResolvedValue(searchResults);

      const result = await dataService.searchPatients(searchQuery);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe('getDashboardStats', () => {
    it('should return cached dashboard stats when available', async () => {
      const cachedStats = {
        totalPatients: 100,
        totalAppointments: 50,
        todayAppointments: 5,
        upcomingAppointments: 10,
        treatmentStats: { 'Physical Therapy': 20 },
        lastUpdated: new Date().toISOString()
      };

      mockCache.get.mockReturnValue(cachedStats);

      const result = await dataService.getDashboardStats();

      expect(result).toEqual(cachedStats);
      expect(mockCache.get).toHaveBeenCalledWith('dashboard_stats');
    });

    it('should fetch and cache dashboard stats when not cached', async () => {
      const patients = [{ id: 1, name: 'John Doe', age: 35, phone_number: '+1234567890' }];
      const appointments = [{ id: 1, patientId: 1, date: '2024-01-01' }];

      mockCache.get.mockReturnValue(null);
      mockStorage.getPatients.mockResolvedValue(patients);
      mockStorage.getAppointments.mockResolvedValue(appointments);

      const result = await dataService.getDashboardStats();

      expect(result.totalPatients).toBe(1);
      expect(result.totalAppointments).toBe(1);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });
});