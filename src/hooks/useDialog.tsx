import { useState, useCallback, useRef } from 'react';

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const configRef = useRef({
    onConfirm: () => {
      // Default no-op action
    }
  });

  const [config, setConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {
      // Default no-op action
    },
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger' as 'danger' | 'warning' | 'info'
  });

  const openDialog = useCallback((options: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
  }) => {
    setConfig({
      title: options.title,
      message: options.message,
      onConfirm: options.onConfirm,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'danger'
    });
    configRef.current = {
      onConfirm: options.onConfirm
    };
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    configRef.current.onConfirm();
    closeDialog();
  }, [closeDialog]);

  return {
    isOpen,
    config,
    openDialog,
    closeDialog,
    handleConfirm
  };
};

export const useAlertDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    buttonText: 'OK',
    variant: 'info' as 'success' | 'warning' | 'danger' | 'info'
  });

  const openDialog = useCallback((options: {
    title: string;
    message: string;
    buttonText?: string;
    variant?: 'success' | 'warning' | 'danger' | 'info';
  }) => {
    setConfig({
      title: options.title,
      message: options.message,
      buttonText: options.buttonText || 'OK',
      variant: options.variant || 'info'
    });
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    config,
    openDialog,
    closeDialog
  };
};

export const usePromptDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const configRef = useRef({
    onConfirm: (_value: string) => {
      // Default no-op action
    }
  });

  const [config, setConfig] = useState({
    title: '',
    message: '',
    defaultValue: '',
    placeholder: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: (_value: string) => {
      // Default no-op action
    }
  });

  const openDialog = useCallback((options: {
    title: string;
    message: string;
    defaultValue?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string) => void;
  }) => {
    setConfig({
      title: options.title,
      message: options.message,
      defaultValue: options.defaultValue || '',
      placeholder: options.placeholder || '',
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm
    });
    configRef.current = {
      onConfirm: options.onConfirm
    };
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback((value: string | null) => {
    if (value !== null) {
      configRef.current.onConfirm(value);
    }
    closeDialog();
  }, [closeDialog]);

  return {
    isOpen,
    config,
    openDialog,
    closeDialog,
    handleConfirm
  };
};
