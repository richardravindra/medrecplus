import { Patient } from '../types';
import SimpleDataService from './SimpleDataService';

// Export databaseService interface for compatibility
export const databaseService = {
  // Patients
  async getPatients() {
    const result = await SimpleDataService.getPatients();
    return result.data;
  },

  async addPatient(patient: Omit<Patient, 'id' | 'created_at'>) {
    const newPatient = await SimpleDataService.savePatient(patient);
    return newPatient.id;
  },

  async updatePatient(id: number, patient: Omit<Patient, 'id' | 'created_at'>) {
    const updated = await SimpleDataService.updatePatient(id, patient);
    return updated ? 'Patient updated successfully' : 'Patient not found';
  },

  async deletePatient(id: number) {
    const success = await SimpleDataService.deletePatient(id);
    return success ? 'Patient deleted successfully' : 'Patient not found';
  },

  async generateRecordNumber() {
    return await SimpleDataService.generateRecordNumber();
  }
};