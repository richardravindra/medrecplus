import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Textarea from '@mui/joy/Textarea';
import FormLabel from '@mui/joy/FormLabel';
import FormControl from '@mui/joy/FormControl';
import Alert from '@mui/joy/Alert';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import Receipt from '@mui/icons-material/Receipt';
import Stack from '@mui/joy/Stack';
import Divider from '@mui/joy/Divider';
import { storage } from '../../services/UnifiedStorage';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useDialog';

interface ReceiptConfig {
  header: string;
  footer: string;
}

const defaultHeader = `BSP CENTER PHYSIOTHERAPY CLINIC
Ruko Rose Garden 7 No.11, JakaSetia, Bekasi Selatan 17148`;

const defaultFooter = `Thank you for your visit!
Semoga kesehatan selalu menyertai anda`;

const ReceiptSettings: React.FC = () => {
  const navigate = useNavigate();
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>({
    header: defaultHeader,
    footer: defaultFooter
  });
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Dialog hook
  const confirmDialog = useConfirmDialog();

  useEffect(() => {
    loadReceiptConfig();
  }, []);

  const loadReceiptConfig = async () => {
    try {
      const storedConfig = await storage.getReceiptConfig();
      if (storedConfig && Object.keys(storedConfig).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setReceiptConfig(storedConfig as any);
      }
    } catch { // Error handled silently
    }
  };

  const handleInputChange =
    (field: 'header' | 'footer') => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setReceiptConfig(prev => ({
        ...prev,
        [field]: event.target.value
      }));
      // Clear messages when user starts typing
      setError(null);
      setSuccess(false);
    };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate that both fields are not empty
      if (!receiptConfig.header.trim()) {
        setError('Header cannot be empty');
        setLoading(false);
        return;
      }

      if (!receiptConfig.footer.trim()) {
        setError('Footer cannot be empty');
        setLoading(false);
        return;
      }

      // Save to UnifiedStorage
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await storage.storeReceiptConfig(receiptConfig as any);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    confirmDialog.openDialog({
      title: 'Reset to Default',
      message: 'Are you sure you want to reset to default values?',
      onConfirm: () => {
        setReceiptConfig({
          header: defaultHeader,
          footer: defaultFooter
        });
        setError(null);
        setSuccess(false);
      }
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100%',
        p: { xs: 1, md: 2 },
        pt: { xs: 0, md: 2 },
        pr: { xs: 2, md: 2 },
        boxSizing: 'border-box',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant='outlined'
          startDecorator={<ArrowBack />}
          onClick={() => navigate('/settings')}
          sx={{ borderRadius: 'sm' }}
        >
          Back to Settings
        </Button>
        <Receipt sx={{ fontSize: 32 }} />
        <Typography level='h2'>Print Receipt Setup</Typography>
      </Box>

      {_error && (
        <Alert color='danger' sx={{ mb: 3 }}>
          {_error}
        </Alert>
      )}

      {success && (
        <Alert color='success' sx={{ mb: 3 }}>
          Configuration saved successfully!
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Header Configuration */}
        <Card>
          <Box sx={{ mb: 3 }}>
            <Typography level='h4' sx={{ mb: 1 }}>
              Receipt Header
            </Typography>
            <Typography level='body-sm' sx={{ color: '#ffffff' }}>
              Configure the header text that appears at the top of printed receipts.
            </Typography>
          </Box>

          <FormControl>
            <FormLabel>Header Content</FormLabel>
            <Textarea
              value={receiptConfig.header}
              onChange={handleInputChange('header')}
              placeholder='Enter receipt header text...'
              minRows={3}
              maxRows={6}
              sx={{
                '& textarea': {
                  color: '#ffffff !important',
                  '&::placeholder': {
                    color: '#ffffff !important',
                    opacity: 0.7
                  }
                }
              }}
            />
            <Typography level='body-xs' sx={{ mt: 1, color: '#ffffff', opacity: 0.7 }}>
              This text appears at the top of printed receipts. You can use multiple lines.
            </Typography>
          </FormControl>
        </Card>

        {/* Footer Configuration */}
        <Card>
          <Box sx={{ mb: 3 }}>
            <Typography level='h4' sx={{ mb: 1 }}>
              Receipt Footer
            </Typography>
            <Typography level='body-sm' sx={{ color: '#ffffff' }}>
              Configure the footer text that appears at the bottom of printed receipts.
            </Typography>
          </Box>

          <FormControl>
            <FormLabel>Footer Content</FormLabel>
            <Textarea
              value={receiptConfig.footer}
              onChange={handleInputChange('footer')}
              placeholder='Enter receipt footer text...'
              minRows={3}
              maxRows={6}
              sx={{
                '& textarea': {
                  color: '#ffffff !important',
                  '&::placeholder': {
                    color: '#ffffff !important',
                    opacity: 0.7
                  }
                }
              }}
            />
            <Typography level='body-xs' sx={{ mt: 1, color: '#ffffff', opacity: 0.7 }}>
              This text appears at the bottom of printed receipts. You can use multiple lines.
            </Typography>
          </FormControl>
        </Card>

        {/* Preview */}
        <Card>
          <Box sx={{ mb: 3 }}>
            <Typography level='h4' sx={{ mb: 1 }}>
              Preview
            </Typography>
            <Typography level='body-sm' sx={{ color: '#ffffff' }}>
              See how your receipt will look when printed.
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: '#ffffff',
              color: '#000000',
              p: 3,
              borderRadius: 'sm',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: 1.6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Typography
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                mb: 2,
                color: '#000000',
                whiteSpace: 'pre-line'
              }}
            >
              {receiptConfig.header}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Divider sx={{ borderColor: '#000000' }} />
            </Box>

            <Typography sx={{ mb: 2, color: '#000000' }}>TREATMENT RECEIPT</Typography>

            <Typography sx={{ mb: 1, color: '#000000' }}>
              DATE: {new Date().toLocaleDateString()}
            </Typography>
            <Typography sx={{ mb: 1, color: '#000000' }}>Patient Name: John Doe</Typography>
            <Typography sx={{ mb: 2, color: '#000000' }}>Address: Sample Address</Typography>

            <Box sx={{ mb: 2 }}>
              <Divider sx={{ borderColor: '#000000' }} />
            </Box>

            <Typography sx={{ fontWeight: 'bold', mb: 1, color: '#000000' }}>
              TREATMENTS:
            </Typography>
            <Typography sx={{ mb: 1, color: '#000000' }}>SAMPLE TREATMENT - RP 150,000</Typography>

            <Box sx={{ mb: 2 }}>
              <Divider sx={{ borderColor: '#000000' }} />
            </Box>

            <Typography
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                mb: 2,
                color: '#000000',
                whiteSpace: 'pre-line'
              }}
            >
              {receiptConfig.footer}
            </Typography>
          </Box>
        </Card>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            pt: 2
          }}
        >
          <Button
            variant='outlined'
            color='neutral'
            onClick={handleReset}
            disabled={loading}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Reset to Default
          </Button>
          <Button
            variant='solid'
            color='primary'
            startDecorator={<Save />}
            onClick={handleSave}
            loading={loading}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Save Configuration
          </Button>
        </Box>
      </Stack>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.isOpen}
        onClose={confirmDialog.closeDialog}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.config.title}
        message={confirmDialog.config.message}
        confirmText={confirmDialog.config.confirmText}
        cancelText={confirmDialog.config.cancelText}
        variant={confirmDialog.config.variant}
      />
    </Box>
  );
};

export default ReceiptSettings;
