/**
 * Console Runner for Bulk Data Generator
 *
 * This file provides a user-friendly interface to run the massive data
 * generation script from the browser console with progress tracking and safety checks.
 */

import BulkDataGenerator from './BulkDataGenerator';
import { ProgressTracker } from './bulkDataRunnerExports';

// Main function with comprehensive workflow and safety checks
export async function runBulkDataGenerationMain(targetAppointments: number = 400000): Promise<void> {
  console.log('🏥 MedRecPlus - Bulk Data Generator');
  console.log('===================================');
  console.log(`📊 Target: Generate ${targetAppointments.toLocaleString()} appointments with invoices`);
  console.log('🎯 Each appointment includes:');
  console.log('   • Random patient from existing patient database');
  console.log('   • Random operator from medical staff database');
  console.log('   • Realistic treatment combinations');
  console.log('   • Age-appropriate vital signs');
  console.log('   • Realistic appointment scheduling (business hours)');
  console.log('   • Corresponding invoice with status distribution');
  console.log('   • Comprehensive medical notes');
  console.log('');

  // Pre-flight checks
  console.log('🔍 Running pre-flight checks...');

  // Check storage capacity
  const capacityCheck = await BulkDataGenerator.checkStorageCapacity(targetAppointments);
  console.log(`💾 Storage Analysis:`);
  console.log(`   • Estimated Size Required: ${capacityCheck.estimatedSizeMB} MB`);

  if (capacityCheck.availableSpaceMB > 0) {
    console.log(`   • Available Space: ${capacityCheck.availableSpaceMB} MB`);
  }

  console.log(`   • Status: ${capacityCheck.canGenerate ? '✅ OK' : '❌ Insufficient'}`);
  console.log(`   • Recommendation: ${capacityCheck.recommendation}`);

  if (!capacityCheck.canGenerate) {
    console.log('\n❌ Cannot proceed with generation due to storage limitations.');
    console.log('💡 Please free up storage space or reduce the target number of appointments.');
    return;
  }

  // Check existing data
  console.log('\n📋 Checking existing data...');
  try {
    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    const operators = JSON.parse(localStorage.getItem('operators') || '[]');
    const treatments = JSON.parse(localStorage.getItem('treatments') || '[]');
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');

    console.log(`   • Patients: ${patients.length.toLocaleString()}`);
    console.log(`   • Operators: ${operators.length.toLocaleString()}`);
    console.log(`   • Treatments: ${treatments.length.toLocaleString()}`);
    console.log(`   • Existing Appointments: ${appointments.length.toLocaleString()}`);
    console.log(`   • Existing Invoices: ${invoices.length.toLocaleString()}`);

    if (patients.length === 0 || operators.length === 0 || treatments.length === 0) {
      console.log('\n❌ Insufficient base data for generation');
      console.log('💡 Please ensure patients, operators, and treatments exist first.');
      return;
    }

    const totalExisting = appointments.length + invoices.length;
    if (totalExisting > 10000) {
      const confirmLarge = confirm(
        `Found ${totalExisting.toLocaleString()} existing records.\\n\\n` +
        `This is a large dataset. Generating ${targetAppointments.toLocaleString()} more appointments may take significant time.\\n\\n` +
        `Continue with generation?`
      );

      if (!confirmLarge) {
        console.log('❌ Generation cancelled by user.');
        return;
      }
    }

  } catch {
    console.log('⚠️ Could not check existing data, proceeding with generation...');
  }

  // Performance expectations
  console.log('\n⏱️ Performance Expectations:');
  console.log(`   • Estimated Time: ${(targetAppointments / 50000).toFixed(0)}-${(targetAppointments / 20000).toFixed(0)} minutes`);
  console.log(`   • Memory Usage: ${Math.round(targetAppointments * 0.0002)}-${Math.round(targetAppointments * 0.0005)}MB`);
  console.log(`   • Records Created: ${(targetAppointments * 2).toLocaleString()} total`);
  console.log(`   • Generation Rate: ~50,000 appointments/minute`);

  // Final confirmation
  const confirmGeneration = confirm(
    `Ready to generate ${targetAppointments.toLocaleString()} appointments with invoices?\\n\\n` +
    `⚠️ This is a resource-intensive operation that may take several minutes.\\n` +
    `⚠️ The browser may become temporarily unresponsive.\\n` +
    `⚠️ Consider closing other tabs/applications.\\n\\n` +
    `Click OK to continue or Cancel to abort.`
  );

  if (!confirmGeneration) {
    console.log('❌ Generation cancelled by user.');
    return;
  }

  console.log('\n🚀 Starting massive dataset generation...');
  console.log('⏳ Please be patient. Do not close this tab.');
  console.log('📊 Progress will be displayed every few seconds.');
  console.log('');

  ProgressTracker.reset();

  try {
    const startTime = Date.now();

    const result = await BulkDataGenerator.generateMassiveDataset({
      targetAppointments,
      batchSize: 10000,
      chunkSize: 5000,
      progressCallback: ProgressTracker.update
    });

    const endTime = Date.now();
    const totalDuration = ((endTime - startTime) / 1000 / 60).toFixed(2);

    console.log('\n🎉 MASSIVE DATASET GENERATION COMPLETED!');
    console.log('📊 Final Results:');
    console.log(`   • Appointments Generated: ${result.appointmentsGenerated.toLocaleString()}`);
    console.log(`   • Invoices Generated: ${result.invoicesGenerated.toLocaleString()}`);
    console.log(`   • Total Records Created: ${(result.appointmentsGenerated + result.invoicesGenerated).toLocaleString()}`);
    console.log(`   • Total Time: ${totalDuration} minutes`);
    console.log(`   • Average Rate: ${result.averageRate.toFixed(0)} appointments/second`);

    console.log('\n🔄 Next Steps:');
    console.log('   1. Refresh the appointments page to see new data');
    console.log('   2. Allow extra time for initial page load');
    console.log('   3. Test pagination and search performance');
    console.log('   4. Check invoice statistics and reports');
    console.log('   5. Monitor browser memory usage');

  } catch (error) {
    console.error('\n❌ Generation failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting Tips:');
    console.log('   • Refresh the page and try again');
    console.log('   • Close other browser tabs');
    console.log('   • Try generating smaller batches (e.g., 100K appointments)');
    console.log('   • Check browser console for specific errors');
    console.log('   • Ensure sufficient system RAM (8GB+ recommended)');
  }
}

