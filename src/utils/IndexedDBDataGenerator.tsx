/**
 * IndexedDB-Compatible Massive Data Generator
 *
 * This utility properly uses DataService.saveData() to leverage the existing
 * IndexedDB infrastructure for generating 400,000 appointments with invoices.
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

// Invoice status distribution
const INVOICE_STATUS_DISTRIBUTION = {
  paid: 0.65,
  unpaid: 0.15,
  pending: 0.12,
  void: 0.08
};

function generateRandomDate(): string {
  const now = new Date();
  const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
  const randomTime =
    twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime());
  const date = new Date(randomTime);

  const businessHourStart = 8;
  const businessHourEnd = 18;
  const randomHour =
    Math.floor(Math.random() * (businessHourEnd - businessHourStart)) + businessHourStart;
  const randomMinute = Math.floor(Math.random() * 60);

  date.setHours(randomHour, randomMinute, 0, 0);
  return date.toISOString();
}

function generateVitalSigns(patientAge: number): VitalSigns {
  const ageCategory = patientAge < 18 ? 'young' : patientAge < 65 ? 'adult' : 'elderly';

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
  const respirationRate =
    Math.floor(
      Math.random() * (VITAL_RANGES.respirationRate.max - VITAL_RANGES.respirationRate.min + 1)
    ) + VITAL_RANGES.respirationRate.min;
  const borgScale =
    Math.floor(Math.random() * (VITAL_RANGES.borgScale.max - VITAL_RANGES.borgScale.min + 1)) +
    VITAL_RANGES.borgScale.min;

  let bloodPressureArray = VITAL_RANGES.bloodPressure.normal;
  if (patientAge > 60) {
    bloodPressureArray = [...bloodPressureArray, ...VITAL_RANGES.bloodPressure.elevated];
  }
  if (Math.random() < 0.2) {
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

function selectRandomTreatments(allTreatments: Treatment[]): Treatment[] {
  if (allTreatments.length === 0) return [];

  const numTreatments = Math.floor(Math.random() * 4) + 1;
  const selectedTreatments: Treatment[] = [];
  const availableTreatments = [...allTreatments];

  for (let i = 0; i < Math.min(numTreatments, availableTreatments.length); i++) {
    const randomIndex = Math.floor(Math.random() * availableTreatments.length);
    selectedTreatments.push(availableTreatments[randomIndex]);
    availableTreatments.splice(randomIndex, 1);
  }

  return selectedTreatments;
}

function calculateTotalPrice(treatments: Treatment[]): number {
  return treatments.reduce((total, treatment) => total + treatment.price, 0);
}

function generateInvoiceNumber(appointmentId: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = String(appointmentId).padStart(6, '0');
  return `INV${year}${month}${day}${sequence}`;
}

function selectInvoiceStatus(): 'paid' | 'unpaid' | 'void' | 'pending' {
  const random = Math.random();
  let cumulative = 0;

  for (const [status, probability] of Object.entries(INVOICE_STATUS_DISTRIBUTION)) {
    cumulative += probability;
    if (random <= cumulative) {
      return status as 'paid' | 'unpaid' | 'void' | 'pending';
    }
  }

  return 'pending';
}

export class IndexedDBDataGenerator {
  static async generate400KAppointmentsWithInvoices(): Promise<void> {

    const totalAppointments = 400000;
    const batchSize = 5000; // Smaller batches to prevent memory issues
    const progressReportInterval = 25000; // Report every 25,000 appointments

    const [patients, operators, treatments] = await Promise.all([
        DataService.getPatients(),
        DataService.getOperators(),
        DataService.getTreatments()
      ]);


      if (patients.length === 0 || operators.length === 0 || treatments.length === 0) {
        throw new Error(
          'Insufficient data to generate appointments. Please ensure patients, operators, and treatments exist.'
        );
      }

      let startId = 1;
      let existingAppointments: Appointment[] = [];
      let existingInvoices: Invoice[] = [];

      try {
        existingAppointments = await DataService.getAppointments();
        existingInvoices = await DataService.getInvoices();

        if (existingAppointments.length > 0) {
          const maxId = Math.max(...existingAppointments.map(apt => apt.id || 0));
          startId = maxId + 1;
          }
      } catch {
        // If we can't get existing data, we'll start from ID 1
      }

      const allAppointments: Appointment[] = [...existingAppointments];
      const allInvoices: Invoice[] = [...existingInvoices];

      const startTime = Date.now();

      for (let batch = 0; batch < totalAppointments / batchSize; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, totalAppointments);
        const batchAppointments: Appointment[] = [];
        const batchInvoices: Invoice[] = [];

        if (batchStart % progressReportInterval === 0) {
          ((batchStart / totalAppointments) * 100).toFixed(1);
          ((Date.now() - startTime) / 1000).toFixed(1);
        }

        for (let i = batchStart; i < batchEnd; i++) {
          const appointmentId = startId + i;

          const patient = patients[Math.floor(Math.random() * patients.length)];
          const operator = operators[Math.floor(Math.random() * operators.length)];
          const selectedTreatments = selectRandomTreatments(treatments);
          const appointmentDate = generateRandomDate();
          const vitalSigns = generateVitalSigns(patient.age || 50);
          const totalPrice = calculateTotalPrice(selectedTreatments);

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

          const invoiceStatus = selectInvoiceStatus();
          const invoice: Invoice = {
            id: appointmentId,
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

        allAppointments.push(...batchAppointments);
        allInvoices.push(...batchInvoices);

        // Periodic save using DataService (which routes to IndexedDB automatically)
        if ((batch + 1) % 5 === 0 || batch === Math.floor(totalAppointments / batchSize) - 1) {
          await Promise.all([
              DataService.saveData('appointments', allAppointments),
              DataService.saveData('invoices', allInvoices)
            ]);

          // Allow UI to remain responsive
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const endTime = Date.now();
      ((endTime - startTime) / 1000).toFixed(2);

      // Final save
      await Promise.all([
        DataService.saveData('appointments', allAppointments),
        DataService.saveData('invoices', allInvoices)
      ]);

      const statusCounts = allInvoices.reduce(
        (acc, invoice) => {
          acc[invoice.status] = (acc[invoice.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      Object.entries(statusCounts).forEach(([_status, count]) => {
        ((count / allInvoices.length) * 100).toFixed(1);
      });

    }
}

// Make available globally for console access
declare global {
  interface Window {
    generate400KAppointmentsViaIndexedDB: () => Promise<void>;
    indexedDBDataGenerator: typeof IndexedDBDataGenerator;
  }
}

if (typeof window !== 'undefined') {
  window.generate400KAppointmentsViaIndexedDB =
    IndexedDBDataGenerator.generate400KAppointmentsWithInvoices;
  window.indexedDBDataGenerator = IndexedDBDataGenerator;

  // Debug logging removed - IndexedDB Data Generator Console Functions Available
}
