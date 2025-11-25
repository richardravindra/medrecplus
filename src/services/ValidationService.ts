import * as z from 'zod';

// Zod schemas for runtime validation
export const PatientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  age: z.number().min(0, 'Invalid age').max(150, 'Invalid age'),
  phone_number: z.string().regex(/^[+]?[\d\s-()]+$/, 'Invalid phone format'),
  email: z.string().email('Invalid email format').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  medical_history: z.string().max(2000, 'Medical history too long').optional(),
  allergies: z.array(z.string().max(100)).optional(),
  custom_properties: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const CreatePatientSchema = PatientSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdatePatientSchema = CreatePatientSchema.partial();

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid('Invalid patient ID'),
  date: z.string().datetime('Invalid date format'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  treatment: z.string().min(1, 'Treatment required').max(200, 'Treatment too long'),
  notes: z.string().max(1000, 'Notes too long').optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'in-progress']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const CreateAppointmentSchema = AppointmentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateAppointmentSchema = CreateAppointmentSchema.partial();

export const OperatorSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3, 'Username too short').max(50, 'Username too long'),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['admin', 'operator', 'viewer']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const CreateOperatorSchema = OperatorSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Type exports
export type Patient = z.infer<typeof PatientSchema>;
export type CreatePatientRequest = z.infer<typeof CreatePatientSchema>;
export type UpdatePatientRequest = z.infer<typeof UpdatePatientSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type CreateAppointmentRequest = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentRequest = z.infer<typeof UpdateAppointmentSchema>;
export type Operator = z.infer<typeof OperatorSchema>;
export type CreateOperatorRequest = z.infer<typeof CreateOperatorSchema>;

export class ValidationService {
  private static schemas = {
    patient: PatientSchema,
    createPatient: CreatePatientSchema,
    updatePatient: UpdatePatientSchema,
    appointment: AppointmentSchema,
    createAppointment: CreateAppointmentSchema,
    updateAppointment: UpdateAppointmentSchema,
    operator: OperatorSchema,
    createOperator: CreateOperatorSchema
  };

  // Validation methods
  static validatePatient(data: unknown): Patient {
    return this.schemas.patient.parse(data);
  }

  static validateCreatePatient(data: unknown): CreatePatientRequest {
    return this.schemas.createPatient.parse(data);
  }

  static validateUpdatePatient(data: unknown): UpdatePatientRequest {
    return this.schemas.updatePatient.parse(data);
  }

  static validateAppointment(data: unknown): Appointment {
    return this.schemas.appointment.parse(data);
  }

  static validateCreateAppointment(data: unknown): CreateAppointmentRequest {
    return this.schemas.createAppointment.parse(data);
  }

  static validateUpdateAppointment(data: unknown): UpdateAppointmentRequest {
    return this.schemas.updateAppointment.parse(data);
  }

  static validateOperator(data: unknown): Operator {
    return this.schemas.operator.parse(data);
  }

  static validateCreateOperator(data: unknown): CreateOperatorRequest {
    return this.schemas.createOperator.parse(data);
  }

  // Input sanitization
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, ''); // Remove data URIs
  }

  // Password validation
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Email validation
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone number validation
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    return phoneRegex.test(phone);
  }

  // Type guards with runtime validation
  static isPatient(obj: unknown): obj is Patient {
    return this.schemas.patient.safeParse(obj).success;
  }

  static isAppointment(obj: unknown): obj is Appointment {
    return this.schemas.appointment.safeParse(obj).success;
  }

  static isOperator(obj: unknown): obj is Operator {
    return this.schemas.operator.safeParse(obj).success;
  }

  // Assertion functions
  static assertIsPatient(obj: unknown): asserts obj is Patient {
    if (!this.isPatient(obj)) {
      throw new Error('Invalid Patient object');
    }
  }

  static assertIsAppointment(obj: unknown): asserts obj is Appointment {
    if (!this.isAppointment(obj)) {
      throw new Error('Invalid Appointment object');
    }
  }

  static assertIsOperator(obj: unknown): asserts obj is Operator {
    if (!this.isOperator(obj)) {
      throw new Error('Invalid Operator object');
    }
  }

  // Sanitize object recursively
  static sanitizeObject(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}
