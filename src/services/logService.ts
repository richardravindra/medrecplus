import { storage, ActivityLog, UnifiedStorage } from './UnifiedStorage';

interface LogEntry {
  id: number;
  action: string;
  operatorName: string;
  targetType: 'patient' | 'appointment' | 'invoice';
  targetId?: number;
  targetName?: string;
  patientId?: number;
  patientName?: string;
  timestamp: string;
  details?: string;
}

class LogService {
  private static instance: LogService;
  private nextId: number = 1;

  private constructor() {
    this.loadNextId();
  }

  static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  private async loadNextId(): Promise<void> {
    try {
      const storedLogs = await storage.getActivityLogs();
      if (storedLogs.length > 0) {
        this.nextId = Math.max(...storedLogs.map(log => parseInt(log.id) || 0)) + 1;
      }
    } catch (error) {
      console.error('Error loading next log ID:', error);
      this.nextId = 1;
    }
  }

  private async saveLog(log: LogEntry): Promise<void> {
    try {
      const logs = await storage.getActivityLogs();
      // Convert LogEntry to ActivityLog format
      const activityLog: ActivityLog = {
        id: log.id.toString(),
        timestamp: log.timestamp,
        action: log.action,
        userId: log.operatorName,
        details: {
          operatorName: log.operatorName,
          targetType: log.targetType,
          targetId: log.targetId,
          targetName: log.targetName,
          patientId: log.patientId,
          patientName: log.patientName,
          description: log.details
        }
      };
      logs.unshift(activityLog); // Add to beginning for chronological order (newest first)

      // Keep only last 500 logs to prevent storage issues
      if (logs.length > 500) {
        logs.splice(500);
      }

      await storage.storeActivityLogs(logs);
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  private getOperatorName(): string {
    // In a real app, this would come from authentication context
    // For now, we'll use a default or try to get it from localStorage
    const currentUser = localStorage.getItem('current_user');
    return currentUser || 'Admin';
  }

  // Patient actions
  async logPatientCreated(patientId: number, patientName: string): Promise<void> {
    const log: LogEntry = {
      id: this.nextId++,
      action: `created a new patient record`,
      operatorName: this.getOperatorName(),
      targetType: 'patient',
      targetId: patientId,
      targetName: patientName,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    await this.saveLog(log);
  }

  async logPatientUpdated(patientId: number, patientName: string): Promise<void> {
    const log: LogEntry = {
      id: this.nextId++,
      action: `updated patient information`,
      operatorName: this.getOperatorName(),
      targetType: 'patient',
      targetId: patientId,
      targetName: patientName,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    await this.saveLog(log);
  }

  async logPatientDeleted(patientId: number, patientName: string): Promise<void> {
    const log: LogEntry = {
      id: this.nextId++,
      action: `deleted patient record`,
      operatorName: this.getOperatorName(),
      targetType: 'patient',
      targetId: patientId,
      targetName: patientName,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    await this.saveLog(log);
  }

  // Appointment actions
  logAppointmentCreated(appointmentId: number, patientId: number, patientName: string): void {
    const log: LogEntry = {
      id: this.nextId++,
      action: `created a new appointment for ${patientName}`,
      operatorName: this.getOperatorName(),
      targetType: 'appointment',
      targetId: appointmentId,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    this.saveLog(log);
  }

  logAppointmentUpdated(appointmentId: number, patientId: number, patientName: string): void {
    const log: LogEntry = {
      id: this.nextId++,
      action: `updated appointment for ${patientName}`,
      operatorName: this.getOperatorName(),
      targetType: 'appointment',
      targetId: appointmentId,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    this.saveLog(log);
  }

  logAppointmentDeleted(appointmentId: number, patientId: number, patientName: string): void {
    const log: LogEntry = {
      id: this.nextId++,
      action: `deleted appointment of ${patientName}`,
      operatorName: this.getOperatorName(),
      targetType: 'appointment',
      targetId: appointmentId,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    this.saveLog(log);
  }

  // Invoice actions
  logInvoiceCreated(invoiceId: number, appointmentId: number, patientId: number, patientName: string, operatorName?: string): void {
    const log: LogEntry = {
      id: this.nextId++,
      action: `created an invoice from appointment of ${patientName}`,
      operatorName: operatorName || this.getOperatorName(),
      targetType: 'invoice',
      targetId: invoiceId,
      targetName: `Appointment ${appointmentId}`,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    this.saveLog(log);
  }

  logInvoiceUpdated(invoiceId: number, patientId: number, patientName: string): void {
    const log: LogEntry = {
      id: this.nextId++,
      action: `updated invoice for ${patientName}`,
      operatorName: this.getOperatorName(),
      targetType: 'invoice',
      targetId: invoiceId,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    this.saveLog(log);
  }

  logInvoiceDeleted(invoiceId: number, patientId: number, patientName: string, operatorName?: string): void {
    const log: LogEntry = {
      id: this.nextId++,
      action: `deleted invoice of ${patientName}`,
      operatorName: operatorName || this.getOperatorName(),
      targetType: 'invoice',
      targetId: invoiceId,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    this.saveLog(log);
  }

  logInvoicePaid(invoiceId: number, patientId: number, patientName: string): void {
    const log: LogEntry = {
      id: this.nextId++,
      action: `marked invoice as paid for ${patientName}`,
      operatorName: this.getOperatorName(),
      targetType: 'invoice',
      targetId: invoiceId,
      patientId: patientId,
      patientName: patientName,
      timestamp: this.getCurrentTimestamp()
    };
    this.saveLog(log);
  }

  // Generic action
  logAction(action: string, targetType: 'patient' | 'appointment' | 'invoice', targetId?: number, patientId?: number, patientName?: string): void {
    const log: LogEntry = {
      id: this.nextId++,
      action,
      operatorName: this.getOperatorName(),
      targetType,
      targetId,
      patientId,
      patientName,
      timestamp: this.getCurrentTimestamp()
    };
    this.saveLog(log);
  }

  // Get logs
  async getLogs(): Promise<LogEntry[]> {
    try {
      const activityLogs = await storage.getActivityLogs();
      // Convert ActivityLog[] to LogEntry[] using type-safe conversion
      return activityLogs.map((log: unknown) => {
        // Type guard to ensure we have an ActivityLog
        if (log && typeof log === 'object' && 'id' in log && 'action' in log && 'timestamp' in log) {
          return UnifiedStorage.convertActivityLogToLogEntry(log as ActivityLog);
        }
        // Fallback for malformed logs
        return {
          id: Date.now() + Math.random(),
          action: 'unknown',
          operatorName: 'Unknown',
          targetType: 'patient',
          timestamp: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Error loading logs:', error);
      return [];
    }
  }

  // Clear old logs (keep last 100)
  async clearOldLogs(): Promise<void> {
    try {
      const logs = await storage.getActivityLogs();
      if (logs.length > 100) {
        const recentLogs = logs.slice(0, 100);
        await storage.storeActivityLogs(recentLogs);
      }
    } catch (error) {
      console.error('Error clearing old logs:', error);
    }
  }
}

export default LogService.getInstance();