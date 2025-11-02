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
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import Textarea from '@mui/joy/Textarea';
import Alert from '@mui/joy/Alert';
import ShareIcon from '@mui/icons-material/Share';
import { Invoice } from '../types';
import { Patient } from '../types';
import { DataService } from '../services/DataService';

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
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [invoiceTextForShare, setInvoiceTextForShare] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>({
    header: defaultHeader,
    footer: defaultFooter
  });

  const loadInvoice = useCallback(async (invoiceId: number) => {
    try {
      console.log('🧾 Loading invoice details using DataService...');
      const invoices: Invoice[] = await DataService.getData('invoices');
      console.log(`📊 Retrieved ${invoices.length} invoices from DataService`);

      const foundInvoice = invoices.find(inv => inv.id === invoiceId);

      if (foundInvoice) {
        console.log(`✅ Found invoice ${invoiceId}:`, foundInvoice.invoiceNumber);
        setInvoice(foundInvoice);
        // Load the patient data
        await loadPatient(foundInvoice.patientId);
      } else {
        console.warn(`⚠️ Invoice ${invoiceId} not found in ${invoices.length} invoices`);
        setError('Invoice not found');
      }
    } catch (error) {
      console.error('❌ Failed to load invoice:', error);
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
      console.log(`👤 Loading patient ${patientId} using DataService...`);
      const patients: Patient[] = await DataService.getPatients();
      console.log(`📊 Retrieved ${patients.length} patients from DataService`);

      const foundPatient = patients.find(p => p.id === patientId);
      if (foundPatient) {
        console.log(`✅ Found patient ${patientId}:`, foundPatient.name);
      } else {
        console.warn(`⚠️ Patient ${patientId} not found`);
      }
      setPatient(foundPatient || null);
    } catch (error) {
      console.error('❌ Error loading patient:', error);
    }
  };

  const loadReceiptConfig = async () => {
    try {
      const receiptConfigs = await DataService.getData('receipt_config');
      if (receiptConfigs && receiptConfigs.length > 0) {
        const config: ReceiptConfig = receiptConfigs[0];
        setReceiptConfig(config);
      }
    } catch (error) {
      console.error('Error loading receipt config:', error);
    }
  };

  const updateInvoiceStatus = async (newStatus: 'paid' | 'unpaid' | 'void' | 'pending') => {
    if (!invoice) return;

    setIsUpdating(true);
    try {
      console.log(`🔄 Updating invoice ${invoice.id} status to ${newStatus}`);
      const invoices: Invoice[] = await DataService.getData('invoices');
      const updatedInvoices = invoices.map(inv =>
        inv.id === invoice.id
          ? { ...inv, status: newStatus, updated_at: new Date().toISOString() }
          : inv
      );
      await DataService.saveData('invoices', updatedInvoices);
      setInvoice({ ...invoice, status: newStatus, updated_at: new Date().toISOString() });
      console.log(`✅ Invoice ${invoice.id} status updated to ${newStatus}`);
    } catch (error) {
      console.error('❌ Error updating invoice status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  const generateInvoiceText = () => {
    if (!invoice || !patient) return '';

    const treatmentsText = invoice.treatments.map(treatment => {
      let text = `- ${treatment.name.toUpperCase()}`;
      if (treatment.price) {
        text += ` - ${formatCurrency(treatment.price).replace('Rp', 'RP')}`;
      }
      if (treatment.notes && treatment.notes.trim()) {
        text += `\n  Notes: ${treatment.notes}`;
      }
      return text;
    }).join('\n');

    return `${receiptConfig.header}

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
TOTAL: RP ${formatCurrency(invoice.totalAmount).replace('Rp', '').replace(/\s/g, '')}

INVOICE NUMBER: ${invoice.invoiceNumber}
OPERATOR: ${invoice.operatorName}
STATUS: ${invoice.status.toUpperCase()}

${'═'.repeat(50)}

${receiptConfig.footer}`;
  };

  const handleCopyToClipboard = async () => {
    if (!invoiceTextForShare) return;

    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(invoiceTextForShare);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
        return;
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }

    // Fallback to execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = invoiceTextForShare;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error using execCommand copy:', error);
    }
  };

  const handlePrint = async () => {
    if (!invoice || !patient) {
      return;
    }

    // Store original body content
    const originalContent = document.body.innerHTML;

    const headerLines = receiptConfig.header.split('\n');
    const footerLines = receiptConfig.footer.split('\n');

    const printContent = `${headerLines.map(line => `<div style="text-align: center;">${line}</div>`).join('\n')}
<div style="text-align: center;">TREATMENT RECEIPT</div>
_____________________________________________________________
DATE: ${formatDateForPrint(invoice.date)}
RECORD NUMBER: ${patient?.record_number || 'N/A'}
Patient Name: ${invoice.patientName}
<span style="font-size: 10px;">Address: ${patient.address || 'No address recorded'}</span>
_____________________________________________________________
TREATMENTS:
${invoice.treatments.map(treatment => {
  let treatmentText = `${treatment.name.toUpperCase()}`;
  if (treatment.price) {
    treatmentText += ` - ${formatCurrency(treatment.price).replace('Rp', 'RP')}`;
  }
  if (treatment.notes && treatment.notes.trim()) {
    treatmentText += `\n<span style="font-size: 10px;">notes: ${treatment.notes}</span>`;
  }
  return treatmentText;
}).join('\n')}
_____________________________________________________________
<span style="font-size: 14px; font-weight: bold;">TOTAL RP ${formatCurrency(invoice.totalAmount).replace('Rp', '').replace(/\s/g, '')}</span>

INVOICE NUMBER: ${invoice.invoiceNumber}
OPERATOR: ${invoice.operatorName}
STATUS: ${invoice.status.toUpperCase() === 'PAID' ? 'PAID' : invoice.status.toUpperCase()}

${footerLines.map(line => `<div style="text-align: center; font-size: 10px;">${line}</div>`).join('\n')}`;

    // Replace body content with print content
    document.body.innerHTML = `<div style="font-family: monospace; font-size: 12px; line-height: 1.0; color: black; background: white; margin: 0; padding: 0; white-space: pre; letter-spacing: 1px; word-wrap: break-word; overflow-wrap: break-word;">${printContent}</div>`;

    // Add print styles to head
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @media print {
        @page {
          margin: 0.05in 0.2in 0 0;
          size: 10in 11in;
        }
        html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: block;
        }
        body {
          margin: 0;
          padding: 0;
          width: 10in;
          height: 11in;
          text-align: left;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // Check if window.print() is available
    if (typeof window.print === 'function') {
      // Trigger system print dialog
      window.print();

      // Restore original content after print
      const restoreContent = () => {
        document.body.innerHTML = originalContent;
        if (document.head.contains(styleElement)) {
          document.head.removeChild(styleElement);
        }
      };

      // Listen for print completion
      const mediaQueryList = window.matchMedia('print');
      const handlePrintEnd = (mql: MediaQueryListEvent) => {
        if (!mql.matches) {
          restoreContent();
          mediaQueryList.removeListener(handlePrintEnd);
          // Navigate back to invoices list after print is completed
          navigate('/invoices');
        }
      };
      mediaQueryList.addListener(handlePrintEnd);

      // Fallback: restore content and navigate back after 3 seconds
      setTimeout(() => {
        restoreContent();
        navigate('/invoices');
      }, 3000);
    } else {
      // window.print() not available - restore content immediately and show share dialog
      document.body.innerHTML = originalContent;
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }

      // Show share dialog as fallback
      const invoiceText = generateInvoiceText();
      if (invoiceText) {
        setInvoiceTextForShare(invoiceText);
        setShowShareDialog(true);
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
                  {formatCurrency(treatment.price).replace('Rp', 'RP')}
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
              {formatCurrency(invoice.totalAmount).replace('Rp', 'RP')}
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

      {/* Invoice Status Control */}
      <Card sx={{ mt: 2, maxWidth: '600px', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
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
          </Box>
        </Box>
      </Card>

      {/* Footer Info */}
      <Card sx={{ mt: 2, maxWidth: '600px', width: '100%' }}>
        <Typography level="body-xs" sx={{ textAlign: 'center', color: '#ffffff' }}>
          Created on {formatDate(invoice.created_at)}
          {invoice.updated_at && ` • Updated on ${formatDate(invoice.updated_at)}`}
        </Typography>
      </Card>

      {/* Share Invoice Dialog for Android */}
      <Modal 
        open={showShareDialog} 
        onClose={() => { 
          setShowShareDialog(false); 
          setCopySuccess(false); 
        }}
      >
        <ModalDialog sx={{ maxWidth: '90vw', width: '500px', zIndex: 9999 }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon /> Share Invoice
          </Typography>
          {copySuccess && (
            <Alert color="success" sx={{ mb: 2 }}>
              Invoice text copied to clipboard!
            </Alert>
          )}
          <Typography level="body-sm" sx={{ mb: 2, color: '#ffffff' }}>
            Use the buttons below to share or copy the invoice:
          </Typography>
          <Textarea
            value={invoiceTextForShare}
            readOnly
            minRows={15}
            maxRows={20}
            sx={{
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              backgroundColor: '#1e1e1e',
              color: '#ffffff',
              '& textarea': {
                color: '#ffffff',
              },
            }}
            onFocus={(e) => {
              e.target.select();
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
              <Button
                variant="solid"
                startDecorator={<ShareIcon />}
                onClick={async () => {
                  if (navigator.share && typeof navigator.share === 'function') {
                    try {
                      await navigator.share({
                        title: `Invoice ${invoice?.invoiceNumber}`,
                        text: invoiceTextForShare,
                      });
                      setShowShareDialog(false);
                    } catch (error: unknown) {
                      if (error instanceof Error && error.name !== 'AbortError') {
                        console.error('Error sharing:', error);
                      }
                    }
                  } else {
                    // Try clipboard as fallback
                    await handleCopyToClipboard();
                  }
                }}
                sx={{ flex: 1 }}
              >
                Share
              </Button>
              <Button
                variant="soft"
                onClick={handleCopyToClipboard}
                sx={{ flex: 1 }}
              >
                Copy Text
              </Button>
            </Stack>
            <Button variant="outlined" onClick={() => { setShowShareDialog(false); setCopySuccess(false); }}>
              Close
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default InvoiceDetails;