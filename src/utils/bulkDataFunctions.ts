import { runBulkDataGeneration, checkStorageCapacity, generate400KDataset, generate100KDataset } from './bulkDataRunner';
import BulkDataGenerator from './BulkDataGenerator';

// Make functions available globally for console access
declare global {
  interface Window {
    runBulkDataGeneration: (target?: number) => Promise<void>;
    checkStorageCapacity: (target?: number) => Promise<void>;
    generate400KDataset: () => Promise<void>;
    generate100KDataset: () => Promise<void>;
    bulkDataGenerator: typeof BulkDataGenerator;
  }
}

// Assign functions to window object
if (typeof window !== 'undefined') {
  window.runBulkDataGeneration = runBulkDataGeneration;
  window.checkStorageCapacity = checkStorageCapacity;
  window.generate400KDataset = generate400KDataset;
  window.generate100KDataset = generate100KDataset;
  window.bulkDataGenerator = BulkDataGenerator;
}

export { runBulkDataGeneration, checkStorageCapacity, generate400KDataset, generate100KDataset };