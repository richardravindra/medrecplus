import { Column } from './VirtualizedTable';
import { Invoice } from '../../types';

export const invoiceColumns: Column<Invoice>[] = [
  {
    key: 'id',
    label: 'Invoice #',
    width: 100,
    sortable: true,
    dataType: 'number'
  },
  {
    key: 'patientName',
    label: 'Patient Name',
    width: 200,
    sortable: true,
    dataType: 'string'
  },
  {
    key: 'totalAmount',
    label: 'Total Amount',
    width: 150,
    sortable: true,
    dataType: 'number'
  },
  {
    key: 'paymentStatus',
    label: 'Payment Status',
    width: 150,
    sortable: true,
    dataType: 'string'
  },
  {
    key: 'created_at',
    label: 'Created At',
    width: 180,
    sortable: true,
    dataType: 'date'
  }
];