// Convenience functions for common targets
async function generate400KDatasetMain(): Promise<void> {
  await runBulkDataGenerationMain(400000);
}

async function generate100KDataset(): Promise<void> {
  await runBulkDataGenerationMain(100000);
}

async function generate50KDataset(): Promise<void> {
  await runBulkDataGenerationMain(50000);
}

// Storage capacity checker
async function checkStorageCapacity(targetAppointments: number = 400000): Promise<void> {
  console.log('💾 Storage Capacity Check');
  console.log('========================');

  const check = await BulkDataGenerator.checkStorageCapacity(targetAppointments);

  console.log(`📊 Target Dataset: ${targetAppointments.toLocaleString()} appointments + invoices`);
  console.log(`📦 Estimated Size: ${check.estimatedSizeMB} MB`);

  if (check.availableSpaceMB > 0) {
    console.log(`💾 Available Space: ${check.availableSpaceMB} MB`);

    const usagePercentage = ((check.estimatedSizeMB / check.availableSpaceMB) * 100).toFixed(1);
    console.log(`📊 Space Usage: ${usagePercentage}% of available space`);
  }

  console.log(`🎯 Status: ${check.canGenerate ? '✅ Can Generate' : '❌ Cannot Generate'}`);
  console.log(`💡 Recommendation: ${check.recommendation}`);

  if (!check.canGenerate) {
    console.log('\n⚠️ Alternative Options:');
    console.log('   • Generate smaller dataset (e.g., 100K appointments)');
    console.log('   • Clear existing data to free up space');
    console.log('   • Use browser with more storage capacity');
  }
}

// System performance check
function checkSystemPerformance(): void {
  console.log('🖥️ System Performance Check');
  console.log('==========================');

  // Check memory
  if ('memory' in performance) {
    const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!memory) {
      console.log('💾 Memory Usage: Information not available');
    } else {
      const usedJSHeapSize = memory.usedJSHeapSize / 1024 / 1024;
      const totalJSHeapSize = memory.totalJSHeapSize / 1024 / 1024;
      const jsHeapSizeLimit = memory.jsHeapSizeLimit / 1024 / 1024;

    console.log(`💾 Memory Usage:`);
    console.log(`   • Used: ${usedJSHeapSize.toFixed(2)} MB`);
    console.log(`   • Allocated: ${totalJSHeapSize.toFixed(2)} MB`);
    console.log(`   • Limit: ${jsHeapSizeLimit.toFixed(2)} MB`);

    const memoryUsagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;
    console.log(`   • Usage: ${memoryUsagePercent.toFixed(1)}%`);

    if (memoryUsagePercent > 80) {
        console.log('   ⚠️ High memory usage detected');
      } else if (memoryUsagePercent > 60) {
        console.log('   ⚡ Moderate memory usage');
      } else {
        console.log('   ✅ Good memory availability');
      }
    }
  } else {
    console.log('   • Memory info not available');
  }

  // Check storage
  let storageAvailable = true;
  try {
    const testKey = 'storage_test_' + Date.now();
    const testValue = new Array(1000).fill('x').join('');
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
  } catch {
    storageAvailable = false;
  }

  console.log(`💾 LocalStorage: ${storageAvailable ? 'Available' : 'Limited/Unavailable'}`);

  // Check connection
  console.log(`🌐 Connection: ${navigator.onLine ? 'Online' : 'Offline'}`);

  // Browser info
  const userAgent = navigator.userAgent;
  const browserName = userAgent.includes('Chrome') ? 'Chrome' :
                      userAgent.includes('Firefox') ? 'Firefox' :
                      userAgent.includes('Safari') ? 'Safari' :
                      userAgent.includes('Edge') ? 'Edge' : 'Unknown';

  console.log(`🌍 Browser: ${browserName}`);

  // Hardware concurrency
  if ('hardwareConcurrency' in navigator) {
    console.log(`⚙️ CPU Cores: ${navigator.hardwareConcurrency}`);
  }

  console.log('\n💡 Performance Recommendations:');
  console.log('   • Use Chrome or Firefox for best performance');
  console.log('   • Close unnecessary tabs and applications');
  console.log('   • Ensure at least 8GB RAM for large datasets');
  console.log('   • Use a modern browser with IndexedDB support');
}

export {
  runBulkDataGenerationMain as runBulkDataGeneration,
  generate400KDatasetMain as generate400KDataset,
  generate100KDataset,
  generate50KDataset,
  checkStorageCapacity,
  checkSystemPerformance
};