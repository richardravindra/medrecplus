import React from 'react';
import { Box } from '@mui/joy';
import { SecurityService } from '../services/SecurityService';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error?: Error;
    errorInfo?: React.ErrorInfo;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to security service
    SecurityService.logSecurityEvent('react_error_boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with full error info
    this.setState({ error, errorInfo });
  }

  private handleResetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.handleResetError}
          />
        );
      }

      // Default fallback UI
      return (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              mb: 3,
              maxWidth: 600,
              p: 3,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'md'
            }}
          >
            <h4 style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>
              Something went wrong
            </h4>
            <p style={{ marginBottom: '1rem', textAlign: 'center' }}>
              We apologize for the inconvenience. The error has been logged and our team will
              investigate.
            </p>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
              You can try reloading the application or continue with limited functionality.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleResetError}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid #9ca3af',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.backgroundColor = '#9ca3af';
                  target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.backgroundColor = 'transparent';
                  target.style.color = '#9ca3af';
                }}
              >
                Reload Application
              </button>
            </div>
          </Box>

          {/* Error details in development */}
          {import.meta.env.DEV && this.state.error && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: 'grey.100',
                textAlign: 'left',
                borderRadius: 'sm',
                maxWidth: 800,
                width: '100%',
                overflow: 'auto'
              }}
            >
              <h5 style={{ marginBottom: '1rem', textAlign: 'center' }}>
                Error Details (Development Only):
              </h5>
              <pre
                style={{
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '4px',
                  textAlign: 'left'
                }}
              >
                {this.state.error.stack}
              </pre>
              {this.state.errorInfo?.componentStack && (
                <>
                  <h5 style={{ marginTop: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
                    Component Stack:
                  </h5>
                  <pre
                    style={{
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: '#f3f4f6',
                      padding: '1rem',
                      borderRadius: '4px',
                      textAlign: 'left'
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use error boundaries
// eslint-disable-next-line react-refresh/only-export-components
export const useErrorHandler = () => {
  const [_error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (_error) {
      SecurityService.logSecurityEvent('react_error_boundary', {
        error: _error.message,
        stack: _error.stack,
        errorBoundary: false,
        type: 'hook'
      });

      // You can also send this to an error reporting service

    }
  }, [_error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((_error: Error) => {
    setError(_error);
  }, []);

  return { _error, handleError, resetError };
};

// Specific error boundaries for different parts of the app
export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(_error, _errorInfo) => {

      // You could send this to an error reporting service here
    }}
  >
    {children}
  </ErrorBoundary>
);

export const PageErrorBoundary: React.FC<{ children: React.ReactNode; pageTitle?: string }> = ({
  children,
  pageTitle
}) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'md'
          }}
        >
          <h4 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>
            Error in {pageTitle || 'this page'}
          </h4>
          <p style={{ margin: '1rem 0 0 0' }}>
            An error occurred while loading this page. Please try refreshing the page.
          </p>
          {import.meta.env.DEV && error && (
            <pre
              style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                fontSize: '11px',
                overflow: 'auto',
                maxHeight: '150px'
              }}
            >
              {error.message}
            </pre>
          )}
          <div style={{ marginTop: '2rem' }}>
            <button
              onClick={resetError}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
            >
              Try Again
            </button>
          </div>
        </Box>
      </Box>
    )}
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ReactNode;
}> = ({ children, componentName, fallback }) => (
  <ErrorBoundary
    fallback={({ resetError }) => (
      <Box sx={{ p: 2, border: '1px solid #ef4444', borderRadius: 'sm', bgcolor: '#fef2f2' }}>
        <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>
          {componentName ? `Error in ${componentName}` : 'Component error'}
        </p>
        {fallback || (
          <button
            onClick={resetError}
            style={{
              marginTop: '1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
          >
            Retry
          </button>
        )}
      </Box>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Higher-order component for wrapping components in error boundaries
// eslint-disable-next-line react-refresh/only-export-components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    componentName?: string;
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  }
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      fallback={options?.fallback}
      onError={(_error, _errorInfo) => {
        // Error handled silently by default
      }}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
