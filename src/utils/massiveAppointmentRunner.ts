/**
 * Console Runner for Massive Appointment Data Generator
 *
 * This file provides a user-friendly interface to run the massive appointment
 * generation script from the browser console with enhanced logging and safety checks.
 */

import { generate400KAppointmentsWithInvoices, clearAllAppointmentsAndInvoices } from './generateMassiveAppointmentData';

// Make functions available globally for console access
declare global {
  interface Window {
    runMassiveAppointmentGeneration: () => Promise<void>;
    generate400KAppointmentsWithProgress: () => Promise<void>;
    clearAllAppointmentData: () => Promise<void>;
    checkSystemCapacity: () => void;
  }
}

// Enhanced logging function for massive dataset generation
export async function generate400KAppointmentsWithProgress(): Promise<void> {
  console.log('🏥 MedRecPlus - Massive Appointment Data Generator');
  console.log('==================================================');
  console.log('📊 This will generate 400,000 appointments with invoices');
  console.log('🎯 Each appointment includes:');
  console.log('   • Random patient from existing 10,000 patients');
  console.log('   • Random operator from 800 medical professionals');
  console.log('   • 1-4 random treatments with realistic pricing');
  console.log('   • Realistic vital signs based on patient age');
  console.log('   • Random appointment times (last 2 years)');
  console.log('   • Corresponding invoice with realistic status distribution');
  console.log('');
  console.log('⏱️  Estimated Performance Metrics:');
  console.log('   • Generation Time: 5-15 minutes');
  console.log('   • Memory Usage: 200-500MB');
  console.log('   • Storage Size: 100-200MB');
  console.log('   • Records Created: 800,000 total');
  console.log('');
  console.log('⚠️  PERFORMANCE WARNINGS:');
  console.log('   • This is a resource-intensive operation');
  console.log('   • Browser may become temporarily unresponsive');
  console.log('   • Consider closing other tabs/applications');
  console.log('   • Ensure sufficient system RAM (8GB+ recommended)');
  console.log('');

  // Check system capacity
  checkSystemCapacity();

  const userConfirmation = confirm(
    'Are you ready to generate 400,000 appointments?\n\n' +
    'This will take 5-15 minutes and create 800,000 total records.\n' +
    'The browser may become slow during generation.\n\n' +
    'Click OK to continue or Cancel to abort.'
  );

  if (!userConfirmation) {
    console.log('❌ Generation cancelled by user.');
    return;
  }

  console.log('🚀 Starting massive dataset generation...');
  console.log('⏳ Please be patient. Do not close this tab.');
  console.log('');

  const startTime = Date.now();

  try {
    await generate400KAppointmentsWithInvoices();

    const endTime = Date.now();
    const totalDuration = ((endTime - startTime) / 1000 / 60).toFixed(2);

    console.log(`\n🎉 MASSIVE DATASET GENERATION COMPLETED!`);
    console.log(`⏱️  Total Time: ${totalDuration} minutes`);
    console.log('💾 Data saved successfully to browser storage');
    console.log('');
    console.log('🔄 Next Steps:');
    console.log('   1. Refresh the appointments page to see new data');
    console.log('   2. Allow extra time for initial page load');
    console.log('   3. Test pagination and search performance');
    console.log('   4. Monitor browser memory usage');

  } catch (error) {
    console.error('❌ Generation failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting Tips:');
    console.log('   • Refresh the page and try again');
    console.log('   • Close other browser tabs');
    console.log('   • Try generating smaller batches');
    console.log('   • Check browser console for specific errors');
  }
}

