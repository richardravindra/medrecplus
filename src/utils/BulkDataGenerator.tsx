/**
 * Bulk Data Generator for Massive Medical Datasets
 *
 * This utility generates large-scale medical appointment and invoice data
 * for enterprise-level testing of the MedRecPlus application.
 * Optimized for IndexedDB storage with chunked processing.
 */

import { Appointment, Invoice, VitalSigns, Treatment } from '../types';
import { DataService } from '../services/DataService';

interface GenerationProgress {
  currentBatch: number;
  totalBatches: number;
  currentCount: number;
  totalCount: number;
  startTime: number;
  estimatedTimeRemaining: number;
}

interface GenerationConfig {
  batchSize: number;
  chunkSize: number;
  targetAppointments: number;
  progressCallback?: (progress: GenerationProgress) => void;
}

export class BulkDataGenerator {
  // Realistic medical data arrays
  private static readonly MEDICAL_NOTES = [
    'Patient presents for routine checkup',
    'Follow-up appointment for chronic condition management',
    'New patient consultation and examination',
    'Emergency visit - acute symptoms',
    'Post-operative follow-up examination',
    'Preventive care and health screening',
    'Specialist referral consultation',
    'Medication review and adjustment',
    'Diagnostic imaging follow-up',
    'Treatment planning session',
    'Physical therapy evaluation',
    'Mental health counseling session',
    'Vaccination administration',
    'Wound care and dressing change',
    'Laboratory results discussion',
    'Chronic disease monitoring'
  ];

  private static readonly TREATMENT_COMBINATIONS = [
    // Common combinations
    ['General Consultation'],
    ['Blood Test Panel'],
    ['X-Ray Imaging'],
    ['Ultrasound'],
    ['ECG/EKG'],
    ['Vaccination'],

    // Specialist consultations
    ['Specialist Consultation', 'Blood Test Panel'],
    ['Specialist Consultation', 'Ultrasound'],
    ['Specialist Consultation', 'ECG/EKG'],

    // Diagnostic packages
    ['Blood Test Panel', 'X-Ray Imaging'],
    ['CT Scan', 'Blood Test Panel'],
    ['MRI Scan', 'Ultrasound'],
    ['Echocardiogram', 'ECG/EKG', 'Blood Test Panel'],

    // Treatment packages
    ['Minor Surgery', 'Anesthesia'],
    ['Physical Therapy Session', 'Ultrasound'],
    ['Chemotherapy', 'Blood Test Panel'],
    ['Dialysis Session', 'Blood Test Panel'],

    // Emergency care
    ['Emergency Room Visit', 'X-Ray Imaging', 'Blood Test Panel'],
    ['Emergency Room Visit', 'CT Scan'],
    ['Emergency Room Visit', 'Ultrasound'],

    // Preventive care
    ['Annual Physical Exam', 'Blood Test Panel', 'ECG/EKG'],
    ['Annual Physical Exam', 'Vaccination'],
    ['Health Screening', 'Blood Test Panel'],

    // Dental care
    ['Dental Cleaning', 'X-Ray Imaging'],
    ['Dental Filling', 'X-Ray Imaging'],
    ['Root Canal', 'X-Ray Imaging'],
    ['Tooth Extraction'],

    // Complex procedures
    ['Colonoscopy', 'Anesthesia'],
    ['Endoscopy', 'Anesthesia'],
    ['Cardiac Catheterization', 'Angiography'],
    ['Joint Replacement', 'Physical Therapy Session']
  ];

