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

// Progress tracking for console output
class ProgressTracker {
  private static startTime: number = 0;
  private static lastUpdate: number = 0;

  static update(progress: {
    currentCount: number;
    totalCount: number;
    currentBatch: number;
    totalBatches: number;
    estimatedTimeRemaining: number;
  }): void {
    const now = Date.now();

    // Only update every 2 seconds to avoid console spam
    if (now - this.lastUpdate < 2000 && progress.currentCount < progress.totalCount) {
      return;
    }

    this.lastUpdate = now;
    const elapsed = (now - this.startTime) / 1000;
    const percentage = ((progress.currentCount / progress.totalCount) * 100).toFixed(1);
    const eta = progress.estimatedTimeRemaining;

    console.log(`📊 Progress: ${percentage}% (${progress.currentCount.toLocaleString()}/${progress.totalCount.toLocaleString()})`);
    console.log(`   • Batch: ${progress.currentBatch}/${progress.totalBatches}`);
    console.log(`   • Elapsed: ${elapsed.toFixed(1)}s`);

    if (eta > 0) {
      const etaMinutes = Math.floor(eta / 60);
      const etaSeconds = Math.floor(eta % 60);
      console.log(`   • ETA: ${etaMinutes}m ${etaSeconds}s`);
    }

    console.log('');
  }

  static reset(): void {
    this.startTime = Date.now();
    this.lastUpdate = 0;
  }
}

export { ProgressTracker };