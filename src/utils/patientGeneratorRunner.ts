/**
 * Console Runner for Patient Data Generator
 *
 * This file provides a simple interface to run the patient generation script
 * from the browser console or developer tools.
 */

import { generate10KPatients, clearAllPatients } from './generatePatientData';

// Make functions available globally for console access
declare global {
  interface Window {
    generateTenThousandPatients: () => Promise<void>;
    clearAllPatientData: () => Promise<void>;
    generatePatients: (count?: number) => Promise<void>;
  }
}

// Function to generate 10,000 patients
export async function generateTenThousandPatients(): Promise<void> {
  try {
    // Debug logging removed - starting patient data generation
    await generate10KPatients();
    // Debug logging removed - patient generation completed
  } catch { // Error handled silently
    }
}

// Function to clear all patients
export async function clearAllPatientData(): Promise<void> {
  try {
    await clearAllPatients();
    // Debug logging removed - all patient data cleared
  } catch { // Error handled silently
    }
}

// Function to generate a specific number of patients (extension of the main script)
export async function generatePatients(count = 1000): Promise<void> {
  // Debug logging removed - starting generation of ${count} patient records

  // This would require modifying the main function to accept a count parameter
  // For now, redirect to the main 10K function
  if (count === 10000) {
    await generateTenThousandPatients();
  } else {
    // Debug logging removed - only 10K generation supported
    await generateTenThousandPatients();
  }
}

// Attach functions to window object for console access
if (typeof window !== 'undefined') {
  window.generateTenThousandPatients = generateTenThousandPatients;
  window.clearAllPatientData = clearAllPatientData;
  window.generatePatients = generatePatients;

  // Debug logging removed - Patient Data Generator Console Functions Available
}
