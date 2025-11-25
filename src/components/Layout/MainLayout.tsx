import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Sidebar from './Sidebar';
import { useSidebar } from '../../hooks/useSidebar';

const MainLayout: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-collapse on smaller screens
  // For desktop (>= 900px): respect the isCollapsed state from context
  // For mobile (< 900px): always collapse
  const isMobileView = windowWidth < 900;
  const shouldCollapse = isMobileView || isCollapsed;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        flexDirection: isMobileView ? 'column' : 'row',
        margin: 0,
        padding: 0
      }}
    >
      {!isMobileView && <Sidebar />}
      <Box
        component='main'
        sx={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          minHeight: '100vh',
          backgroundColor: 'background.level1',
          p: 0,
          m: 0,
          pt: isMobileView ? '35px' : 0, // Safe space for Android status bar
          ml: isMobileView ? 0 : shouldCollapse ? '60px' : '200px', // Reserve space for sidebar
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          paddingBottom: isMobileView ? '85px' : 0 // Space for mobile navbar
        }}
      >
        <Box
          sx={{
            flex: 1,
            width: '100%',
            minHeight: 0,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            margin: 0,
            padding: 0,
            paddingRight: isMobileView ? '16px' : 0,
            boxSizing: 'border-box'
          }}
        >
          <Outlet />
        </Box>
      </Box>
      {isMobileView && <Sidebar />}
    </Box>
  );
};

export default MainLayout;
