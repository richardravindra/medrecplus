/**
 * Console Runner for Medical Operator Data Generator
 *
 * This file provides a simple interface to run the operator generation script
 * from the browser console or developer tools.
 */

import { generate800Operators, clearAllOperators } from './generateOperatorData';

// Make functions available globally for console access
declare global {
  interface Window {
    generate800MedicalOperators: () => Promise<void>;
    clearAllMedicalOperators: () => Promise<void>;
    runOperatorGeneration: () => Promise<void>;
  }
}

// Function to generate 800 medical operators
export async function generate800MedicalOperators(): Promise<void> {
  try {
    await generate800Operators();
  } catch { // Error handled silently
    }
}

// Function to clear all operators with safety confirmation
export async function clearAllMedicalOperators(): Promise<void> {
  try {
    await clearAllOperators();
  } catch { // Error handled silently
    }
}

// Main function with comprehensive workflow
export async function runOperatorGeneration(): Promise<void> {
  const startTime = Date.now();

  try {
    await generate800MedicalOperators();

    const endTime = Date.now();
    ((endTime - startTime) / 1000).toFixed(2);
  } catch { // Error handled silently
    }
}

// Attach functions to window object for console access
if (typeof window !== 'undefined') {
  window.generate800MedicalOperators = generate800MedicalOperators;
  window.clearAllMedicalOperators = clearAllMedicalOperators;
  window.runOperatorGeneration = runOperatorGeneration;
}
