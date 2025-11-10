/**
 * Script to Generate 400,000 Appointments with Invoices
 *
 * This script creates a massive dataset of realistic appointment records
 * for testing the MedRecPlus application's scalability with enterprise-level data.
 * Each appointment includes realistic vital signs, treatments, and generates
 * a corresponding invoice with proper status distribution.
 */

import { Treatment, Appointment, Invoice, VitalSigns } from '../types';
import { DataService } from '../services/DataService';

// Realistic vital signs ranges
const VITAL_RANGES = {
  bloodPressure: {
    normal: ['110/70', '115/75', '120/80', '118/76', '122/78', '125/82'],
    elevated: ['130/85', '135/88', '140/90', '145/95', '150/100'],
    low: ['90/60', '95/65', '100/68', '105/70']
  },
  heartRate: { min: 45, max: 120, normal: { min: 60, max: 100 } },
  respirationRate: { min: 10, max: 30, normal: { min: 12, max: 20 } },
  borgScale: { min: 1, max: 10 }
};

// Invoice status distribution (realistic medical practice patterns)
const INVOICE_STATUS_DISTRIBUTION = {
  paid: 0.77,      // 77% paid immediately (redistributed from pending)
  unpaid: 0.15,    // 15% waiting for payment
  void: 0.08       // 8% cancelled/voided
};

// Function to generate random date within the last 2 years
function generateRandomDate(): string {
  const now = new Date();
  const twoYearsAgo = new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000));
  const randomTime = twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime());
  const date = new Date(randomTime);

  // Add random time during business hours (8 AM - 6 PM)
  const businessHourStart = 8;
  const businessHourEnd = 18;
  const randomHour = Math.floor(Math.random() * (businessHourEnd - businessHourStart)) + businessHourStart;
  const randomMinute = Math.floor(Math.random() * 60);

  date.setHours(randomHour, randomMinute, 0, 0);

  return date.toISOString();
}

// Function to generate realistic vital signs based on age and condition
function generateVitalSigns(patientAge: number): VitalSigns {
  const ageCategory = patientAge < 18 ? 'young' : patientAge < 65 ? 'adult' : 'elderly';

  // Heart rate varies by age
  let heartRateMin = VITAL_RANGES.heartRate.min;
  let heartRateMax = VITAL_RANGES.heartRate.max;

  if (ageCategory === 'young') {
    heartRateMin = 70;
    heartRateMax = 120;
  } else if (ageCategory === 'elderly') {
    heartRateMin = 50;
    heartRateMax = 90;
  }

  const heartRate = Math.floor(Math.random() * (heartRateMax - heartRateMin + 1)) + heartRateMin;
  const respirationRate = Math.floor(Math.random() * (VITAL_RANGES.respirationRate.max - VITAL_RANGES.respirationRate.min + 1)) + VITAL_RANGES.respirationRate.min;
  const borgScale = Math.floor(Math.random() * (VITAL_RANGES.borgScale.max - VITAL_RANGES.borgScale.min + 1)) + VITAL_RANGES.borgScale.min;

  // Blood pressure selection with some variation
  let bloodPressureArray = VITAL_RANGES.bloodPressure.normal;
  if (patientAge > 60) {
    bloodPressureArray = [...bloodPressureArray, ...VITAL_RANGES.bloodPressure.elevated];
  }
  if (Math.random() < 0.2) { // 20% chance of elevated pressure
    bloodPressureArray = [...bloodPressureArray, ...VITAL_RANGES.bloodPressure.elevated];
  }
  const bloodPressure = bloodPressureArray[Math.floor(Math.random() * bloodPressureArray.length)];

  return {
    bloodPressure,
    respirationRate,
    heartRate,
    borgScale
  };
}

// Function to select random treatments (1-4 treatments per appointment)
function selectRandomTreatments(allTreatments: Treatment[]): Treatment[] {
  if (allTreatments.length === 0) return [];

  const numTreatments = Math.floor(Math.random() * 4) + 1; // 1-4 treatments
  const selectedTreatments: Treatment[] = [];
  const availableTreatments = [...allTreatments];

  for (let i = 0; i < Math.min(numTreatments, availableTreatments.length); i++) {
    const randomIndex = Math.floor(Math.random() * availableTreatments.length);
    selectedTreatments.push(availableTreatments[randomIndex]);
    availableTreatments.splice(randomIndex, 1);
  }

  return selectedTreatments;
}

// Function to calculate total price from treatments
function calculateTotalPrice(treatments: Treatment[]): number {
  return treatments.reduce((total, treatment) => total + treatment.price, 0);
}

// Function to generate invoice number
function generateInvoiceNumber(appointmentId: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = String(appointmentId).padStart(6, '0');
  return `INV${year}${month}${day}${sequence}`;
}

