import { Column } from './VirtualizedTable';
import { Box } from '@mui/joy';
import { Appointment } from '../../types';

export const appointmentColumns: Column<Appointment>[] = [
  {
    key: 'id',
    label: 'ID',
    width: 80,
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
    key: 'vitalSigns',
    label: 'Vital Signs',
    width: 250,
    render: (value: unknown) => {
      const vitalSigns = value as {
        bloodPressure?: string;
        heartRate?: string;
        temperature?: string;
        weight?: string;
        height?: string;
      };

      const signs = [];
      if (vitalSigns.bloodPressure && vitalSigns.bloodPressure !== 'Not recorded') {
        signs.push(`BP: ${vitalSigns.bloodPressure}`);
      }
      if (vitalSigns.heartRate && vitalSigns.heartRate !== 'Not recorded') {
        signs.push(`HR: ${vitalSigns.heartRate}`);
      }
      if (vitalSigns.temperature && vitalSigns.temperature !== 'Not recorded') {
        signs.push(`Temp: ${vitalSigns.temperature}`);
      }
      if (vitalSigns.weight && vitalSigns.weight !== 'Not recorded') {
        signs.push(`Weight: ${vitalSigns.weight}`);
      }
      if (vitalSigns.height && vitalSigns.height !== 'Not recorded') {
        signs.push(`Height: ${vitalSigns.height}`);
      }
      return signs.length > 0 ? signs.join(', ') : 'No vital signs recorded';
    }
  },
  {
    key: 'treatments',
    label: 'Treatments',
    width: 250,
    render: (value: unknown) => {
      const treatments = value as { name: string }[];
      return (
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {treatments?.slice(0, 2).map((t) => t.name).join(', ')}
          {treatments?.length > 2 && ` (+${treatments.length - 2})`}
        </Box>
      );
    }
  },
  {
    key: 'totalPrice',
    label: 'Total Price',
    width: 120,
    sortable: true,
    dataType: 'number'
  },
  {
    key: 'operatorName',
    label: 'Operator',
    width: 150,
    sortable: true,
    dataType: 'string'
  }
];