// System capacity checker
export function checkSystemCapacity(): void {
  console.log('🔍 System Capacity Check:');

  // Check memory
  if ('memory' in performance) {
    const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!memory) {
      console.log('   • Memory information not available');
      return;
    }
    const usedJSHeapSize = memory.usedJSHeapSize / 1024 / 1024;
    const totalJSHeapSize = memory.totalJSHeapSize / 1024 / 1024;
    const jsHeapSizeLimit = memory.jsHeapSizeLimit / 1024 / 1024;

    console.log(`   • Memory Used: ${usedJSHeapSize.toFixed(2)}MB`);
    console.log(`   • Memory Allocated: ${totalJSHeapSize.toFixed(2)}MB`);
    console.log(`   • Memory Limit: ${jsHeapSizeLimit.toFixed(2)}MB`);

    if (usedJSHeapSize > 1000) {
      console.log('   ⚠️  High memory usage detected');
    }
  } else {
    console.log('   • Memory info not available');
  }

  // Check storage
  let storageAvailable = true;
  try {
    const testKey = 'storage_test';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
  } catch {
    storageAvailable = false;
  }

  console.log(`   • LocalStorage: ${storageAvailable ? 'Available' : 'Not Available'}`);

  // Check connection
  console.log(`   • Connection: ${navigator.onLine ? 'Online' : 'Offline'}`);

  // Browser info
  console.log(`   • Browser: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);

  console.log('');
}

// Complete workflow with safety checks
export async function runMassiveAppointmentGeneration(): Promise<void> {
  console.log('🏥 MedRecPlus - Enterprise Dataset Generator');
  console.log('=============================================');

  // Pre-flight checks
  checkSystemCapacity();

  // Check for existing data
  const existingAppointments = localStorage.getItem('appointments');
  // Note: existingInvoices variable kept for potential future data conflict checking
    const _existingInvoices = localStorage.getItem('invoices');
    void _existingInvoices; // Silence unused variable warning

  if (existingAppointments && JSON.parse(existingAppointments).length > 1000) {
    const confirmOverwrite = confirm(
      `Found ${JSON.parse(existingAppointments).length} existing appointments.\n\n` +
      'Do you want to add to existing data or clear everything first?\n\n' +
      'OK = Add to existing\nCancel = Clear and start fresh'
    );

    if (!confirmOverwrite) {
      const confirmClear = confirm(
        'This will delete ALL existing appointments and invoices.\n\n' +
        'Are you sure you want to continue?'
      );

      if (confirmClear) {
        await clearAllAppointmentsAndInvoices();
        console.log('✅ Existing data cleared');
      } else {
        console.log('❌ Operation cancelled');
        return;
      }
    }
  }

  // Run the generation
  await generate400KAppointmentsWithProgress();
}

// Safe clear function with confirmation
export async function clearAllAppointmentData(): Promise<void> {
  console.log('🗑️ MedRecPlus - Data Clearing Utility');
  console.log('=====================================');

  const appointments = localStorage.getItem('appointments');
  const invoices = localStorage.getItem('invoices');

  let appointmentCount = 0;
  let invoiceCount = 0;

  if (appointments) {
    appointmentCount = JSON.parse(appointments).length;
  }
  if (invoices) {
    invoiceCount = JSON.parse(invoices).length;
  }

  const confirmMessage =
    `This will delete ALL appointment and invoice data:\n\n` +
    `• ${appointmentCount.toLocaleString()} appointments\n` +
    `• ${invoiceCount.toLocaleString()} invoices\n\n` +
    `This action cannot be undone!\n\n` +
    `Are you absolutely sure you want to continue?`;

  if (!confirm(confirmMessage)) {
    console.log('❌ Data clearing cancelled');
    return;
  }

  try {
    await clearAllAppointmentsAndInvoices();
    console.log('✅ All appointment and invoice data cleared successfully');
    console.log('💡 Refresh the page to see the changes');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

// Attach functions to window object for console access
if (typeof window !== 'undefined') {
  window.runMassiveAppointmentGeneration = runMassiveAppointmentGeneration;
  window.generate400KAppointmentsWithProgress = generate400KAppointmentsWithProgress;
  window.clearAllAppointmentData = clearAllAppointmentData;
  window.checkSystemCapacity = checkSystemCapacity;

  console.log('📋 Massive Appointment Generator Console Functions:');
  console.log('   • runMassiveAppointmentGeneration() - Complete workflow with safety checks');
  console.log('   • generate400KAppointmentsWithProgress() - Generation with detailed progress');
  console.log('   • clearAllAppointmentData() - Safe data clearing with confirmation');
  console.log('   • checkSystemCapacity() - Check browser resources');
  console.log('');
  console.log('💡 Recommended: Use runMassiveAppointmentGeneration() for the best experience!');
}

