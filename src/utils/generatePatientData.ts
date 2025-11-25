/**
 * Script to Generate 10,000 Realistic Patient Records
 *
 * This script creates a comprehensive dataset of realistic patient information
 * for testing the MedRecPlus application with various medical conditions,
 * demographics, and realistic personal data.
 */

import { Patient } from '../types';
import { DataService } from '../services/DataService';

// Realistic data arrays for generating diverse patient records
const FIRST_NAMES = [
  // Male names
  'James',
  'John',
  'Robert',
  'Michael',
  'William',
  'David',
  'Richard',
  'Joseph',
  'Thomas',
  'Charles',
  'Christopher',
  'Daniel',
  'Matthew',
  'Anthony',
  'Mark',
  'Donald',
  'Steven',
  'Paul',
  'Andrew',
  'Joshua',
  'Kenneth',
  'Kevin',
  'Brian',
  'George',
  'Timothy',
  'Ronald',
  'Jason',
  'Edward',
  'Jeffrey',
  'Ryan',
  'Jacob',
  'Gary',
  'Nicholas',
  'Eric',
  'Jonathan',
  'Stephen',
  'Larry',
  'Justin',
  'Scott',
  'Brandon',
  'Benjamin',
  'Samuel',
  'Gregory',
  'Alexander',
  'Patrick',
  'Frank',
  'Raymond',
  'Jack',
  'Dennis',
  'Jerry',
  // Female names
  'Mary',
  'Patricia',
  'Jennifer',
  'Linda',
  'Elizabeth',
  'Barbara',
  'Susan',
  'Jessica',
  'Sarah',
  'Karen',
  'Lisa',
  'Nancy',
  'Betty',
  'Helen',
  'Sandra',
  'Donna',
  'Carol',
  'Ruth',
  'Sharon',
  'Michelle',
  'Laura',
  'Sarah',
  'Kimberly',
  'Ashley',
  'Deborah',
  'Dorothy',
  'Amy',
  'Angela',
  'Emily',
  'Brenda',
  'Emma',
  'Olivia',
  'Cynthia',
  'Marie',
  'Janet',
  'Catherine',
  'Frances',
  'Heather',
  'Tiffany',
  'Shirley',
  'Samantha',
  'Melissa',
  'Debra',
  'Stephanie',
  'Rebecca',
  'Laura',
  'Virginia',
  'Kathleen',
  'Pamela',
  'Martha'
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Thompson',
  'White',
  'Harris',
  'Clark',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Baker',
  'Carter',
  'Green',
  'Adams',
  'Nelson',
  'Campbell',
  'Mitchell',
  'Roberts',
  'Turner',
  'Phillips',
  'Campbell',
  'Parker',
  'Evans',
  'Edwards',
  'Collins',
  'Stewart',
  'Sanchez',
  'Morris',
  'Rogers',
  'Reed',
  'Cook',
  'Morgan',
  'Bell',
  'Murphy',
  'Bailey',
  'Rivera',
  'Cooper',
  'Richardson',
  'Cox',
  'Howard',
  'Ward',
  'Torres',
  'Peterson',
  'Gray',
  'Ramirez',
  'James',
  'Watson',
  'Brooks'
];

const STREETS = [
  'Main St',
  'Oak St',
  'Elm St',
  'Park Ave',
  'Maple Ave',
  'Cedar St',
  'Pine St',
  'Washington St',
  'Lincoln Ave',
  'Broadway',
  'Walnut St',
  'Market St',
  'Church St',
  'State St',
  'Franklin Ave',
  'Madison Ave',
  'Jefferson St',
  'Jackson St',
  'Adams St',
  'Wilson Ave',
  'Spring St',
  'Union Ave',
  'Mill St',
  'Lake St',
  'Hill St',
  'Park St',
  'View Dr',
  'Sunset Blvd',
  'Rose Ave',
  'Dogwood Dr',
  'Magnolia St',
  'Birch St',
  'Willow Way',
  'Forest Dr',
  'Meadow Ln',
  'River Rd',
  'Mountain View',
  'Valley View',
  'Sunrise Dr',
  'Oakwood Dr'
];

const CITIES = [
  'Springfield',
  'Franklin',
  'Georgetown',
  'Clinton',
  'Greenville',
  'Madison',
  'Salem',
  'Fairview',
  'Washington',
  'Lincoln',
  'Jacksonville',
  'Chester',
  'Milton',
  'Newport',
  'Hudson',
  'Dover',
  'Winchester',
  'Troy',
  'Lexington',
  'Ashland',
  'Burlington',
  'Manchester',
  'Oxford',
  'Clayton',
  'Auburn',
  'Cleveland',
  'Riverside',
  'Centerville',
  'Taylorsville',
  'Georgetown'
];

const STATES = [
  'IL',
  'OH',
  'CA',
  'TX',
  'FL',
  'NY',
  'PA',
  'GA',
  'NC',
  'MI',
  'NJ',
  'VA',
  'WA',
  'AZ',
  'MA',
  'TN',
  'IN',
  'MO',
  'MD',
  'WI',
  'CO',
  'MN',
  'SC',
  'AL',
  'LA',
  'KY',
  'OR',
  'OK',
  'CT',
  'UT',
  'IA',
  'NV',
  'AR',
  'MS',
  'KS',
  'NM',
  'NE',
  'ID',
  'WV',
  'HI'
];

