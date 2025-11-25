import ArrowBack from '@mui/icons-material/ArrowBack';
import Delete from '@mui/icons-material/Delete';
import MedicalServices from '@mui/icons-material/MedicalServices';
import Print from '@mui/icons-material/Print';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import CircularProgress from '@mui/joy/CircularProgress';
import Divider from '@mui/joy/Divider';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import AnimatedModal from '../components/AnimatedModal';
import { useToast } from '../contexts/ToastContext';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storage } from '../services/UnifiedStorage';
import { Invoice, Patient } from '../types';
import { formatCurrencyForPrint, useCurrency } from '../utils/currencyUtils';
import { log } from '../utils/logger';
import {
  createPrintFile,
  importTauriShell,
  isTauriEnvironment,
  printInvoiceWithDataURL
} from '../utils/tauriUtils';

interface ReceiptConfig {
  header: string;
  footer: string;
}

const defaultHeader = `BSP CENTER PHYSIOTHERAPY CLINIC
Ruko Rose Garden 7 No.11, JakaSetia, Bekasi Selatan 17148`;

const defaultFooter = `Thank you for your visit!
Semoga kesehatan selalu menyertai anda`;

const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currency] = useCurrency();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>({
    header: defaultHeader,
    footer: defaultFooter
  });
  const { showToast } = useToast();

  const loadPatient = useCallback(async (patientId: number) => {
    try {
      const foundPatient = await storage.getPatientById(patientId);
      if (foundPatient) {
        // Patient found, will be set below
      }
      setPatient(foundPatient);
    } catch { // Error handled silently
    }
  }, []);

  const loadInvoice = useCallback(async (invoiceId: number) => {
    try {
      const foundInvoice = await storage.getInvoiceById(invoiceId);

      if (foundInvoice) {
        setInvoice(foundInvoice);
        // Load the patient data
        await loadPatient(foundInvoice.patientId);
      } else {
        setError('Invoice not found');
      }
    } catch (err) {
      log.error('Failed to load invoice', { error: err, invoiceId }, 'InvoiceDetails');
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [loadPatient]);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        await loadInvoice(parseInt(id));
      }
      await loadReceiptConfig();
    };
    loadData();
  }, [id, loadInvoice]);

  const loadReceiptConfig = async () => {
    try {
      const storedConfig = await storage.getReceiptConfig();
      if (storedConfig && Object.keys(storedConfig).length > 0) {
        setReceiptConfig(storedConfig as ReceiptConfig);
      } else {
        // Use default receipt config
      }
    } catch { // Error handled silently
    }
  };

  const updateInvoiceStatus = async (newStatus: 'paid' | 'unpaid' | 'void') => {
    if (!invoice) return;

    setIsUpdating(true);
    try {
      const updatedInvoice = await storage.updateInvoice(invoice.id, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      if (updatedInvoice) {
        setInvoice(updatedInvoice);
      }
    } catch { // Error handled silently
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice) return;
    setDeleteModalOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoice) return;

    try {
      // Log invoice deletion
      log.info(
        'Invoice deleted',
        {
          id: invoice.id,
          patientId: invoice.patientId,
          patientName: invoice.patientName,
          operatorName: invoice.operatorName
        },
        'InvoiceDetails'
      );

      await storage.deleteInvoice(invoice.id);
      showToast('success', 'Invoice deleted successfully.');
      setDeleteModalOpen(false);
      navigate('/invoices');
    } catch {
      setError('Failed to delete invoice. Please try again.');
      setDeleteModalOpen(false);
    }
  };

  const cancelDeleteInvoice = () => {
    setDeleteModalOpen(false);
  };

  // Currency formatting now handled by the imported utility functions

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateForPrint = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      .replace(/\//g, '/');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${formattedDate} ${hours}:${minutes}`;
  };

  const handlePrint = async () => {
    if (!invoice || !patient) {
      return;
    }

    // Generate invoice text directly
    const treatmentsText = invoice.treatments
      .map(treatment => {
        let text = `- ${treatment.name.toUpperCase()}`;
        if (treatment.price) {
          text += ` - ${formatCurrencyForPrint(treatment.price, currency).replace(currency.symbol, currency.symbol.toUpperCase())}`;
        }
        if (treatment.notes && treatment.notes.trim()) {
          text += `\n  Notes: ${treatment.notes}`;
        }
        return text;
      })
      .join('\n');

    const invoiceText = `${receiptConfig.header}

TREATMENT RECEIPT

${'═'.repeat(50)}
DATE: ${formatDateForPrint(invoice.date)}
RECORD NUMBER: ${patient?.record_number || 'N/A'}
Patient Name: ${invoice.patientName}
Address: ${patient?.address || 'No address recorded'}
${'═'.repeat(50)}

TREATMENTS:
${treatmentsText}

${'═'.repeat(50)}
TOTAL: ${formatCurrencyForPrint(invoice.totalAmount, currency).replace(currency.symbol, currency.symbol.toUpperCase())}

INVOICE NUMBER: ${invoice.invoiceNumber}
OPERATOR: ${invoice.operatorName}
STATUS: ${invoice.status.toUpperCase()}

${'═'.repeat(50)}

${receiptConfig.footer}`;


    // Try Tauri native print first
    if (isTauriEnvironment()) {
      try {

        // Create temporary HTML file
        const tempFilePath = await createPrintFile(invoiceText);

        // Use shell to open the file with default application
        const shellModule = await importTauriShell();

        const { open } = shellModule as { open: (path: string) => Promise<void> };
        await open(tempFilePath);


        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/invoices');
        }, 1000);
        return;
      } catch {
        // Fallback to data URL method
        try {
          await printInvoiceWithDataURL(invoiceText);

          // Navigate back after a short delay
          setTimeout(() => {
            navigate('/invoices');
          }, 1000);
          return;
        } catch (fallbackError) {
          showToast('error', `Failed to print: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}. Please try again.`);
          return;
        }
      }
    } else {
      // Web environment - use data URL method
      try {
        await printInvoiceWithDataURL(invoiceText);

        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/invoices');
        }, 1000);
      } catch (error) {
        showToast('error', `Failed to print: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}
      >
        <Stack alignItems='center' spacing={2}>
          <CircularProgress />
          <Typography level='body-lg'>Loading invoice details...</Typography>
        </Stack>
      </Box>
    );
  }

  if (_error || !invoice) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant='outlined'
            startDecorator={<ArrowBack />}
            onClick={() => navigate('/invoices')}
            sx={{ borderRadius: 'sm' }}
          >
            Back to Invoices
          </Button>
        </Box>
        <Card>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography level='h4' color='danger' sx={{ mb: 2 }}>
              {_error || 'Invoice not found'}
            </Typography>
            <Typography level='body-sm' color='neutral' sx={{ mb: 3 }}>
              The invoice you're looking for doesn't exist or has been removed.
            </Typography>
            <Button variant='solid' onClick={() => navigate('/invoices')}>
              Back to Invoices
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        p: 2,
        boxSizing: 'border-box',
        minWidth: 0,
        maxWidth: '600px',
        mx: 'auto'
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant='outlined'
            startDecorator={<ArrowBack />}
            onClick={() => navigate('/invoices')}
            sx={{ borderRadius: 'sm' }}
          >
            Back to Invoices
          </Button>
          <Typography level='h2' sx={{ fontSize: '24px', ml: 2 }}>
            Invoice Details
          </Typography>
        </Box>
        <Button
          variant='solid'
          color='primary'
          startDecorator={<Print />}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            handlePrint();
          }}
          sx={{ borderRadius: 'sm' }}
        >
          Print
        </Button>
      </Box>

      {/* Invoice Status Control */}
      <Card sx={{ mb: 2, maxWidth: '600px', width: '100%', p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
          <Typography level='body-sm' sx={{ color: '#ffffff' }}>
            Invoice Status:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Select
              value={invoice.status}
              onChange={(_, newValue) => {
                if (
                  newValue &&
                  (newValue === 'paid' || newValue === 'unpaid' || newValue === 'void')
                ) {
                  updateInvoiceStatus(newValue);
                }
              }}
              disabled={isUpdating}
              sx={{
                minWidth: 120,
                color: '#ffffff',
                py: 0.5, // 6px top and bottom padding
                '& .MuiSelect-select': {
                  color: '#ffffff !important'
                }
              }}
            >
              <Option value='unpaid' sx={{ color: '#ffffff' }}>
                Unpaid
              </Option>
              <Option value='paid' sx={{ color: '#ffffff' }}>
                Paid
              </Option>
              <Option value='void' sx={{ color: '#ffffff' }}>
                Void
              </Option>
            </Select>
            {isUpdating && (
              <Typography level='body-sm' color='primary'>
                Updating...
              </Typography>
            )}
            <Button
              variant='solid'
              color='danger'
              startDecorator={<Delete />}
              onClick={handleDeleteInvoice}
              sx={{
                borderRadius: 'sm',
                backgroundColor: '#dc2626',
                '&:hover': {
                  backgroundColor: '#b91c1c'
                }
              }}
            >
              Delete Invoice
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Receipt Layout */}
      <Box
        sx={{
          backgroundColor: '#ffffff',
          color: '#000000',
          p: 4,
          borderRadius: 'sm',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: 1.6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {/* Clinic Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          {receiptConfig.header.split('\n').map((line, index) => (
            <Typography
              key={index}
              level={index === 0 ? 'h3' : 'body-sm'}
              sx={{
                fontWeight: index === 0 ? 'bold' : 'normal',
                mb: index === 0 ? 1 : 0.5,
                color: '#000000'
              }}
            >
              {line}
            </Typography>
          ))}
        </Box>

        <Divider sx={{ borderColor: '#000000', mb: 3 }} />

        {/* Receipt Title */}
        <Typography
          level='h4'
          sx={{ textAlign: 'center', fontWeight: 'bold', mb: 3, color: '#000000' }}
        >
          TREATMENT RECEIPT
        </Typography>

        {/* Patient Information */}
        <Box sx={{ mb: 3 }}>
          <Typography level='body-sm' sx={{ color: '#000000' }}>
            DATE: {formatDate(invoice.date)}
          </Typography>
          <Typography level='body-sm' sx={{ color: '#000000' }}>
            RECORD NUMBER: {patient?.record_number || 'N/A'}
          </Typography>
          <Typography level='body-sm' sx={{ color: '#000000' }}>
            Patient Name: {invoice.patientName}
          </Typography>
          <Typography level='body-sm' sx={{ color: '#000000' }}>
            Address: {patient?.address || 'No address recorded'}
          </Typography>
        </Box>

        {/* Treatments Section */}
        <Box sx={{ mb: 2 }}>
          <Typography level='body-sm' sx={{ fontWeight: 'bold', color: '#000000' }}>
            TREATMENTS:
          </Typography>
        </Box>

        {/* Treatments with Prices */}
        <Box sx={{ mb: 3 }}>
          {invoice.treatments.map(treatment => (
            <Box key={treatment.id}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography level='body-sm' sx={{ color: '#000000' }}>
                  {treatment.name.toUpperCase()}
                </Typography>
                <Typography level='body-sm' sx={{ color: '#000000' }}>
                  {formatCurrencyForPrint(treatment.price, currency)}
                </Typography>
              </Box>
              {treatment.notes && (
                <Typography
                  level='body-xs'
                  sx={{ color: '#000000', fontStyle: 'italic', ml: 2, mb: 1 }}
                >
                  Notes: {treatment.notes}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Total */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography level='body-sm' sx={{ fontWeight: 'bold', color: '#000000' }}>
              TOTAL
            </Typography>
            <Typography level='body-sm' sx={{ fontWeight: 'bold', color: '#000000' }}>
              {formatCurrencyForPrint(invoice.totalAmount, currency)}
            </Typography>
          </Box>
        </Box>

        {/* Additional Invoice Info */}
        <Box sx={{ mb: 3 }}>
          <Typography level='body-sm' sx={{ color: '#000000' }}>
            INVOICE NUMBER: {invoice.invoiceNumber}
          </Typography>
          <Typography level='body-sm' sx={{ color: '#000000' }}>
            OPERATOR: {invoice.operatorName}
          </Typography>
          <Typography level='body-sm' sx={{ color: '#000000' }}>
            STATUS: {invoice.status.toUpperCase()}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: '#000000', mb: 2 }} />

        {/* Thank You Message */}
        {receiptConfig.footer.split('\n').map((line, index) => (
          <Typography
            key={index}
            level='body-sm'
            sx={{
              textAlign: 'center',
              fontWeight: index === 0 ? 'bold' : 'normal',
              fontStyle: index === 0 ? 'normal' : 'italic',
              mb: index === 0 ? 2 : 0,
              color: '#000000'
            }}
          >
            {line}
          </Typography>
        ))}
      </Box>

      {/* Footer Info */}
      <Card sx={{ mt: 2, maxWidth: '600px', width: '100%', p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
          <Typography level='body-xs' sx={{ color: '#ffffff' }}>
            Created on {formatDate(invoice.created_at)}
            {invoice.updated_at && ` • Updated on ${formatDate(invoice.updated_at)}`}
          </Typography>
          {invoice.appointmentId && (
            <Button
              variant='outlined'
              size='sm'
              startDecorator={<MedicalServices />}
              onClick={() => navigate(`/appointments/${invoice.appointmentId}`)}
              sx={{
                borderRadius: 'sm',
                fontSize: '0.6rem'
              }}
            >
              View Appointment
            </Button>
          )}
        </Box>
      </Card>

      {/* Delete Confirmation Modal */}
      <AnimatedModal open={deleteModalOpen} onClose={cancelDeleteInvoice} size="sm">
        <Stack spacing={3} sx={{ p: 4 }}>
          <Typography level="h4" textAlign="center">
            Confirm Deletion
          </Typography>
          <Typography textAlign="center">
            Are you sure you want to delete this invoice? This action cannot be undone.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={cancelDeleteInvoice}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="danger"
              onClick={confirmDeleteInvoice}
              disabled={isUpdating}
              loading={isUpdating}
            >
              Delete Invoice
            </Button>
          </Stack>
        </Stack>
      </AnimatedModal>
    </Box>
  );
};

export default InvoiceDetails;
