import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import CircularProgress from '@mui/joy/CircularProgress';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Print from '@mui/icons-material/Print';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Divider from '@mui/joy/Divider';
import Delete from '@mui/icons-material/Delete';
import { Invoice } from '../types';
import { Patient } from '../types';
import SimpleDataService from '../services/SimpleDataService';
import { log } from '../utils/logger';
import { useCurrency, formatCurrencyForPrint } from '../utils/currencyUtils';
import { isTauriEnvironment, importTauriShell, createPrintFile, printInvoiceWithDataURL } from '../utils/tauriUtils';
import { storage } from '../services/UnifiedStorage';

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
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>({
    header: defaultHeader,
    footer: defaultFooter
  });

  const loadInvoice = useCallback(async (invoiceId: number) => {
    try {
      console.log('🧾 Loading invoice details using SimpleDataService...');
      const foundInvoice = await SimpleDataService.getInvoiceById(invoiceId);

      if (foundInvoice) {
        console.log(`✅ Found invoice ${invoiceId}:`, foundInvoice.invoiceNumber);
        setInvoice(foundInvoice);
        // Load the patient data
        await loadPatient(foundInvoice.patientId);
      } else {
        console.warn(`⚠️ Invoice ${invoiceId} not found`);
        setError('Invoice not found');
      }
    } catch (error) {
      log.error('Failed to load invoice', { error, invoiceId }, 'InvoiceDetails');
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        await loadInvoice(parseInt(id));
      }
      await loadReceiptConfig();
    };
    loadData();
  }, [id, loadInvoice]);

  const loadPatient = async (patientId: number) => {
    try {
      console.log(`👤 Loading patient ${patientId} using SimpleDataService...`);
      const foundPatient = await SimpleDataService.getPatientById(patientId);
      if (foundPatient) {
        console.log(`✅ Found patient ${patientId}:`, foundPatient.name);
      } else {
        console.warn(`⚠️ Patient ${patientId} not found`);
      }
      setPatient(foundPatient);
    } catch (error) {
      console.error('❌ Error loading patient:', error);
    }
  };

  const loadReceiptConfig = async () => {
    try {
      console.log('📄 Loading receipt config from UnifiedStorage...');
      const storedConfig = await storage.getReceiptConfig();
      if (storedConfig && Object.keys(storedConfig).length > 0) {
        setReceiptConfig(storedConfig as ReceiptConfig);
        console.log('✅ Loaded receipt config from UnifiedStorage:', storedConfig);
      } else {
        console.log('📄 No receipt config found, using defaults');
      }
    } catch (error) {
      console.error('Error loading receipt config:', error);
    }
  };

  const updateInvoiceStatus = async (newStatus: 'paid' | 'unpaid' | 'void') => {
    if (!invoice) return;

    setIsUpdating(true);
    try {
      console.log(`🔄 Updating invoice ${invoice.id} status to ${newStatus}`);
      const updatedInvoice = await SimpleDataService.updateInvoice(invoice.id, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      if (updatedInvoice) {
        setInvoice(updatedInvoice);
        console.log(`✅ Invoice ${invoice.id} status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('❌ Error updating invoice status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice) return;

    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        // Log invoice deletion
        log.info('Invoice deleted', {
          id: invoice.id,
          patientId: invoice.patientId,
          patientName: invoice.patientName,
          operatorName: invoice.operatorName
        }, 'InvoiceDetails');

        const success = await SimpleDataService.deleteInvoice(invoice.id);
        if (success) {
          console.log(`✅ Deleted invoice ${invoice.id}`);
          alert('Invoice deleted successfully.');
          navigate('/invoices');
        } else {
          alert('Invoice not found or already deleted.');
        }
      } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

  // Currency formatting now handled by the imported utility functions

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateForPrint = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${formattedDate} ${hours}:${minutes}`;
  };

  
  const handlePrint = async () => {
    if (!invoice || !patient) {
      return;
    }

    // Generate invoice text directly
    const treatmentsText = invoice.treatments.map(treatment => {
      let text = `- ${treatment.name.toUpperCase()}`;
      if (treatment.price) {
        text += ` - ${formatCurrencyForPrint(treatment.price, currency).replace(currency.symbol, currency.symbol.toUpperCase())}`;
      }
      if (treatment.notes && treatment.notes.trim()) {
        text += `\n  Notes: ${treatment.notes}`;
      }
      return text;
    }).join('\n');

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

    console.log('🖨️ Starting print process...');

    // Try Tauri native print first
    if (isTauriEnvironment()) {
      try {
        console.log('📱 Tauri environment detected, attempting native print...');

        // Create temporary HTML file
        const tempFilePath = await createPrintFile(invoiceText);
        console.log('📁 Created temporary print file:', tempFilePath);

        // Use shell to open the file with default application
        console.log('🔄 Importing Tauri shell module...');
        const shellModule = await importTauriShell();
        console.log('✅ Shell module imported:', typeof shellModule);

        const { open } = shellModule as { open: (path: string) => Promise<void> };
        console.log('🔄 Opening file with default application:', tempFilePath);
        await open(tempFilePath);

        console.log('✅ Native print dialog opened successfully');

        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/invoices');
        }, 1000);
        return;

      } catch (error) {
        console.error('❌ Tauri native print failed:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        console.log('🔄 Falling back to iframe method...');

        // Fallback to data URL method
        try {
          await printInvoiceWithDataURL(invoiceText);

          // Navigate back after a short delay
          setTimeout(() => {
            navigate('/invoices');
          }, 1000);
          return;
        } catch (fallbackError) {
          console.error('❌ Fallback print also failed:', fallbackError);
          alert(`Failed to print: ${fallbackError}. Please try again.`);
          return;
        }
      }
    } else {
      // Web environment - use data URL method
      console.log('🌐 Web environment detected, using data URL print...');
      try {
        await printInvoiceWithDataURL(invoiceText);

        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/invoices');
        }, 1000);
      } catch (error) {
        console.error('❌ Web print failed:', error);
        alert(`Failed to print: ${error}. Please try again.`);
      }
    }
  };

  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography level="body-lg">Loading invoice details...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startDecorator={<ArrowBack />}
            onClick={() => navigate('/invoices')}
            sx={{ borderRadius: 'sm' }}
          >
            Back to Invoices
          </Button>
        </Box>
        <Card>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography level="h4" color="danger" sx={{ mb: 2 }}>
              {error || 'Invoice not found'}
            </Typography>
            <Typography level="body-sm" color="neutral" sx={{ mb: 3 }}>
              The invoice you're looking for doesn't exist or has been removed.
            </Typography>
            <Button
              variant="solid"
              onClick={() => navigate('/invoices')}
            >
              Back to Invoices
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      p: 2,
      boxSizing: 'border-box',
      minWidth: 0,
      maxWidth: '600px',
      mx: 'auto'
    }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startDecorator={<ArrowBack />}
            onClick={() => navigate('/invoices')}
            sx={{ borderRadius: 'sm' }}
          >
            Back to Invoices
          </Button>
          <Typography level="h2" sx={{ fontSize: '24px', ml: 2 }}>Invoice Details</Typography>
        </Box>
        <Button
          variant="solid"
          color="primary"
          startDecorator={<Print />}
          onClick={(e) => {
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
          <Typography level="body-sm" sx={{ color: '#ffffff' }}>
            Invoice Status:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Select
              value={invoice.status}
              onChange={(_, newValue) => {
                if (newValue && (newValue === 'paid' || newValue === 'unpaid' || newValue === 'void')) {
                  updateInvoiceStatus(newValue);
                }
              }}
              disabled={isUpdating}
              sx={{
                minWidth: 120,
                color: '#ffffff',
                py: 0.75, // 6px top and bottom padding
                '& .MuiSelect-select': {
                  color: '#ffffff !important'
                }
              }}
            >
              <Option value="unpaid" sx={{ color: '#ffffff' }}>Unpaid</Option>
              <Option value="paid" sx={{ color: '#ffffff' }}>Paid</Option>
              <Option value="void" sx={{ color: '#ffffff' }}>Void</Option>
            </Select>
            {isUpdating && (
              <Typography level="body-sm" color="primary">Updating...</Typography>
            )}
            <Button
              variant="solid"
              color="danger"
              startDecorator={<Delete />}
              onClick={handleDeleteInvoice}
              sx={{
                borderRadius: 'sm',
                backgroundColor: '#dc2626',
                '&:hover': {
                  backgroundColor: '#b91c1c',
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
              level={index === 0 ? "h3" : "body-sm"}
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
        <Typography level="h4" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 3, color: '#000000' }}>
          TREATMENT RECEIPT
        </Typography>

        {/* Patient Information */}
        <Box sx={{ mb: 3 }}>
          <Typography level="body-sm" sx={{ color: '#000000' }}>
            DATE: {formatDate(invoice.date)}
          </Typography>
          <Typography level="body-sm" sx={{ color: '#000000' }}>
            RECORD NUMBER: {patient?.record_number || 'N/A'}
          </Typography>
          <Typography level="body-sm" sx={{ color: '#000000' }}>
            Patient Name: {invoice.patientName}
          </Typography>
          <Typography level="body-sm" sx={{ color: '#000000' }}>
            Address: {patient?.address || 'No address recorded'}
          </Typography>
        </Box>

        
        {/* Treatments Section */}
        <Box sx={{ mb: 2 }}>
          <Typography level="body-sm" sx={{ fontWeight: 'bold', color: '#000000' }}>
            TREATMENTS:
          </Typography>
        </Box>

        {/* Treatments with Prices */}
        <Box sx={{ mb: 3 }}>
          {invoice.treatments.map((treatment) => (
            <Box key={treatment.id}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography level="body-sm" sx={{ color: '#000000' }}>
                  {treatment.name.toUpperCase()}
                </Typography>
                <Typography level="body-sm" sx={{ color: '#000000' }}>
                  {formatCurrencyForPrint(treatment.price, currency)}
                </Typography>
              </Box>
              {treatment.notes && (
                <Typography level="body-xs" sx={{ color: '#000000', fontStyle: 'italic', ml: 2, mb: 1 }}>
                  Notes: {treatment.notes}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Total */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography level="body-sm" sx={{ fontWeight: 'bold', color: '#000000' }}>TOTAL</Typography>
            <Typography level="body-sm" sx={{ fontWeight: 'bold', color: '#000000' }}>
              {formatCurrencyForPrint(invoice.totalAmount, currency)}
            </Typography>
          </Box>
        </Box>

        {/* Additional Invoice Info */}
        <Box sx={{ mb: 3 }}>
          <Typography level="body-sm" sx={{ color: '#000000' }}>
            INVOICE NUMBER: {invoice.invoiceNumber}
          </Typography>
          <Typography level="body-sm" sx={{ color: '#000000' }}>
            OPERATOR: {invoice.operatorName}
          </Typography>
          <Typography level="body-sm" sx={{ color: '#000000' }}>
            STATUS: {invoice.status.toUpperCase()}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: '#000000', mb: 2 }} />

        {/* Thank You Message */}
        {receiptConfig.footer.split('\n').map((line, index) => (
          <Typography
            key={index}
            level="body-sm"
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
      <Card sx={{ mt: 2, maxWidth: '600px', width: '100%' }}>
        <Typography level="body-xs" sx={{ textAlign: 'center', color: '#ffffff' }}>
          Created on {formatDate(invoice.created_at)}
          {invoice.updated_at && ` • Updated on ${formatDate(invoice.updated_at)}`}
        </Typography>
      </Card>

      </Box>
  );
};

export default InvoiceDetails;