// Realistic medical diagnoses
const DIAGNOSES = [
  // Common conditions
  'Hypertension',
  'Type 2 Diabetes Mellitus',
  'Hyperlipidemia',
  'Obesity',
  'Anxiety',
  'Depression',
  'Arthritis',
  'Asthma',
  'Chronic Obstructive Pulmonary Disease',
  'Gastroesophageal Reflux Disease',
  'Migraine',
  'Insomnia',
  'Allergic Rhinitis',
  'Sinusitis',
  'Otitis Media',
  'Pharyngitis',
  'Conjunctivitis',
  'Dermatitis',
  'Urinary Tract Infection',
  'Gastroenteritis',
  // More specific conditions
  'Coronary Artery Disease',
  'Congestive Heart Failure',
  'Atrial Fibrillation',
  'Chronic Kidney Disease',
  'Osteoporosis',
  'Thyroid Disorder',
  'Anemia',
  'Chronic Back Pain',
  'Fibromyalgia',
  'Sleep Apnea',
  'Irritable Bowel Syndrome',
  'Celiac Disease',
  'Psoriasis',
  'Eczema',
  'Benign Prostatic Hyperplasia',
  'Cataracts',
  'Glaucoma',
  'Macular Degeneration',
  'Hearing Loss',
  'Vertigo',
  // Preventive care
  'Routine Checkup',
  'Annual Physical Examination',
  'Vaccination Update',
  'Health Screening',
  'Preventive Care Visit',
  'Wellness Examination',
  'Health Maintenance Visit',
  'Routine Health Assessment',
  'Periodic Health Evaluation',
  'General Health Check'
];

// Phone number formats
function generatePhoneNumber(): string {
  const areaCodes = [
    '555',
    '212',
    '646',
    '917',
    '718',
    '347',
    '929',
    '516',
    '631',
    '914',
    '845',
    '203',
    '475',
    '860',
    '203',
    '202',
    '301',
    '410',
    '443',
    '703',
    '571',
    '704',
    '336',
    '919',
    '980',
    '803',
    '843',
    '864',
    '239',
    '305',
    '321',
    '352',
    '407',
    '561',
    '727',
    '772',
    '850',
    '863',
    '904',
    '954'
  ];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${exchange}-${number}`;
}

// Generate random age with realistic distribution
function generateAge(): number {
  // Higher probability for ages 30-70
  const rand = Math.random();
  if (rand < 0.6) {
    // 60% chance for 30-70
    return Math.floor(Math.random() * 41) + 30;
  } else if (rand < 0.8) {
    // 20% chance for 18-29
    return Math.floor(Math.random() * 12) + 18;
  } else if (rand < 0.95) {
    // 15% chance for 71-90
    return Math.floor(Math.random() * 20) + 71;
  } else {
    // 5% chance for under 18 or over 90
    return Math.random() < 0.5
      ? Math.floor(Math.random() * 17) + 1
      : Math.floor(Math.random() * 15) + 91;
  }
}

// Generate random address
function generateAddress(): string {
  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const street = STREETS[Math.floor(Math.random() * STREETS.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const state = STATES[Math.floor(Math.random() * STATES.length)];
  const zipCode = Math.floor(Math.random() * 90000) + 10000;
  return `${streetNumber} ${street}, ${city}, ${state} ${zipCode}`;
}

// Generate record number similar to the existing system
function generateRecordNumber(counter: number): string {
  const year = new Date().getFullYear();
  return `PT${year}${String(counter).padStart(6, '0')}`;
}

// Create single patient record
function generatePatientRecord(counter: number): Patient {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const fullName = `${firstName} ${lastName}`;

  return {
    record_number: generateRecordNumber(counter),
    name: fullName,
    age: generateAge(),
    phone_number: generatePhoneNumber(),
    address: generateAddress(),
    initial_diagnosis: DIAGNOSES[Math.floor(Math.random() * DIAGNOSES.length)],
    created_at: new Date().toISOString()
  };
}

// Main function to generate all patients
export async function generate10KPatients(): Promise<void> {

  const totalPatients = 10000;
  const batchSize = 1000; // Process in batches to avoid overwhelming the system
  const allPatients: Patient[] = [];

  // Get existing patients to determine starting counter
  let startCounter = 1;
  try {
    const existingPatients = await DataService.getPatients();
    if (existingPatients.length > 0) {
      // Find the highest existing record number
      const maxRecord = existingPatients.reduce((max, patient) => {
        const match = patient.record_number.match(/PT\d+(\d{6})/);
        if (match) {
          const counter = parseInt(match[1]);
          return Math.max(max, counter);
        }
        return max;
      }, 0);
      startCounter = maxRecord + 1;
        }
  } catch {
    // Error handled silently
  }

  // Generate patients in batches
  for (let batch = 0; batch < totalPatients / batchSize; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, totalPatients);
    const batchPatients: Patient[] = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const patient = generatePatientRecord(startCounter + i);
      batchPatients.push(patient);
    }

    allPatients.push(...batchPatients);

    // Save batch to storage periodically
    if (batch % 5 === 0 || batch === Math.floor(totalPatients / batchSize) - 1) {
      await DataService.saveData('patient_management_data', allPatients);
    }

    // Small delay to prevent blocking the main thread
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Final save and statistics
  await DataService.saveData('patient_management_data', allPatients);

  // Diagnosis distribution
  const diagnosisCounts = allPatients.reduce(
    (acc, patient) => {
      const diagnosis = patient.initial_diagnosis || 'Unknown';
      acc[diagnosis] = (acc[diagnosis] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(diagnosisCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([_diagnosis, _count]) => {
      ((_count / allPatients.length) * 100).toFixed(1);
    });
}

// Utility function to clear all existing patients
export async function clearAllPatients(): Promise<void> {
  await DataService.saveData('patient_management_data', []);
}

// Export for use in console or component
export const PatientDataGenerator = {
  generate10KPatients,
  clearAllPatients,
  generatePatientRecord
};
