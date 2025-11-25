import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalDialog,
  Typography,
  Box,
  Button,
  Stack,
  Input
} from '@mui/joy';

interface PromptDialogProps {
  open: boolean;
  onClose: (value: string | null) => void;
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
  title,
  message,
  defaultValue = '',
  placeholder = '',
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setInputValue(defaultValue);
    }
  }, [open, defaultValue]);

  const handleConfirm = () => {
    onClose(inputValue);
  };

  const handleCancel = () => {
    onClose(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleConfirm();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Modal open={open} onClose={handleCancel}>
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
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            fullWidth
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
              onClick={handleCancel}
            >
              {cancelText}
            </Button>
            <Button
              variant="solid"
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
