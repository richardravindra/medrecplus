import React, { useState } from 'react';
import {
  Modal,
  ModalDialog,
  Typography,
  Box,
  Button,
  Stack,
  Input
} from '@mui/joy';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal open={open} onClose={!loading ? onClose : undefined}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 400,
          borderRadius: 'md',
          p: 0,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography level="h4" component="h2" sx={{ mb: 2 }}>
            {title}
          </Typography>
          <Typography level="body-sm" sx={{ mb: 3 }}>
            {message}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            pt: 0,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              variant="solid"
              color={variant === 'danger' ? 'danger' :
                     variant === 'warning' ? 'warning' : 'primary'}
              onClick={handleConfirm}
              disabled={loading}
              loading={loading}
            >
              {confirmText}
            </Button>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
};

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onClose,
  title,
  message,
  buttonText = 'OK',
  variant = 'info'
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 400,
          borderRadius: 'md',
          p: 0,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography level="h4" component="h2" sx={{ mb: 2 }}>
            {title}
          </Typography>
          <Typography level="body-sm" sx={{ mb: 3 }}>
            {message}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            pt: 0,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="solid"
              color={variant === 'success' ? 'success' :
                     variant === 'warning' ? 'warning' :
                     variant === 'danger' ? 'danger' : 'primary'}
              onClick={onClose}
            >
              {buttonText}
            </Button>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
};

interface PromptDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  defaultValue = '',
  placeholder = '',
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  const [value, setValue] = useState(defaultValue);

  const handleConfirm = () => {
    onConfirm(value);
  };

  const handleClose = () => {
    setValue(defaultValue);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 400,
          borderRadius: 'md',
          p: 0,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography level="h4" component="h2" sx={{ mb: 2 }}>
            {title}
          </Typography>
          <Typography level="body-sm" sx={{ mb: 2 }}>
            {message}
          </Typography>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirm();
              }
            }}
          />
        </Box>

        <Box
          sx={{
            p: 2,
            pt: 0,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={handleClose}
            >
              {cancelText}
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
};
