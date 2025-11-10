import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import Menu from '@mui/icons-material/Menu';
import Dashboard from '@mui/icons-material/Dashboard';
import People from '@mui/icons-material/People';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Receipt from '@mui/icons-material/Receipt';
import Assessment from '@mui/icons-material/Assessment';
import Settings from '@mui/icons-material/Settings';
import { useSidebar } from '../../hooks/useSidebar';
import '../../styles/animations.css';

const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Activate staggered animations
  useEffect(() => {
    const staggerItems = document.querySelectorAll('.stagger-item');
    staggerItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('active');
      }, index * 50);
    });
  }, [location.pathname]);

  // Auto-collapse on smaller screens
  const shouldCollapse = windowWidth < 900 || isCollapsed;
  const isMobileView = windowWidth < 900; // Show navbar for screens smaller than 900px

  const navItems = [
    { icon: Dashboard, label: 'Dashboard', path: '/' },
    { icon: People, label: 'Patients', path: '/patients' },
    { icon: CalendarMonth, label: 'Appointments', path: '/appointments' },
    { icon: Receipt, label: 'Invoices', path: '/invoices' },
  ];

  const bottomNavItems = [
    { icon: Assessment, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const NavButton: React.FC<{ icon: React.ElementType; label: string; path: string; isMobile?: boolean }> = ({
    icon: Icon,
    label,
    path,
    isMobile = false
  }) => {
    const isActive = location.pathname === path;

    return (
      <Box
        component="button"
        onClick={() => navigate(path)}
        className={`button-press ${isActive ? 'spring-in' : ''}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'center' : (shouldCollapse ? 'center' : 'flex-start'),
          flexDirection: isMobile ? 'column' : 'row',
          minWidth: '48px',
          minHeight: '48px',
          width: { xs: 'auto', md: '100%' },
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
          border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
          cursor: 'pointer',
          borderRadius: '8px',
          color: '#ffffff',
          px: { xs: 1, md: shouldCollapse ? 1 : 2 },
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            transform: 'translateX(4px)',
          },
          '&:active': {
            transform: 'translateX(2px) scale(0.98)',
          },
          // Only show gradient effect for active items
          ...(isActive && {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: -100,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
              transition: 'left 0.5s',
            },
            '&:hover::before': {
              left: '100%',
            }
          })
        }}
      >
        <Icon sx={{
          color: '#ffffff',
          fontSize: '24px',
          mb: isMobile ? 0.5 : 0,
          mr: isMobile ? 0 : (shouldCollapse ? 0 : 1),
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
        <Typography
          level="body-sm"
          sx={{
            display: { xs: 'none', md: shouldCollapse ? 'none' : 'block' },
            color: '#ffffff',
            fontSize: { xs: '10px', md: '14px' },
            fontWeight: isActive ? '600' : '400',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  };

  // Mobile Navbar (bottom)
  if (isMobileView) {
    return (
      <Sheet
        className="slide-in-up"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'background.surface',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          px: 1,
          pb: 2, // Safe area for Android nav bar
          zIndex: 9999,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {[...navItems, ...bottomNavItems].map((item, index) => (
          <Box
            key={item.path}
            className="stagger-item"
            sx={{
              '&.active': {
                animationDelay: `${index * 50}ms`,
              }
            }}
          >
            <NavButton
              icon={item.icon}
              label={item.label}
              path={item.path}
              isMobile={true}
            />
          </Box>
        ))}
      </Sheet>
    );
  }

  // Desktop Sidebar
  return (
    <Sheet
      className={`${shouldCollapse ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: shouldCollapse ? 'auto' : 'auto',
        minWidth: shouldCollapse ? '60px' : '200px',
        maxWidth: shouldCollapse ? '60px' : '300px',
        backgroundColor: 'background.surface',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
      }}
    >
      {/* Header with toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: shouldCollapse ? 'center' : 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: '60px',
        }}
      >
        <Typography
          level="h4"
          sx={{
            display: shouldCollapse ? 'none' : 'block',
            color: '#ffffff',
            fontWeight: 'bold',
          }}
        >
          MedRec
        </Typography>
        <IconButton
          onClick={toggleSidebar}
          variant="plain"
          className="button-press"
          sx={{
            color: '#ffffff',
            minWidth: '40px',
            minHeight: '40px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'rotate(180deg)',
            },
            '&:active': {
              transform: 'rotate(180deg) scale(0.95)',
            }
          }}
        >
          <Menu
            sx={{
              color: '#ffffff',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </IconButton>
      </Box>

      {/* Main Navigation */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 1,
        }}
      >
        {navItems.map((item) => (
          <NavButton
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
          />
        ))}
      </Box>

      {/* Bottom Navigation */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 1,
        }}
      >
        {bottomNavItems.map((item) => (
          <NavButton
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
          />
        ))}
      </Box>
    </Sheet>
  );
};

export default Sidebar;