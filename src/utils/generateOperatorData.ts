/**
 * Script to Generate 800 Realistic Medical Operators
 *
 * This script creates a comprehensive dataset of realistic medical professionals
 * including doctors, nurses, specialists, and administrative staff for testing
 * the MedRecPlus application with diverse roles and realistic names.
 */

import { Operator } from '../types';
import { DataService } from '../services/DataService';

// Comprehensive arrays for realistic medical professional names
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
  'Tyler',
  'Aaron',
  'Jose',
  'Adam',
  'Nathan',
  'Henry',
  'Douglas',
  'Zachary',
  'Peter',
  'Christian',
  'Marcus',
  'Albert',
  'Kyle',
  'Walter',
  'Harold',
  'Jeremy',
  'Ethan',
  'Carl',
  'Austin',
  'Gerald',
  'Connor',
  'Dylan',
  'Ian',
  'Bryan',
  'Adrian',
  'Nathaniel',
  'Caleb',
  'Oliver',
  'Eli',
  'Aaron',
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
  'Martha',
  'Christina',
  'Amanda',
  'Melissa',
  'Jacqueline',
  'Stephanie',
  'Patricia',
  'Rachel',
  'Carolyn',
  'Janet',
  'Virginia',
  'Maria',
  'Heather',
  'Diane',
  'Julie',
  'Joyce',
  'Victoria',
  'Kelly',
  'Nicole',
  'Lauren',
  'Cynthia'
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
  'Brooks',
  'Kelly',
  'Sanders',
  'Price',
  'Bennett',
  'Wood',
  'Barnes',
  'Ross',
  'Henderson',
  'Coleman',
  'Jenkins',
  'Perry',
  'Powell',
  'Long',
  'Patterson',
  'Hughes',
  'Flores',
  'Washington',
  'Butler',
  'Simmons',
  'Foster',
  'Gonzales',
  'Bryant',
  'Alexander',
  'Russell',
  'Griffin',
  'Diaz',
  'Hayes',
  'Myers',
  'Ford',
  'Hamilton'
];

