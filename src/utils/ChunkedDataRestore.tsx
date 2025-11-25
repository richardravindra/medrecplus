import { storage } from '../services/UnifiedStorage';
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

// Generic type for data entities - includes all possible types with index signature
type DataEntity =
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
  static async restoreFromLargeFile(
    file: File,
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<void> {
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

  private static async readLargeFileInChunks(
    file: File,
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const chunkSize = 1024 * 1024; // 1MB chunks
      let offset = 0;
      let content = '';

  
      const reader = new FileReader();

      const processChunk = () => {
        if (offset >= file.size) {

          try {
            const backupData = JSON.parse(content) as BackupData;

            resolve(backupData);
          } catch (error) {

            // Try to find JSON syntax errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorMatch = errorMessage.match(/position (\d+)/);
            if (errorMatch) {
              const position = parseInt(errorMatch[1]);
              content.substring(Math.max(0, position - 100), position + 100);
            }

            reject(new Error('Failed to parse JSON: ' + errorMessage));
          }
          return;
        }

        const chunk = file.slice(offset, offset + chunkSize);
        reader.readAsText(chunk);
      };

      reader.onload = e => {
        const chunkContent = e.target?.result as string;
        content += chunkContent;
        offset += chunkSize;

        const progress = Math.round((offset / file.size) * 100);

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
        reject(new Error('Failed to read file'));
      };

      processChunk();
    });
  }

  private static async processBackupData(
    backupData: BackupData,
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<void> {
    onProgress?.({
      stage: 'Starting restore',
      progress: 0,
      total: 100,
      current: `Found data: ${backupData.patients?.length || 0} patients, ${backupData.operators?.length || 0} operators`
    });

    // Validate backup structure
    if (
      !backupData.operators ||
      !backupData.treatments ||
      !backupData.patients ||
      !backupData.appointments ||
      !backupData.invoices
    ) {
      throw new Error('Invalid backup file structure');
    }

    // Report data availability
    onProgress?.({
      stage: 'Data validation complete',
      progress: 5,
      total: 100,
      current: `Data found - ${backupData.patients?.length || 0} patients, ${backupData.operators?.length || 0} operators`
    });

    const stages = [
      { name: 'operators', data: backupData.operators, key: 'operators' },
      { name: 'treatments', data: backupData.treatments, key: 'treatments' },
      { name: 'patients', data: backupData.patients, key: 'patients' },
      { name: 'appointments', data: backupData.appointments, key: 'appointments' },
      { name: 'invoices', data: backupData.invoices, key: 'invoices' }
    ];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];

      onProgress?.({
        stage: `Processing ${stage.name}`,
        progress: (i / stages.length) * 100,
        total: stages.length,
        current: `Processing ${stage.data.length} ${stage.name}...`
      });

      await this.processDataChunk(stage.data as DataEntity[], stage.key, onProgress);
    }

    // Save metadata
    onProgress?.({
      stage: 'Finalizing',
      progress: 95,
      total: 100,
      current: 'Saving metadata...'
    });

    localStorage.setItem('lastBackupDate', backupData.backupDate);
    localStorage.setItem('backupVersion', backupData.version);

    onProgress?.({
      stage: 'Complete',
      progress: 100,
      total: 100,
      current: 'Restore completed successfully!'
    });
  }

  private static async processDataChunk(
    data: DataEntity[],
    storageKey: string,
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<void> {
    if (data.length === 0) {
      return;
    }

    onProgress?.({
      stage: 'Saving to Unified Storage',
      progress: 0,
      total: 100,
      current: `Saving ${data.length} ${storageKey} records to storage...`
    });

    // Use UnifiedStorage (same as SimpleDataService) to ensure consistency
    await storage.store(storageKey, data);
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
  static async canHandleFileSize(
    fileSize: number
  ): Promise<{ canHandle: boolean; reason?: string; recommendation?: string }> {
    const maxSize = 500 * 1024 * 1024; // 500MB limit

    if (fileSize > maxSize) {
      return {
        canHandle: false,
        reason: `File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds recommended limit (${Math.round(maxSize / 1024 / 1024)}MB)`,
        recommendation: 'Consider splitting the backup into smaller files.'
      };
    }

    // Check available storage (UnifiedStorage doesn't have quota check, so we'll be optimistic)
    // UnifiedStorage handles both IndexedDB and localStorage automatically

    return { canHandle: true };
  }
}
