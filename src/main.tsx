import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import './index.css';
import App from './App.tsx';

// Create an Emotion cache with the `prepend` option
const cache = createCache({
  key: 'mui',
  prepend: true
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  },
  components: {
    // Fix CircularProgress issues
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          // Ensure proper rendering
          animation: 'mui-rotate 1.4s linear infinite'
        }
      }
    }
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
createRoot(rootElement).render(
  <StrictMode>
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </CacheProvider>
  </StrictMode>
);