// Comprehensive medical roles and specialties
const MEDICAL_ROLES = [
  // Medical Doctors (Specialists)
  'Cardiologist',
  'Neurologist',
  'Pediatrician',
  'Family Medicine Physician',
  'Emergency Medicine Physician',
  'Internal Medicine Physician',
  'Surgeon',
  'Orthopedic Surgeon',
  'Neurosurgeon',
  'Plastic Surgeon',
  'Cardiothoracic Surgeon',
  'Vascular Surgeon',
  'General Surgeon',
  'Dermatologist',
  'Gastroenterologist',
  'Endocrinologist',
  'Nephrologist',
  'Pulmonologist',
  'Rheumatologist',
  'Infectious Disease Specialist',
  'Oncologist',
  'Hematologist',
  'Allergist',
  'Immunologist',
  'Psychiatrist',
  'Anesthesiologist',
  'Radiologist',
  'Pathologist',
  'Nuclear Medicine Physician',
  'Physical Medicine & Rehabilitation',
  'Sports Medicine Physician',
  'Pain Management Specialist',
  'Sleep Medicine Specialist',

  // Surgical Subspecialties
  'Pediatric Surgeon',
  'Surgical Oncologist',
  'Trauma Surgeon',
  'Breast Surgeon',
  'Colorectal Surgeon',
  'Bariatric Surgeon',
  'Spine Surgeon',
  'Hand Surgeon',
  'Foot and Ankle Surgeon',
  'Ophthalmologist',
  'Otolaryngologist (ENT)',
  'Oral and Maxillofacial Surgeon',

  // Women's Health
  'Obstetrician/Gynecologist (OB/GYN)',
  'Maternal-Fetal Medicine Specialist',
  'Gynecologic Oncologist',
  'Reproductive Endocrinologist',
  'Urogynecologist',

  // Children's Specialists
  'Neonatologist',
  'Pediatric Cardiologist',
  'Pediatric Neurologist',
  'Pediatric Endocrinologist',
  'Pediatric Gastroenterologist',
  'Pediatric Pulmonologist',
  'Pediatric Nephrologist',
  'Pediatric Hematologist/Oncologist',
  'Developmental-Behavioral Pediatrician',
  'Adolescent Medicine Specialist',

  // Diagnostic and Therapeutic
  'Interventional Radiologist',
  'Interventional Cardiologist',
  'Electrophysiologist',
  'Neurophysiologist',
  'Clinical Neurophysiologist',

  // Nursing Professionals
  'Registered Nurse (RN)',
  'Nurse Practitioner (NP)',
  'Family Nurse Practitioner',
  'Adult-Gerontology Nurse Practitioner',
  'Pediatric Nurse Practitioner',
  "Women's Health Nurse Practitioner",
  'Neonatal Nurse Practitioner',
  'Psychiatric-Mental Health Nurse Practitioner',
  'Certified Nurse Midwife (CNM)',
  'Clinical Nurse Specialist (CNS)',
  'Nurse Anesthetist (CRNA)',

  // Nursing Leadership and Specialties
  'Head Nurse',
  'Charge Nurse',
  'Nurse Manager',
  'Director of Nursing',
  'Chief Nursing Officer',
  'Critical Care Nurse',
  'Emergency Room Nurse',
  'Operating Room Nurse',
  'Intensive Care Unit (ICU) Nurse',
  'Neonatal Intensive Care Unit (NICU) Nurse',
  'Pediatric Intensive Care Unit (PICU) Nurse',
  'Oncology Nurse',
  'Cardiac Care Nurse',
  'Dialysis Nurse',
  'Wound Care Nurse',
  'Infection Control Nurse',
  'Quality Improvement Nurse',

  // Allied Health Professionals
  'Physician Assistant (PA)',
  'Physical Therapist (PT)',
  'Occupational Therapist (OT)',
  'Speech-Language Pathologist',
  'Respiratory Therapist',
  'Radiologic Technologist',
  'Medical Laboratory Scientist',
  'Medical Technologist',
  'Clinical Laboratory Scientist',
  'Cytotechnologist',
  'Histotechnologist',
  'Phlebotomist',
  'Surgical Technologist',
  'Anesthesia Technician',
  'Pharmacist',
  'Clinical Pharmacist',
  'Hospital Pharmacist',
  'Ambulatory Care Pharmacist',

  // Mental Health Professionals
  'Clinical Psychologist',
  'Counseling Psychologist',
  'School Psychologist',
  'Marriage and Family Therapist',
  'Clinical Social Worker',
  'Psychiatric Social Worker',
  'Mental Health Counselor',
  'Substance Abuse Counselor',
  'Behavioral Health Specialist',

  // Rehabilitation Specialists
  'Physical Therapy Assistant',
  'Occupational Therapy Assistant',
  'Rehabilitation Counselor',
  'Prosthetist',
  'Orthotist',
  'Audiologist',
  'Hearing Instrument Specialist',

  // Diagnostic Imaging Professionals
  'Diagnostic Medical Sonographer',
  'Ultrasound Technician',
  'MRI Technologist',
  'CT Technologist',
  'Mammography Technologist',
  'Nuclear Medicine Technologist',
  'Radiation Therapist',
  'Dosimetrist',

  // Emergency and Critical Care
  'Paramedic',
  'Emergency Medical Technician (EMT)',
  'Critical Care Paramedic',
  'Flight Nurse',
  'Trauma Nurse Coordinator',

  // Medical Support Staff
  'Medical Assistant',
  'Certified Medical Assistant',
  'Patient Care Technician',
  'Unit Secretary',
  'Health Unit Coordinator',
  'Medical Scribe',
  'Clinical Documentation Specialist',

  // Administrative and Management
  'Hospital Administrator',
  'CEO/President',
  'Chief Medical Officer',
  'Chief Operating Officer',
  'Chief Financial Officer',
  'Department Director',
  'Service Line Director',
  'Practice Manager',
  'Clinic Manager',
  'Office Manager',
  'Patient Services Manager',
  'Health Information Manager',
  'Medical Records Manager',

  // Specialized Technical Staff
  'Genetic Counselor',
  'Perfusionist',
  'Surgical First Assistant',
  'Dietitian/Nutritionist',
  'Clinical Dietitian',
  'Registered Dietitian',
  'Diabetes Educator',
  'Asthma Educator',
  'Lactation Consultant',
  'Case Manager',
  'Care Coordinator',
  'Patient Navigator',
  'Discharge Planner',
  'Utilization Review Nurse',

  // Research and Academic
  'Clinical Research Coordinator',
  'Research Nurse',
  'Clinical Research Associate',
  'Biostatistician',
  'Epidemiologist',
  'Medical Educator',
  'Clinical Professor',
  'Academic Physician',

  // Public Health
  'Public Health Nurse',
  'Infection Preventionist',
  'Epidemiology Nurse',
  'Health Inspector',
  'Occupational Health Nurse',
  'Employee Health Nurse',

  // Specialty Nursing
  'Wound Ostomy Continence Nurse',
  'Enterostomal Therapy Nurse',
  'Forensic Nurse',
  'Legal Nurse Consultant',
  'Informatics Nurse',
  'Nursing Informaticist',
  'Telehealth Nurse',

  // Advanced Imaging and Diagnostics
  'Cardiac Sonographer',
  'Vascular Sonographer',
  'Pediatric Sonographer',
  'Breast Sonographer',
  'Neurosonographer',

  // Pharmacy Specialties
  'Compounding Pharmacist',
  'Oncology Pharmacist',
  'Pediatric Pharmacist',
  'Geriatric Pharmacist',
  'Consultant Pharmacist',
  'Pharmacy Technician',
  'Certified Pharmacy Technician',

  // Therapy Specialties
  'Music Therapist',
  'Art Therapist',
  'Recreation Therapist',
  'Massage Therapist',
  'Exercise Physiologist',
  'Kinesiotherapist',

  // Laboratory Specialties
  'Blood Bank Specialist',
  'Transfusion Medicine Specialist',
  'Cytogenetic Technologist',
  'Molecular Genetic Technologist',
  'Histology Technician',
  'Pathology Assistant',

  // Mental Health Advanced Practice
  'Psychiatric Nurse Practitioner',
  'Clinical Nurse Specialist in Psychiatry',
  'Mental Health Advanced Practice Nurse',

  // Community and Home Health
  'Home Health Nurse',
  'Hospice Nurse',
  'Palliative Care Nurse',
  'Community Health Nurse',
  'School Nurse',
  'Occupational Health Nurse',
  'Correctional Health Nurse',

  // Additional Medical Roles
  'Hyperbaric Technician',
  'Sterile Processing Technician',
  'Central Service Technician',
  'Patient Transporter',
  'Environmental Services Worker',
  'Material Handler',
  'Supply Chain Manager',
  'Clinical Engineer',
  'Biomedical Equipment Technician'
];