// Function to select random invoice status based on distribution
function selectInvoiceStatus(): 'paid' | 'unpaid' | 'void' {
  const random = Math.random();
  let cumulative = 0;

  for (const [status, probability] of Object.entries(INVOICE_STATUS_DISTRIBUTION)) {
    cumulative += probability;
    if (random <= cumulative) {
      return status as 'paid' | 'unpaid' | 'void';
    }
  }

  return 'unpaid'; // Changed from 'pending' to 'unpaid' as default
}

// Main function to generate massive appointment dataset
export async function generate400KAppointmentsWithInvoices(): Promise<void> {
  console.log('🚀 Starting generation of 400,000 appointments with invoices...');
  console.log('⚠️  This is a MASSIVE dataset generation process.');
  console.log('⏱️  Estimated time: 5-15 minutes depending on system performance');
  console.log('');

  const totalAppointments = 400000;
  const batchSize = 2000; // Process in larger batches for efficiency
  const progressReportInterval = 20000; // Report every 20,000 appointments

  try {
    // Load existing data
    console.log('📊 Loading existing data...');
    const [patients, operators, treatments] = await Promise.all([
      DataService.getPatients(),
      DataService.getOperators(),
      DataService.getTreatments()
    ]);

    console.log(`   ✅ Loaded ${patients.length} patients`);
    console.log(`   ✅ Loaded ${operators.length} operators`);
    console.log(`   ✅ Loaded ${treatments.length} treatments`);

    if (patients.length === 0 || operators.length === 0 || treatments.length === 0) {
      throw new Error('Insufficient data to generate appointments. Please ensure patients, operators, and treatments exist.');
    }

    // Get existing appointments to determine starting ID
    let startId = 1;
    let existingAppointments: Appointment[] = [];
    let existingInvoices: Invoice[] = [];

    try {
      existingAppointments = await DataService.getData('appointments') as Appointment[];
      existingInvoices = await DataService.getData('invoices') as Invoice[];

      if (existingAppointments.length > 0) {
        const maxId = Math.max(...existingAppointments.map(apt => apt.id || 0));
        startId = maxId + 1;
        console.log(`📈 Found ${existingAppointments.length} existing appointments, starting from ID: ${startId}`);
      }
    } catch {
      console.log('ℹ️  No existing appointments found, starting fresh');
    }

    const allAppointments: Appointment[] = [...existingAppointments];
    const allInvoices: Invoice[] = [...existingInvoices];

    console.log(`🔄 Generating ${totalAppointments} new appointments in batches of ${batchSize}...`);
    console.log('');

    const startTime = Date.now();

    // Generate appointments in batches
    for (let batch = 0; batch < totalAppointments / batchSize; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, totalAppointments);
      const batchAppointments: Appointment[] = [];
      const batchInvoices: Invoice[] = [];

      // Progress reporting
      if (batchStart % progressReportInterval === 0) {
        const progress = ((batchStart / totalAppointments) * 100).toFixed(1);
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = (batchStart / elapsed).toFixed(0);
        console.log(`📝 Progress: ${progress}% (${batchStart}/${totalAppointments}) - ${rate} appointments/sec`);
      }

      for (let i = batchStart; i < batchEnd; i++) {
        const appointmentId = startId + i;

        // Select random data
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        const selectedTreatments = selectRandomTreatments(treatments);
        const appointmentDate = generateRandomDate();
        const vitalSigns = generateVitalSigns(patient.age || 50);
        const totalPrice = calculateTotalPrice(selectedTreatments);

        // Create appointment
        const appointment: Appointment = {
          id: appointmentId,
          patientName: patient.name,
          patientId: patient.id || appointmentId,
          operatorName: operator.name,
          operatorId: operator.id || Math.floor(Math.random() * 1000000),
          date: appointmentDate,
          vitalSigns,
          treatments: selectedTreatments,
          totalPrice,
          notes: `Generated appointment for ${patient.name}`,
          description: `Consultation with ${operator.name}`,
          created_at: appointmentDate
        };

        batchAppointments.push(appointment);

        // Create corresponding invoice
        const invoiceStatus = selectInvoiceStatus();
        const invoice: Invoice = {
          id: appointmentId, // Use same ID for simplicity
          invoiceNumber: generateInvoiceNumber(appointmentId),
          appointmentId: appointmentId,
          patientName: patient.name,
          patientId: patient.id || appointmentId,
          operatorName: operator.name,
          operatorId: operator.id || Math.floor(Math.random() * 1000000),
          date: appointmentDate,
          appointmentDate: appointmentDate,
          vitalSigns,
          treatments: selectedTreatments,
          totalAmount: totalPrice,
          status: invoiceStatus,
          created_at: appointmentDate,
          updated_at: invoiceStatus === 'paid' ? appointmentDate : undefined
        };

        batchInvoices.push(invoice);
      }

      // Add batches to main arrays
      allAppointments.push(...batchAppointments);
      allInvoices.push(...batchInvoices);

      // Periodic save to prevent memory issues and allow progress recovery
      if ((batch + 1) % 10 === 0 || batch === Math.floor(totalAppointments / batchSize) - 1) {
        console.log(`💾 Saving progress: ${allAppointments.length} appointments, ${allInvoices.length} invoices...`);

        try {
          await Promise.all([
            DataService.saveData('appointments', allAppointments),
            DataService.saveData('invoices', allInvoices)
          ]);

          const dataSize = JSON.stringify(allAppointments).length / 1024 / 1024; // MB
          console.log(`✅ Successfully saved (Data size: ${dataSize.toFixed(2)}MB)`);
        } catch (error) {
          console.error('❌ Error saving batch:', error);
          throw error;
        }

        // Small delay to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const rate = (totalAppointments / parseFloat(duration)).toFixed(0);

    // Final save
    await Promise.all([
      DataService.saveData('appointments', allAppointments),
      DataService.saveData('invoices', allInvoices)
    ]);

    // Generate comprehensive statistics
    console.log('\n🎉 Successfully generated massive dataset!');
    console.log('📊 Generation Statistics:');
    console.log(`   • Total Appointments Generated: ${totalAppointments.toLocaleString()}`);
    console.log(`   • Total Invoices Generated: ${totalAppointments.toLocaleString()}`);
    console.log(`   • Combined Dataset Size: ${(allAppointments.length + allInvoices.length).toLocaleString()} records`);
    console.log(`   • Generation Time: ${duration} seconds`);
    console.log(`   • Generation Rate: ${rate} appointments/second`);
    console.log(`   • Starting Appointment ID: ${startId}`);
    console.log(`   • Ending Appointment ID: ${startId + totalAppointments - 1}`);

    // Invoice status distribution
    const statusCounts = allInvoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n💰 Invoice Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / allInvoices.length) * 100).toFixed(1);
      console.log(`   • ${status.charAt(0).toUpperCase() + status.slice(1)}: ${count.toLocaleString()} (${percentage}%)`);
    });

    // Treatment popularity analysis
    const treatmentCounts = allAppointments.reduce((acc, appointment) => {
      appointment.treatments.forEach(treatment => {
        acc[treatment.name] = (acc[treatment.name] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🏥 Top 10 Most Popular Treatments:');
    Object.entries(treatmentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([treatment, count]) => {
        const percentage = ((count / totalAppointments) * 100).toFixed(1);
        console.log(`   • ${treatment}: ${count.toLocaleString()} appointments (${percentage}%)`);
      });

    // Date range analysis
    const dates = allAppointments.map(apt => new Date(apt.date));
    const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

    console.log('\n📅 Date Range Analysis:');
    console.log(`   • Earliest Appointment: ${earliestDate.toLocaleDateString()}`);
    console.log(`   • Latest Appointment: ${latestDate.toLocaleDateString()}`);
    console.log(`   • Date Span: ${Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))} days`);

    console.log('\n✨ Massive dataset generation completed successfully!');
    console.log('💡 Refresh the appointments page to see the new data.');
    console.log('⚠️  Note: Loading 400,000 records may take additional time in the UI.');

  } catch (error) {
    console.error('❌ Error during massive dataset generation:', error);
    console.log('💡 This may be due to browser memory limits or localStorage constraints.');
    console.log('🔧 Consider using smaller batch sizes or implementing server-side processing for such large datasets.');
    throw error;
  }
}

// Utility function to clear all appointments and invoices (use with caution)
export async function clearAllAppointmentsAndInvoices(): Promise<void> {
  console.log('🗑️ Clearing all appointments and invoices...');
  console.log('⚠️  This will delete ALL appointment and invoice data!');

  try {
    await Promise.all([
      DataService.saveData('appointments', []),
      DataService.saveData('invoices', [])
    ]);
    console.log('✅ All appointments and invoices cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

// Export for use in console or component
export const MassiveAppointmentGenerator = {
  generate400KAppointmentsWithInvoices,
  clearAllAppointmentsAndInvoices
};

// Make functions available globally for console access
declare global {
  interface Window {
    generate400KAppointments: () => Promise<void>;
    clearAllAppointmentsAndInvoices: () => Promise<void>;
  }
}

// Attach functions to window object for console access
if (typeof window !== 'undefined') {
  window.generate400KAppointments = generate400KAppointmentsWithInvoices;
  window.clearAllAppointmentsAndInvoices = clearAllAppointmentsAndInvoices;

  console.log('📋 Massive Appointment Generator Console Functions Available:');
  console.log('   • generate400KAppointments() - Generate 400,000 appointments with invoices');
  console.log('   • clearAllAppointmentsAndInvoices() - Clear all appointments and invoices');
  console.log('');
  console.log('⚠️  WARNING: This will generate 400,000 records and may take 5-15 minutes!');
  console.log('💾 Ensure you have sufficient browser memory and storage capacity.');
}