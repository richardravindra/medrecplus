import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/joy';
import { CheckCircle, Warning, Error } from '@mui/icons-material';
import { ToastMessage, ToastContext } from '../contexts/ToastContext';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastMessage['type'], message: string, duration: number = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastMessage = { id, type, message, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {toasts.map((toast) => {
          const getColors = (type: ToastMessage['type']) => {
            switch (type) {
              case 'success':
                return {
                  bg: 'rgba(34, 197, 94, 0.1)',
                  border: 'rgba(34, 197, 94, 0.3)',
                  text: '#22c55e',
                  icon: <CheckCircle sx={{ color: '#22c55e' }} />
                };
              case 'warning':
                return {
                  bg: 'rgba(245, 158, 11, 0.1)',
                  border: 'rgba(245, 158, 11, 0.3)',
                  text: '#f59e0b',
                  icon: <Warning sx={{ color: '#f59e0b' }} />
                };
              case 'error':
                return {
                  bg: 'rgba(239, 68, 68, 0.1)',
                  border: 'rgba(239, 68, 68, 0.3)',
                  text: '#ef4444',
                  icon: <Error sx={{ color: '#ef4444' }} />
                };
              default:
                return {
                  bg: 'rgba(59, 130, 246, 0.1)',
                  border: 'rgba(59, 130, 246, 0.3)',
                  text: '#3b82f6',
                  icon: null
                };
            }
          };

          const colors = getColors(toast.type);

          return (
            <Box
              key={toast.id}
              sx={{
                minWidth: 300,
                p: 2,
                mb: 1,
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 'md',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                animation: 'slideInRight 0.3s ease-out',
                '@keyframes slideInRight': {
                  from: {
                    transform: 'translateX(100%)',
                    opacity: 0
                  },
                  to: {
                    transform: 'translateX(0)',
                    opacity: 1
                  }
                }
              }}
            >
              {colors.icon}
              <Typography
                sx={{
                  color: colors.text,
                  fontSize: 'sm',
                  fontWeight: 'md'
                }}
              >
                {toast.message}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </ToastContext.Provider>
  );
};