// Function to generate random ID
function generateId(): number {
  return Math.floor(Math.random() * 900000) + 100000;
}

// Function to generate random name
function generateName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

// Function to add professional titles
function addProfessionalTitle(name: string, role: string): string {
  const titles = ['Dr.', 'Dr.', 'Dr.', 'Dr.', 'Dr.', 'Dr.', 'Dr.', 'Dr.', 'Dr.', 'Dr.'];
  const nursingTitles = ['RN', 'LPN', 'BSN', 'MSN', 'DNP'];
  const paTitles = ['PA-C', 'PA'];
  const pharmacistTitles = ['Pharm.D.', 'RPh', 'BCOP'];

  const randomTitle = titles[Math.floor(Math.random() * titles.length)];

  if (role.includes('Nurse') || role.includes('Nursing')) {
    const nursingTitle = nursingTitles[Math.floor(Math.random() * nursingTitles.length)];
    return `${name}, ${nursingTitle}`;
  } else if (role.includes('Physician Assistant') || role.includes('PA')) {
    const paTitle = paTitles[Math.floor(Math.random() * paTitles.length)];
    return `${name}, ${paTitle}`;
  } else if (role.includes('Pharmacist')) {
    const pharmacistTitle = pharmacistTitles[Math.floor(Math.random() * pharmacistTitles.length)];
    return `${name}, ${pharmacistTitle}`;
  } else if (
    role.includes('Psychologist') ||
    role.includes('Therapist') ||
    role.includes('Counselor')
  ) {
    return name; // No medical doctor title for these roles
  } else if (
    role.includes('Technician') ||
    role.includes('Technologist') ||
    role.includes('Assistant') ||
    role.includes('Coordinator') ||
    role.includes('Manager') ||
    role.includes('Administrator') ||
    role.includes('Secretary') ||
    role.includes('Clerk') ||
    role.includes('Worker')
  ) {
    return name; // No professional titles for support staff
  } else {
    return `${randomTitle} ${name}`;
  }
}

