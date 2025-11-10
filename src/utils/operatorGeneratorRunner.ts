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

// Function to generate 800 medical operators with enhanced logging
export async function generate800MedicalOperators(): Promise<void> {
  try {
    console.log('🏥 MedRecPlus Medical Operator Generator');
    console.log('==========================================');
    console.log('🚀 Starting generation of 800 medical operators...');
    console.log('⏱️ This may take a few minutes to complete...\n');

    await generate800Operators();

    console.log('\n🎉 Operator generation completed successfully!');
    console.log('📊 Please refresh the operator settings page to see the new staff members.');
  } catch (error) {
    console.error('❌ Error during operator generation:', error);
  }
}

// Function to clear all operators with safety confirmation
export async function clearAllMedicalOperators(): Promise<void> {
  console.log('⚠️ WARNING: This will delete ALL operators from the system!');
  console.log('🔒 This action cannot be undone.');
  console.log('💡 If you\'re sure, type: clearAllMedicalOperators() again in the console.');

  try {
    await clearAllOperators();
    console.log('✅ All operators cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing operators:', error);
  }
}

// Main function with comprehensive workflow
export async function runOperatorGeneration(): Promise<void> {
  console.log('🏥 MedRecPlus - Medical Operator Data Generator');
  console.log('==============================================');
  console.log('📋 This will generate 800 realistic medical professionals including:');
  console.log('   • Medical Doctors (various specialties)');
  console.log('   • Surgeons (all surgical specialties)');
  console.log('   • Nursing Professionals (all levels)');
  console.log('   • Allied Health Professionals');
  console.log('   • Allied Health Professionals');
  console.log('   • Administrative Staff');
  console.log('   • Technical and Support Staff');
  console.log('');

  const startTime = Date.now();

  try {
    await generate800MedicalOperators();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n⏱️ Generation completed in ${duration} seconds`);
    console.log('🔄 Please refresh the browser page to see all operators in the settings.');

  } catch (error) {
    console.error('❌ Generation failed:', error);
    console.log('💡 Please check the browser console for detailed error information.');
  }
}

// Attach functions to window object for console access
if (typeof window !== 'undefined') {
  window.generate800MedicalOperators = generate800MedicalOperators;
  window.clearAllMedicalOperators = clearAllMedicalOperators;
  window.runOperatorGeneration = runOperatorGeneration;

  console.log('📋 Medical Operator Generator Console Functions Available:');
  console.log('   • runOperatorGeneration() - Complete generation workflow with stats');
  console.log('   • generate800MedicalOperators() - Generate 800 medical operators');
  console.log('   • clearAllMedicalOperators() - Clear all existing operators');
  console.log('');
  console.log('💡 Tip: Use runOperatorGeneration() for the best experience!');
}

