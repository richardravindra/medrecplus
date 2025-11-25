export interface Patient {
  id?: number;
  record_number: string;
  name: string;
  age: number;
  address?: string;
  phone_number: string;
  initial_diagnosis?: string;
  created_at?: string;
  [key: string]: unknown; // Index signature for DataEntity compatibility
}

export interface ColumnVisibility {
  record_number: boolean;
  name: boolean;
  age: boolean;
  address: boolean;
  phone_number: boolean;
  initial_diagnosis: boolean;
  date_added: boolean;
}

export interface VitalSigns {
  bloodPressure: string;
  respirationRate: number;
  heartRate: number;
  borgScale: number;
  [key: `custom_${string}`]: string | number | undefined; // Allow dynamic properties for custom examinations
}

export interface Treatment {
  id: number;
  name: string;
  description?: string;
  price: number;
  created_at?: string;
  notes?: string;
  [key: string]: unknown; // Index signature for DataEntity compatibility
}

export interface Appointment {
  id: number;
  patientName: string;
  patientId: number;
  operatorName: string;
  operatorId: number;
  date: string;
  vitalSigns: VitalSigns;
  treatments: Treatment[];
  totalPrice: number;
  notes?: string;
  description?: string;
  created_at: string;
  [key: string]: unknown; // Index signature for DataEntity compatibility
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  appointmentId: number;
  patientName: string;
  patientId: number;
  operatorName: string;
  operatorId: number;
  date: string;
  appointmentDate: string;
  vitalSigns: VitalSigns;
  treatments: Treatment[];
  totalAmount: number;
  status: 'paid' | 'unpaid' | 'void' | 'pending';
  created_at: string;
  updated_at?: string;
  [key: string]: unknown; // Index signature for DataEntity compatibility
}

export interface Operator {
  id: number;
  name: string;
  role: string;
  created_at?: string;
  [key: string]: unknown; // Index signature for DataEntity compatibility
}

export interface CustomExamination {
  id: number;
  name: string;
  unit: string;
  created_at?: string;
  [key: string]: unknown; // Index signature for DataEntity compatibility
}

export interface ReceiptConfig {
  header: string;
  footer: string;
  [key: string]: unknown; // Index signature for DataEntity compatibility
}
