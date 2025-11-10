import { Patient } from '../types';
import { DataService } from './DataService';

const STORAGE_KEY = 'patient_management_data';
const RECORD_COUNTER_KEY = 'patient_record_counter';

// Initialize with template data only if no data exists
// Cache the data to avoid repeated localStorage access
let cachedPatients: Patient[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 1000; // 1 second cache

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

// Sync version for immediate access
const getInitialPatientsSync = (): Patient[] => {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedPatients.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedPatients;
  }

  // Try localStorage first (sync)
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (existingData) {
      const parsedData = JSON.parse(existingData);
      console.log(`📊 Sync loaded ${parsedData.length} patients from localStorage`);
      cachedPatients = parsedData;
      cacheTimestamp = now;
      return cachedPatients;
    }
  } catch (error) {
    console.error("Error parsing localStorage data:", error);
  }

  // Try chunked localStorage data
  try {
    const chunkCount = localStorage.getItem(`${STORAGE_KEY}_chunk_count`);
    if (chunkCount) {
      const count = parseInt(chunkCount);
      const data: Patient[] = [];

      for (let i = 0; i < count; i++) {
        const chunkKey = `${STORAGE_KEY}_chunk_${i}`;
        const chunkData = localStorage.getItem(chunkKey);
        if (chunkData) {
          data.push(...JSON.parse(chunkData));
        }
      }

      if (data.length > 0) {
        console.log(`📊 Sync loaded ${data.length} patients from chunked localStorage`);
        cachedPatients = data;
        cacheTimestamp = now;
        return cachedPatients;
      }
    }
  } catch (error) {
    console.error("Error loading chunked data:", error);
  }

  // Return template data if no data found
  console.log("📊 No data found, returning template data");
  cachedPatients = templateData;
  cacheTimestamp = now;
  return templateData;
};

// Async version that tries IndexedDB first
const getInitialPatientsAsync = async (): Promise<Patient[]> => {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedPatients.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedPatients;
  }

  // Try to get data from DataService (IndexedDB first, then localStorage)
  try {
    const data = await DataService.getPatients();
    if (data && data.length > 0) {
      console.log(`📊 Async loaded ${data.length} patients from DataService`);
      cachedPatients = data;
      cacheTimestamp = now;
      return cachedPatients;
    }
  } catch (error) {
    console.error("Error loading patients from DataService:", error);
  }

  // Fallback to sync method
  return getInitialPatientsSync();
};

const getNextId = (): number => {
  const patients = getInitialPatientsSync();
  if (patients.length === 0) return 1;
  return Math.max(...patients.map((p: Patient) => p.id || 0)) + 1;
};

const savePatients = async (patients: Patient[]): Promise<void> => {
  // Save using DataService (handles both IndexedDB and localStorage)
  try {
    await DataService.saveData(STORAGE_KEY, patients);
    console.log(`💾 Saved ${patients.length} patients using DataService`);
  } catch (error) {
    console.warn("Could not save using DataService, falling back to localStorage:", error);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch (localStorageError) {
      console.warn("Could not save to localStorage either:", localStorageError);
    }
  }

  // Update cache
  cachedPatients = patients;
  cacheTimestamp = Date.now();
};

export const databaseService = {
  async getPatients(): Promise<Patient[]> {
    try {
      const patients = await getInitialPatientsAsync();
      return [...patients].sort((a, b) => b.id! - a.id!);
    } catch (error) {
      console.error("Error in getPatients:", error);
      return getInitialPatientsSync().sort((a, b) => b.id! - a.id!);
    }
  },

  async addPatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 50));

    const existingPatients = await getInitialPatientsAsync();
    const newPatient: Patient = {
      ...patient,
      id: getNextId(),
      created_at: new Date().toISOString(),
      record_number: (patient as Record<string, unknown>).record_number as string || '',
      name: (patient as Record<string, unknown>).name as string || '',
      age: (patient as Record<string, unknown>).age as number || 0,
      phone_number: (patient as Record<string, unknown>).phone_number as string || ''
    };

    existingPatients.push(newPatient);
    await savePatients(existingPatients);

    const currentCounter = parseInt(localStorage.getItem(RECORD_COUNTER_KEY) || '4');
    try {
      localStorage.setItem(RECORD_COUNTER_KEY, String(currentCounter + 1));
    } catch (error) {
      console.warn("Could not update counter:", error);
    }

    return newPatient.id!;
  },

  async updatePatient(id: number, patient: Omit<Patient, 'id' | 'created_at'>): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 50));

    const existingPatients = await getInitialPatientsAsync();
    const patientIndex = existingPatients.findIndex((p: Patient) => p.id === id);

    if (patientIndex === -1) {
      throw new Error('Patient not found');
    }

    existingPatients[patientIndex] = {
      ...existingPatients[patientIndex],
      ...patient
    };

    await savePatients(existingPatients);
    return 'Patient updated successfully';
  },

  async deletePatient(id: number): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 50));

    const existingPatients = await getInitialPatientsAsync();
    const filteredPatients = existingPatients.filter((p: Patient) => p.id !== id);

    if (filteredPatients.length === existingPatients.length) {
      throw new Error('Patient not found');
    }

    await savePatients(filteredPatients);
    return 'Patient deleted successfully';
  },

  async generateRecordNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const currentCounter = parseInt(localStorage.getItem(RECORD_COUNTER_KEY) || '4') + 1;

    try {
      localStorage.setItem(RECORD_COUNTER_KEY, String(currentCounter));
    } catch (error) {
      console.warn("Could not update counter:", error);
    }

    return `PT${year}${String(currentCounter).padStart(6, '0')}`;
  }
};