  /**
   * Generate realistic vital signs based on patient age and condition
   */
  private static generateVitalSigns(patientAge: number, hasEmergency: boolean = false): VitalSigns {
    const ageCategory = patientAge < 18 ? 'young' : patientAge < 65 ? 'adult' : 'elderly';

    // Heart rate varies by age and condition
    let heartRateMin = 45, heartRateMax = 120;
    if (ageCategory === 'young') {
      heartRateMin = 70; heartRateMax = 120;
    } else if (ageCategory === 'elderly') {
      heartRateMin = 50; heartRateMax = 90;
    }

    // Emergency conditions affect vital signs
    if (hasEmergency) {
      heartRateMin += 20; heartRateMax += 30;
    }

    const heartRate = Math.floor(Math.random() * (heartRateMax - heartRateMin + 1)) + heartRateMin;
    const respirationRate = Math.floor(Math.random() * (hasEmergency ? 15 : 21)) + (hasEmergency ? 15 : 10);
    const borgScale = Math.floor(Math.random() * 10) + 1;

    // Blood pressure selection with age and condition variations
    const normalBP = ['110/70', '115/75', '120/80', '118/76', '122/78', '125/82'];
    const elevatedBP = ['130/85', '135/88', '140/90', '145/95', '150/100'];
    const lowBP = ['90/60', '95/65', '100/68', '105/70'];

    let bloodPressureArray = [...normalBP];

    if (patientAge > 60 || Math.random() < 0.3) {
      bloodPressureArray = [...bloodPressureArray, ...elevatedBP];
    }

    if (Math.random() < 0.1) {
      bloodPressureArray = [...bloodPressureArray, ...lowBP];
    }

    if (hasEmergency && Math.random() < 0.7) {
      bloodPressureArray = [...bloodPressureArray, ...elevatedBP];
    }

    const bloodPressure = bloodPressureArray[Math.floor(Math.random() * bloodPressureArray.length)];

    return { bloodPressure, respirationRate, heartRate, borgScale };
  }

