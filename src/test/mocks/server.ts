import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock API endpoints
  http.get('/api/patients', () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          name: 'John Doe',
          age: 35,
          email: 'john@example.com',
          phone_number: '+1234567890',
          record_number: 'REC-123456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1
    });
  }),

  http.post('/api/patients', ({ request }) => {
    return HttpResponse.json({
      id: '2',
      ...request.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { status: 201 });
  }),

  http.get('/api/appointments', () => {
    return HttpResponse.json([
      {
        id: '1',
        patientId: '1',
        patientName: 'John Doe',
        operatorId: '1',
        operatorName: 'Dr. Smith',
        date: '2024-01-01',
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 72,
          respirationRate: 16,
          borgScale: 2
        },
        treatments: [
          {
            id: '1',
            name: 'Physical Therapy',
            price: 100,
            notes: 'Initial session'
          }
        ],
        totalPrice: 100,
        created_at: '2024-01-01T00:00:00Z'
      }
    ]);
  }),

  http.get('/api/invoices', () => {
    return HttpResponse.json([
      {
        id: '1',
        invoiceNumber: 'INV-001',
        patientId: '1',
        patientName: 'John Doe',
        operatorId: '1',
        operatorName: 'Dr. Smith',
        appointmentId: '1',
        appointmentDate: '2024-01-01',
        date: '2024-01-01',
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 72,
          respirationRate: 16,
          borgScale: 2
        },
        treatments: [
          {
            id: '1',
            name: 'Physical Therapy',
            price: 100,
            notes: 'Initial session'
          }
        ],
        totalAmount: 100,
        status: 'paid',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]);
  })
];

export const server = setupServer(...handlers);