// Create single operator record
function generateOperatorRecord(counter: number): Operator {
  const baseName = generateName();
  const role = MEDICAL_ROLES[Math.floor(Math.random() * MEDICAL_ROLES.length)];
  const professionalName = addProfessionalTitle(baseName, role);

  return {
    id: generateId() + counter, // Ensure unique IDs
    name: professionalName,
    role: role,
    created_at: new Date().toISOString()
  };
}

// Main function to generate all operators
export async function generate800Operators(): Promise<void> {

  const totalOperators = 800;
  const batchSize = 50; // Process in batches to avoid overwhelming the system
  const allOperators: Operator[] = [];

  // Get existing operators to determine starting counter
  const startCounter = 1;
  try {
    const existingOperators = await DataService.getOperators();
    if (existingOperators.length > 0) {
      // Start counter from existing operators
    }
  } catch {
    // Error getting existing operators
  }

  // Generate operators in batches
  for (let batch = 0; batch < totalOperators / batchSize; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, totalOperators);
    const batchOperators: Operator[] = [];

  
    for (let i = batchStart; i < batchEnd; i++) {
      const operator = generateOperatorRecord(startCounter + i);
      batchOperators.push(operator);
    }

    allOperators.push(...batchOperators);

    // Small delay to prevent blocking the main thread
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  // Get existing operators and combine with new ones
  const existingOperators = await DataService.getOperators();
  const combinedOperators = [...existingOperators, ...allOperators];

  // Remove duplicates based on name and role combination
  const uniqueOperators = combinedOperators.filter(
    (operator, index, self) =>
      index === self.findIndex(op => op.name === operator.name && op.role === operator.role)
  );

  await DataService.saveData('operators', uniqueOperators);

  // Statistics

  // Role distribution analysis
  const roleCounts = uniqueOperators.reduce(
    (acc, operator) => {
      const category = getRoleCategory(operator.role);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(roleCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([_category, count]) => {
      ((count / uniqueOperators.length) * 100).toFixed(1);
    });

  // Top 15 most common roles
  const roleDistribution = uniqueOperators.reduce(
    (acc, operator) => {
      acc[operator.role] = (acc[operator.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(roleDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .forEach(([_role, count]) => {
      ((count / uniqueOperators.length) * 100).toFixed(1);
    });
}

// Helper function to categorize roles
function getRoleCategory(role: string): string {
  if (role.includes('Surgeon')) return 'Surgical Specialists';
  if (role.includes('Cardi') || role.includes('Neuro') || role.includes('Pediatric'))
    return 'Medical Specialists';
  if (role.includes('Nurse')) return 'Nursing Staff';
  if (role.includes('Physician Assistant') || role.includes('PA')) return 'Physician Assistants';
  if (role.includes('Pharmacist')) return 'Pharmacy Staff';
  if (role.includes('Therapist') || role.includes('Physical') || role.includes('Occupational'))
    return 'Therapy & Rehabilitation';
  if (role.includes('Technologist') || role.includes('Technician')) return 'Technical Staff';
  if (role.includes('Manager') || role.includes('Director') || role.includes('Administrator'))
    return 'Administration & Management';
  if (role.includes('Coordinator') || role.includes('Navigator') || role.includes('Case Manager'))
    return 'Care Coordination';
  if (role.includes('Assistant') || role.includes('Aide')) return 'Support Staff';
  return 'Other Medical Professionals';
}

// Utility function to clear all operators (use with caution)
export async function clearAllOperators(): Promise<void> {
  await DataService.saveData('operators', []);
}

// Export for use in console or component
export const OperatorDataGenerator = {
  generate800Operators,
  clearAllOperators,
  generateOperatorRecord
};

// Make functions available globally for console access
declare global {
  interface Window {
    generate800Operators: () => Promise<void>;
    clearAllOperators: () => Promise<void>;
  }
}

// Attach functions to window object for console access
if (typeof window !== 'undefined') {
  window.generate800Operators = generate800Operators;
  window.clearAllOperators = clearAllOperators;

}