  /**
   * Generate realistic appointment date within business hours
   */
  private static generateAppointmentDate(startDate?: Date, endDate?: Date): string {
    const now = endDate || new Date();
    const twoYearsAgo = startDate || new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000));

    // Random date within the range
    const randomTime = twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime());
    const date = new Date(randomTime);

    // Business hours: 8 AM - 6 PM, Monday - Friday
    const businessHourStart = 8;
    const businessHourEnd = 18;
    const randomHour = Math.floor(Math.random() * (businessHourEnd - businessHourStart)) + businessHourStart;
    const randomMinute = Math.floor(Math.random() * 60);

    // Avoid weekends (Saturday = 6, Sunday = 0)
    if (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + (date.getDay() === 0 ? 1 : 2)); // Move to Monday
    }

    date.setHours(randomHour, randomMinute, 0, 0);
    return date.toISOString();
  }

  /**
   * Select random treatments with realistic combinations
   */
  private static selectTreatments(allTreatments: Treatment[], isEmergency: boolean = false): Treatment[] {
    if (isEmergency) {
      // Emergency treatments
      const emergencyCombinations = [
        ['Emergency Room Visit'],
        ['Emergency Room Visit', 'X-Ray Imaging'],
        ['Emergency Room Visit', 'Blood Test Panel'],
        ['Emergency Room Visit', 'CT Scan'],
        ['Emergency Room Visit', 'Ultrasound'],
        ['Emergency Room Visit', 'X-Ray Imaging', 'Blood Test Panel']
      ];
      const combination = emergencyCombinations[Math.floor(Math.random() * emergencyCombinations.length)];

      return combination.map(name =>
        allTreatments.find(t => t.name === name) || allTreatments[0]
      ).filter(Boolean);
    }

    // Regular appointments - use predefined combinations
    const combination = this.TREATMENT_COMBINATIONS[Math.floor(Math.random() * this.TREATMENT_COMBINATIONS.length)];

    return combination.map(name =>
      allTreatments.find(t => t.name === name) || allTreatments[0]
    ).filter(Boolean);
  }

  /**
   * Calculate total price from treatments
   */
  private static calculateTotalPrice(treatments: Treatment[]): number {
    return treatments.reduce((total, treatment) => total + treatment.price, 0);
  }

  /**
   * Select invoice status with realistic distribution
   */
  private static selectInvoiceStatus(): 'paid' | 'unpaid' | 'void' | 'pending' {
    const random = Math.random();
    if (random < 0.65) return 'paid';      // 65% paid immediately
    if (random < 0.80) return 'unpaid';    // 15% waiting for payment
    if (random < 0.92) return 'pending';   // 12% pending insurance
    return 'void';                          // 8% cancelled/voided
  }

  /**
   * Generate invoice number
   */
  private static generateInvoiceNumber(appointmentId: number): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(appointmentId).padStart(6, '0');
    return `INV${year}${month}${day}${sequence}`;
  }

  /**
   * Generate realistic medical notes
   */
  private static generateMedicalNotes(operatorName: string, treatments: Treatment[]): string {
    const baseNotes = this.MEDICAL_NOTES[Math.floor(Math.random() * this.MEDICAL_NOTES.length)];
    const treatmentNames = treatments.map(t => t.name).join(', ');

    const additionalNotes = [
      `Patient responded well to treatment`,
      `Follow-up recommended in 2 weeks`,
      `Patient advised to continue current medications`,
      `Lifestyle changes discussed`,
      `Educational materials provided`,
      `Referral to specialist considered`,
      `Preventive care measures discussed`,
      `Family medical history reviewed`
    ];

    const additionalNote = Math.random() < 0.7 ? additionalNotes[Math.floor(Math.random() * additionalNotes.length)] : '';

    return `${baseNotes} with ${operatorName}. Treatments: ${treatmentNames}. ${additionalNote}`.trim();
  }

  /**
   * Main method to generate massive appointment dataset
   */
  static async generateMassiveDataset(config: Partial<GenerationConfig> = {}): Promise<{
    appointmentsGenerated: number;
    invoicesGenerated: number;
    generationTime: number;
    averageRate: number;
  }> {
    const finalConfig: GenerationConfig = {
      batchSize: 10000,
      chunkSize: 5000,
      targetAppointments: 400000,
      progressCallback: undefined,
      ...config
    };

    console.log('🚀 Starting Massive Dataset Generation');
    console.log(`📊 Target: ${finalConfig.targetAppointments.toLocaleString()} appointments`);
    console.log(`📦 Batch size: ${finalConfig.batchSize.toLocaleString()}`);
    console.log(`🔧 Chunk size: ${finalConfig.chunkSize.toLocaleString()}`);
    console.log('');

    const startTime = Date.now();

    // Load existing data
    console.log('📋 Loading existing data...');
    const [patients, operators, treatments] = await Promise.all([
      DataService.getPatients(),
      DataService.getOperators(),
      DataService.getTreatments()
    ]);

    console.log(`   ✅ Patients: ${patients.length.toLocaleString()}`);
    console.log(`   ✅ Operators: ${operators.length.toLocaleString()}`);
    console.log(`   ✅ Treatments: ${treatments.length.toLocaleString()}`);

    if (patients.length === 0 || operators.length === 0 || treatments.length === 0) {
      throw new Error('Insufficient base data. Please ensure patients, operators, and treatments exist.');
    }

    // Get existing appointments to determine starting ID
    let startId = 1;
    try {
      const existingAppointments = await DataService.getAppointments();
      if (existingAppointments.length > 0) {
        const maxId = Math.max(...existingAppointments.map(apt => apt.id || 0));
        startId = maxId + 1;
        console.log(`📈 Found ${existingAppointments.length.toLocaleString()} existing appointments, starting from ID: ${startId}`);
      }
    } catch {
      console.log('ℹ️ No existing appointments found, starting fresh');
    }

    const totalBatches = Math.ceil(finalConfig.targetAppointments / finalConfig.batchSize);
    let appointmentsGenerated = 0;
    let invoicesGenerated = 0;

    // Generate data in batches
    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * finalConfig.batchSize;
      const batchEnd = Math.min(batchStart + finalConfig.batchSize, finalConfig.targetAppointments);
      const batchCount = batchEnd - batchStart;

      console.log(`📝 Batch ${batch + 1}/${totalBatches}: Generating ${batchCount.toLocaleString()} appointments...`);

      const batchAppointments: Appointment[] = [];
      const batchInvoices: Invoice[] = [];

      // Generate appointments for this batch
      for (let i = 0; i < batchCount; i++) {
        const appointmentId = startId + batchStart + i;

        // Select random data
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        // Determine if this is an emergency (10% chance)
        const isEmergency = Math.random() < 0.1;

        const selectedTreatments = this.selectTreatments(treatments, isEmergency);
        const appointmentDate = this.generateAppointmentDate();
        const vitalSigns = this.generateVitalSigns(patient.age || 50, isEmergency);
        const totalPrice = this.calculateTotalPrice(selectedTreatments);
        const medicalNotes = this.generateMedicalNotes(operator.name, selectedTreatments);

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
          notes: medicalNotes,
          description: `Consultation with ${operator.name}`,
          created_at: appointmentDate
        };

        batchAppointments.push(appointment);

        // Create corresponding invoice
        const invoiceStatus = this.selectInvoiceStatus();
        const invoice: Invoice = {
          id: appointmentId,
          invoiceNumber: this.generateInvoiceNumber(appointmentId),
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

      // Save batch to storage using DataService (will automatically route to IndexedDB)
      try {
        console.log(`   💾 Saving batch ${batch + 1} to storage...`);

        // Get existing data and add new batch
        const existingAppointments = await DataService.getAppointments();
        const existingInvoices = await DataService.getInvoices();

        const allAppointments = [...existingAppointments, ...batchAppointments];
        const allInvoices = [...existingInvoices, ...batchInvoices];

        await Promise.all([
          DataService.saveData('appointments', allAppointments),
          DataService.saveData('invoices', allInvoices)
        ]);

        appointmentsGenerated += batchAppointments.length;
        invoicesGenerated += batchInvoices.length;

        console.log(`   ✅ Batch ${batch + 1} saved successfully (${batchAppointments.length.toLocaleString()} appointments)`);

        // Report progress
        if (finalConfig.progressCallback) {
          const progress: GenerationProgress = {
            currentBatch: batch + 1,
            totalBatches,
            currentCount: appointmentsGenerated,
            totalCount: finalConfig.targetAppointments,
            startTime,
            estimatedTimeRemaining: this.calculateETA(startTime, appointmentsGenerated, finalConfig.targetAppointments)
          };
          finalConfig.progressCallback(progress);
        }

        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error saving batch ${batch + 1}:`, error);
        throw error;
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const averageRate = appointmentsGenerated / duration;

    console.log('');
    console.log('🎉 MASSIVE DATASET GENERATION COMPLETED!');
    console.log('📊 Final Statistics:');
    console.log(`   • Total Appointments Generated: ${appointmentsGenerated.toLocaleString()}`);
    console.log(`   • Total Invoices Generated: ${invoicesGenerated.toLocaleString()}`);
    console.log(`   • Combined Records: ${(appointmentsGenerated + invoicesGenerated).toLocaleString()}`);
    console.log(`   • Generation Time: ${duration.toFixed(2)} seconds`);
    console.log(`   • Average Rate: ${averageRate.toFixed(0)} appointments/second`);
    console.log('');

    // Generate statistics summary
    await this.generateStatisticsSummary();

    return {
      appointmentsGenerated,
      invoicesGenerated,
      generationTime: duration,
      averageRate
    };
  }

  /**
   * Calculate estimated time remaining
   */
  private static calculateETA(startTime: number, currentCount: number, totalCount: number): number {
    const elapsed = Date.now() - startTime;
    const rate = currentCount / (elapsed / 1000);
    const remaining = totalCount - currentCount;
    return rate > 0 ? remaining / rate : 0;
  }

  /**
   * Generate statistics summary for the generated dataset
   */
  private static async generateStatisticsSummary(): Promise<void> {
    console.log('📈 Generating Statistics Summary...');

    try {
      const [appointments, invoices] = await Promise.all([
        DataService.getAppointments(),
        DataService.getInvoices()
      ]);

      // Invoice status distribution
      const statusCounts = invoices.reduce((acc, invoice) => {
        acc[invoice.status] = (acc[invoice.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('💰 Invoice Status Distribution:');
      Object.entries(statusCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([status, count]) => {
          const percentage = ((count / invoices.length) * 100).toFixed(1);
          console.log(`   • ${status.charAt(0).toUpperCase() + status.slice(1)}: ${count.toLocaleString()} (${percentage}%)`);
        });

      // Treatment popularity analysis
      const treatmentCounts = appointments.reduce((acc, appointment) => {
        appointment.treatments.forEach(treatment => {
          acc[treatment.name] = (acc[treatment.name] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      console.log('\n🏥 Top 15 Most Popular Treatments:');
      Object.entries(treatmentCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([treatment, count]) => {
          const percentage = ((count / appointments.length) * 100).toFixed(1);
          console.log(`   • ${treatment}: ${count.toLocaleString()} appointments (${percentage}%)`);
        });

      // Date range analysis
      const dates = appointments.map(apt => new Date(apt.date));
      const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

      console.log('\n📅 Date Range Analysis:');
      console.log(`   • Earliest Appointment: ${earliestDate.toLocaleDateString()}`);
      console.log(`   • Latest Appointment: ${latestDate.toLocaleDateString()}`);
      console.log(`   • Date Span: ${Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))} days`);

      // Revenue analysis
      const totalRevenue = invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

      console.log('\n💰 Revenue Analysis:');
      console.log(`   • Total Revenue (Paid Invoices): Rp ${totalRevenue.toLocaleString()}`);
      console.log(`   • Average Revenue per Appointment: Rp ${Math.round(totalRevenue / appointments.length).toLocaleString()}`);

      console.log('\n✨ Statistics summary completed!');

    } catch (error) {
      console.error('❌ Error generating statistics:', error);
    }
  }

  /**
   * Check storage capacity before generation
   */
  static async checkStorageCapacity(targetAppointments: number): Promise<{
    canGenerate: boolean;
    estimatedSizeMB: number;
    availableSpaceMB: number;
    recommendation: string;
  }> {
    try {
      // Estimate storage required (rough calculation)
      const estimatedSizePerRecord = 0.001; // ~1KB per record
      const estimatedTotalSize = targetAppointments * 2 * estimatedSizePerRecord; // Appointments + Invoices
      const estimatedSizeMB = estimatedTotalSize / 1024 / 1024;

      // Check available space
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const availableSpace = (estimate.quota || 0) - (estimate.usage || 0);
        const availableSpaceMB = availableSpace / 1024 / 1024;

        const canGenerate = estimatedSizeMB < availableSpaceMB * 0.8; // Use 80% of available space

        return {
          canGenerate,
          estimatedSizeMB: Math.round(estimatedSizeMB),
          availableSpaceMB: Math.round(availableSpaceMB),
          recommendation: canGenerate
            ? 'Sufficient storage available for generation'
            : `Insufficient storage. Need ${Math.round(estimatedSizeMB)}MB but only ${Math.round(availableSpaceMB)}MB available.`
        };
      }

      return {
        canGenerate: true,
        estimatedSizeMB: Math.round(estimatedSizeMB),
        availableSpaceMB: -1,
        recommendation: 'Unable to check storage capacity, proceeding with generation'
      };

    } catch (error) {
      console.error('Error checking storage capacity:', error);
      return {
        canGenerate: true,
        estimatedSizeMB: -1,
        availableSpaceMB: -1,
        recommendation: 'Unable to check storage capacity, proceeding with generation'
      };
    }
  }
}

// Export for use in console or components
export default BulkDataGenerator;