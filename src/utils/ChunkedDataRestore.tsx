import { IndexedDBStorage } from './IndexedDBStorage';
import { Patient, Invoice, Appointment, VitalSigns, Treatment, Operator, CustomExamination, ReceiptConfig } from '../types';

// Generic type for data entities - includes all possible types with index signature
type DataEntity = (Patient & Record<string, unknown>) |
                   (Invoice & Record<string, unknown>) |
                   (Appointment & Record<string, unknown>) |
                   (Operator & Record<string, unknown>) |
                   (CustomExamination & Record<string, unknown>) |
                   (ReceiptConfig & Record<string, unknown>) |
                   (Record<string, unknown> & {
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

interface BackupData {
  operators: Operator[];
  treatments: Treatment[];
  patients: Patient[];
  appointments: Appointment[];
  invoices: Invoice[];
  backupDate: string;
  version: string;
}

interface RestoreProgress {
  stage: string;
  progress: number;
  total: number;
  current: string;
}

export class ChunkedDataRestore {
  private static readonly LOCALSTORAGE_LIMIT = 5 * 1024 * 1024; // 5MB per key

  static async restoreFromLargeFile(file: File, onProgress?: (progress: RestoreProgress) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        onProgress?.({
          stage: 'Reading file',
          progress: 0,
          total: 100,
          current: 'Initializing...'
        });

        // Use streaming approach for large files
        this.readLargeFileInChunks(file, onProgress)
          .then(async (backupData: BackupData) => {
            await this.processBackupData(backupData, onProgress);
            resolve();
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private static async readLargeFileInChunks(file: File, onProgress?: (progress: RestoreProgress) => void): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const chunkSize = 1024 * 1024; // 1MB chunks
      let offset = 0;
      let content = '';

      console.log(`📖 Starting to read file: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);

      const reader = new FileReader();

      const processChunk = () => {
        if (offset >= file.size) {
          console.log(`✅ File reading complete. Total content length: ${content.length} characters`);

          try {
            console.log('🔄 Parsing JSON content...');
            const backupData = JSON.parse(content) as BackupData;

            console.log('✅ JSON parsing successful! Data summary:', {
              operators: backupData.operators?.length || 0,
              treatments: backupData.treatments?.length || 0,
              patients: backupData.patients?.length || 0,
              appointments: backupData.appointments?.length || 0,
              invoices: backupData.invoices?.length || 0,
              backupDate: backupData.backupDate,
              version: backupData.version
            });

            resolve(backupData);
          } catch (error) {
            console.error('❌ JSON parsing failed:', error);
            console.error('📄 Content preview:', content.substring(0, 500) + '...');

            // Try to find JSON syntax errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorMatch = errorMessage.match(/position (\d+)/);
            if (errorMatch) {
              const position = parseInt(errorMatch[1]);
              const context = content.substring(Math.max(0, position - 100), position + 100);
              console.error('📍 Error context around position', position, ':', context);
            }

            reject(new Error('Failed to parse JSON: ' + error));
          }
          return;
        }

        const chunk = file.slice(offset, offset + chunkSize);
        reader.readAsText(chunk);
      };

      reader.onload = (e) => {
        const chunkContent = e.target?.result as string;
        content += chunkContent;
        offset += chunkSize;

        const progress = Math.round((offset / file.size) * 100);

        console.log(`📖 Read chunk: ${Math.round(offset / 1024 / 1024)}MB of ${Math.round(file.size / 1024 / 1024)}MB (${progress}%)`);

        onProgress?.({
          stage: 'Reading file',
          progress: progress,
          total: 100,
          current: `Read ${Math.round(offset / 1024 / 1024)}MB of ${Math.round(file.size / 1024 / 1024)}MB`
        });

        // Allow UI to update
        setTimeout(processChunk, 10);
      };

      reader.onerror = () => {
        console.error('❌ File reading error:', reader.error);
        reject(new Error('Failed to read file'));
      };

      processChunk();
    });
  }

  private static async processBackupData(backupData: BackupData, onProgress?: (progress: RestoreProgress) => void): Promise<void> {
    console.log('🔍 Starting processBackupData with:', {
      operators: backupData.operators?.length || 0,
      treatments: backupData.treatments?.length || 0,
      patients: backupData.patients?.length || 0,
      appointments: backupData.appointments?.length || 0,
      invoices: backupData.invoices?.length || 0
    });

    // Validate backup structure
    if (!backupData.operators || !backupData.treatments || !backupData.patients ||
        !backupData.appointments || !backupData.invoices) {
      console.error('❌ Invalid backup file structure:', {
        hasOperators: !!backupData.operators,
        hasTreatments: !!backupData.treatments,
        hasPatients: !!backupData.patients,
        hasAppointments: !!backupData.appointments,
        hasInvoices: !!backupData.invoices
      });
      throw new Error('Invalid backup file structure');
    }

    const stages = [
      { name: 'operators', data: backupData.operators, key: 'operators' },
      { name: 'treatments', data: backupData.treatments, key: 'treatments' },
      { name: 'patients', data: backupData.patients, key: 'patients' },
      { name: 'appointments', data: backupData.appointments, key: 'appointments' },
      { name: 'invoices', data: backupData.invoices, key: 'invoices' }
    ];

    console.log('📋 Processing stages:', stages.map(s => `${s.name}: ${s.data.length}`));

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      console.log(`🔄 Stage ${i + 1}/${stages.length}: Processing ${stage.name} (${stage.data.length} records)`);

      onProgress?.({
        stage: `Processing ${stage.name}`,
        progress: (i / stages.length) * 100,
        total: stages.length,
        current: `Processing ${stage.data.length} ${stage.name}...`
      });

      try {
        await this.processDataChunk(stage.data as DataEntity[], stage.key, onProgress);
        console.log(`✅ Completed processing ${stage.name}`);
      } catch (error) {
        console.error(`❌ Failed to process ${stage.name}:`, error);
        throw error;
      }
    }

    // Save metadata
    console.log('💾 Saving metadata...');
    onProgress?.({
      stage: 'Finalizing',
      progress: 95,
      total: 100,
      current: 'Saving metadata...'
    });

    localStorage.setItem('lastBackupDate', backupData.backupDate);
    localStorage.setItem('backupVersion', backupData.version);

    console.log('✅ All data processing completed!');
    onProgress?.({
      stage: 'Complete',
      progress: 100,
      total: 100,
      current: 'Restore completed successfully!'
    });
  }

  private static async processDataChunk(data: DataEntity[], storageKey: string, onProgress?: (progress: RestoreProgress) => void): Promise<void> {
    if (data.length === 0) {
      console.log(`⚠️ No data to process for ${storageKey}`);
      return;
    }

    console.log(`🔄 Processing ${data.length} records for ${storageKey}`);

    // Check if data exceeds localStorage limit
    const dataSize = JSON.stringify(data).length;
    console.log(`📊 Data size for ${storageKey}: ${Math.round(dataSize / 1024 / 1024)}MB`);

    if (dataSize > this.LOCALSTORAGE_LIMIT) {
      // Use IndexedDB for large datasets
      console.log(`💾 Using IndexedDB for ${storageKey} (${data.length} records)`);
      onProgress?.({
        stage: 'Saving to IndexedDB',
        progress: 0,
        total: 100,
        current: `Saving ${data.length} ${storageKey} records to IndexedDB...`
      });

      try {
        await IndexedDBStorage.saveData(storageKey, data);
        console.log(`✅ Successfully saved ${storageKey} to IndexedDB`);
      } catch (error) {
        console.error(`❌ Failed to save ${storageKey} to IndexedDB:`, error);
        throw error;
      }
    } else {
      // Save to localStorage for smaller datasets
      console.log(`💾 Using localStorage for ${storageKey} (${data.length} records)`);
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log(`✅ Successfully saved ${storageKey} to localStorage`);
      } catch (error) {
        console.error(`❌ Failed to save ${storageKey} to localStorage:`, error);
        throw error;
      }
    }
  }

  

  // Utility method to retrieve data from chunked storage
  static getDataFromStorage(key: string): DataEntity[] {
    // Check if data is stored in chunks
    const chunkCount = localStorage.getItem(`${key}_chunk_count`);

    if (chunkCount) {
      // Reassemble data from chunks
      const data: DataEntity[] = [];
      const count = parseInt(chunkCount);

      for (let i = 0; i < count; i++) {
        const chunkKey = `${key}_chunk_${i}`;
        const chunkData = localStorage.getItem(chunkKey);
        if (chunkData) {
          data.push(...JSON.parse(chunkData));
        }
      }

      return data;
    } else {
      // Single storage key
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }
  }

  // Method to clear chunked data
  static clearChunkedData(key: string): void {
    // Clear chunks
    const chunkCount = localStorage.getItem(`${key}_chunk_count`);
    if (chunkCount) {
      const count = parseInt(chunkCount);
      for (let i = 0; i < count; i++) {
        const chunkKey = `${key}_chunk_${i}`;
        localStorage.removeItem(chunkKey);
      }
      localStorage.removeItem(`${key}_chunk_count`);
    }

    // Clear main key
    localStorage.removeItem(key);
  }

  // Method to estimate if restore will succeed
  static async canHandleFileSize(fileSize: number): Promise<{ canHandle: boolean; reason?: string; recommendation?: string }> {
    const maxSize = 500 * 1024 * 1024; // 500MB limit

    if (fileSize > maxSize) {
      return {
        canHandle: false,
        reason: `File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds recommended limit (${Math.round(maxSize / 1024 / 1024)}MB)`,
        recommendation: 'Consider splitting the backup into smaller files.'
      };
    }

    // Check IndexedDB quota
    const quotaCheck = await IndexedDBStorage.checkQuota(fileSize);
    if (!quotaCheck.canStore) {
      return {
        canHandle: false,
        reason: quotaCheck.reason,
        recommendation: quotaCheck.recommendation
      };
    }

    return { canHandle: true };
  }
}