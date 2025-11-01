import React from 'react';
import { NavLink } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import Menu from '@mui/icons-material/Menu';
import People from '@mui/icons-material/People';
import Dashboard from '@mui/icons-material/Dashboard';
import Settings from '@mui/icons-material/Settings';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Receipt from '@mui/icons-material/Receipt';
import Assessment from '@mui/icons-material/Assessment';
import { useSidebar } from '../../hooks/useSidebar';

const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar();

  const NavContent: React.FC = () => (
    <>
      {/* Header - Hidden on mobile */}
      {!isMobile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            mb: 2,
            flexShrink: 0,
          }}
        >
          <Typography
            level="h4"
            sx={{
              display: isCollapsed ? 'none' : 'block',
              color: '#ffffff',
              fontWeight: 'bold',
            }}
          >
            MedRec
          </Typography>
          <IconButton 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSidebar();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            variant="plain" 
            sx={{ 
              color: '#ffffff',
              minWidth: '48px',
              minHeight: '48px',
              cursor: 'pointer',
              zIndex: 101,
              pointerEvents: 'auto',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:active': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            <Menu sx={{ color: '#ffffff', pointerEvents: 'none' }} />
          </IconButton>
        </Box>
      )}

      {/* Main Navigation - Combined with Bottom Navigation on mobile */}
      <Box sx={{ 
        flex: { xs: 1, md: 1 }, 
        overflow: 'auto', 
        px: 0, 
        py: 0,
        display: 'flex',
        flexDirection: { xs: 'row', md: 'column' },
        width: { xs: '100%', md: 'auto' },
        alignItems: { xs: 'center', md: 'stretch' },
        justifyContent: { xs: 'space-around', md: 'flex-start' },
      }}>
        <List
          sx={{
            '--ListItem-radius': '8px',
            '--ListItem-minHeight': { xs: '48px', md: '48px' },
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            width: { xs: '100%', md: 'auto' },
            gap: { xs: 0, md: 0 },
            px: { xs: 0, md: 0 },
            py: 0,
            justifyContent: { xs: 'space-around', md: 'flex-start' },
          }}
        >
          <ListItem sx={{ width: { xs: 'auto', md: '100%' }, flexShrink: 0 }}>
            <ListItemButton
              component={NavLink}
              to="/"
              sx={(theme) => ({
                color: '#ffffff',
                justifyContent: 'center',
                px: { xs: 1, md: (isCollapsed ? 1 : 2) },
                minWidth: { xs: '48px', md: 'auto' },
                minHeight: { xs: '48px', md: 'auto' },
                '&.active': {
                  backgroundColor: theme.vars.palette.primary.solidBg,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.vars.palette.primary.solidHoverBg,
                  },
                },
              })}
            >
              <Dashboard sx={{ color: '#ffffff' }} />
              <ListItemContent sx={{ ml: { xs: 0, md: 2 }, display: (isCollapsed || isMobile) ? 'none' : 'block', color: '#ffffff' }}>
                Dashboard
              </ListItemContent>
            </ListItemButton>
          </ListItem>
          <ListItem sx={{ width: { xs: 'auto', md: '100%' }, flexShrink: 0 }}>
            <ListItemButton
              component={NavLink}
              to="/patients"
              sx={(theme) => ({
                color: '#ffffff',
                justifyContent: 'center',
                px: { xs: 1, md: (isCollapsed ? 1 : 2) },
                minWidth: { xs: '48px', md: 'auto' },
                minHeight: { xs: '48px', md: 'auto' },
                '&.active': {
                  backgroundColor: theme.vars.palette.primary.solidBg,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.vars.palette.primary.solidHoverBg,
                  },
                },
              })}
            >
              <People sx={{ color: '#ffffff' }} />
              <ListItemContent sx={{ ml: { xs: 0, md: 2 }, display: (isCollapsed || isMobile) ? 'none' : 'block', color: '#ffffff' }}>
                Patients
              </ListItemContent>
            </ListItemButton>
          </ListItem>
          <ListItem sx={{ width: { xs: 'auto', md: '100%' }, flexShrink: 0 }}>
            <ListItemButton
              component={NavLink}
              to="/appointments"
              sx={(theme) => ({
                color: '#ffffff',
                justifyContent: 'center',
                px: { xs: 1, md: (isCollapsed ? 1 : 2) },
                minWidth: { xs: '48px', md: 'auto' },
                minHeight: { xs: '48px', md: 'auto' },
                '&.active': {
                  backgroundColor: theme.vars.palette.primary.solidBg,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.vars.palette.primary.solidHoverBg,
                  },
                },
              })}
            >
              <CalendarMonth sx={{ color: '#ffffff' }} />
              <ListItemContent sx={{ ml: { xs: 0, md: 2 }, display: (isCollapsed || isMobile) ? 'none' : 'block', color: '#ffffff' }}>
                Appointments
              </ListItemContent>
            </ListItemButton>
          </ListItem>
          <ListItem sx={{ width: { xs: 'auto', md: '100%' }, flexShrink: 0 }}>
            <ListItemButton
              component={NavLink}
              to="/invoices"
              sx={(theme) => ({
                color: '#ffffff',
                justifyContent: 'center',
                px: { xs: 1, md: (isCollapsed ? 1 : 2) },
                minWidth: { xs: '48px', md: 'auto' },
                minHeight: { xs: '48px', md: 'auto' },
                '&.active': {
                  backgroundColor: theme.vars.palette.primary.solidBg,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.vars.palette.primary.solidHoverBg,
                  },
                },
              })}
            >
              <Receipt sx={{ color: '#ffffff' }} />
              <ListItemContent sx={{ ml: { xs: 0, md: 2 }, display: (isCollapsed || isMobile) ? 'none' : 'block', color: '#ffffff' }}>
                Invoices
              </ListItemContent>
            </ListItemButton>
          </ListItem>
          {/* Reports & Settings - Included in same list on mobile */}
          <ListItem sx={{ width: { xs: 'auto', md: '100%' }, flexShrink: 0, display: { xs: 'flex', md: 'none' } }}>
            <ListItemButton
              component={NavLink}
              to="/reports"
              sx={(theme) => ({
                color: '#ffffff',
                justifyContent: 'center',
                px: { xs: 1, md: (isCollapsed ? 1 : 2) },
                minWidth: { xs: '48px', md: 'auto' },
                minHeight: { xs: '48px', md: 'auto' },
                '&.active': {
                  backgroundColor: theme.vars.palette.primary.solidBg,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.vars.palette.primary.solidHoverBg,
                  },
                },
              })}
            >
              <Assessment sx={{ color: '#ffffff' }} />
              <ListItemContent sx={{ ml: { xs: 0, md: 2 }, display: (isCollapsed || isMobile) ? 'none' : 'block', color: '#ffffff' }}>
                Reports
              </ListItemContent>
            </ListItemButton>
          </ListItem>
          <ListItem sx={{ width: { xs: 'auto', md: '100%' }, flexShrink: 0, display: { xs: 'flex', md: 'none' } }}>
            <ListItemButton
              component={NavLink}
              to="/settings"
              sx={(theme) => ({
                color: '#ffffff',
                justifyContent: 'center',
                px: { xs: 1, md: (isCollapsed ? 1 : 2) },
                minWidth: { xs: '48px', md: 'auto' },
                minHeight: { xs: '48px', md: 'auto' },
                '&.active': {
                  backgroundColor: theme.vars.palette.primary.solidBg,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.vars.palette.primary.solidHoverBg,
                  },
                },
              })}
            >
              <Settings sx={{ color: '#ffffff' }} />
              <ListItemContent sx={{ ml: { xs: 0, md: 2 }, display: (isCollapsed || isMobile) ? 'none' : 'block', color: '#ffffff' }}>
                Settings
              </ListItemContent>
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Bottom Navigation - Reports & Settings (Desktop only) */}
      <Box sx={{ 
        flexShrink: 0, 
        borderTop: { xs: 'none', md: '1px solid' },
        borderColor: 'divider', 
        pt: { xs: 0, md: 1 },
        px: 0,
        display: { xs: 'none', md: 'block' },
      }}>
        <List
          sx={{
            '--ListItem-radius': '8px',
            '--ListItem-minHeight': { xs: '48px', md: '48px' },
          }}
        >
          <ListItem>
            <ListItemButton
              component={NavLink}
              to="/reports"
              sx={(theme) => ({
                color: '#ffffff',
                justifyContent: (isCollapsed || isMobile) ? 'center' : 'flex-start',
                px: (isCollapsed || isMobile) ? 1 : 2,
                '&.active': {
                  backgroundColor: theme.vars.palette.primary.solidBg,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.vars.palette.primary.solidHoverBg,
                  },
                },
              })}
            >
              <Assessment sx={{ color: '#ffffff' }} />
              <ListItemContent sx={{ ml: 2, display: (isCollapsed || isMobile) ? 'none' : 'block', color: '#ffffff' }}>
                Reports
              </ListItemContent>
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton
              component={NavLink}
              to="/settings"
              sx={(theme) => ({
                color: '#ffffff',
                justifyContent: (isCollapsed || isMobile) ? 'center' : 'flex-start',
                px: (isCollapsed || isMobile) ? 1 : 2,
                '&.active': {
                  backgroundColor: theme.vars.palette.primary.solidBg,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.vars.palette.primary.solidHoverBg,
                  },
                },
              })}
            >
              <Settings sx={{ color: '#ffffff' }} />
              <ListItemContent sx={{ ml: 2, display: (isCollapsed || isMobile) ? 'none' : 'block', color: '#ffffff' }}>
                Settings
              </ListItemContent>
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  );

  return (
    <>
      {/* Sidebar - Always visible, collapsed on mobile, at bottom on mobile */}
      <Sheet
        sx={{
          position: { xs: 'fixed', md: 'sticky' },
          top: { xs: 'auto', md: 0 },
          bottom: { xs: 0, md: 'auto' },
          left: { xs: 0, md: 'auto' },
          right: { xs: 0, md: 'auto' },
          height: { xs: '60px', md: '100vh' },
          width: { xs: '100%', md: isCollapsed ? 60 : 250 },
          p: { xs: 0.5, md: isCollapsed ? 1 : 2 },
          borderRight: { xs: 'none', md: '1px solid' },
          borderTop: { xs: '1px solid', md: 'none' },
          borderBottom: { xs: 'none', md: 'none' },
          borderColor: 'divider',
          backgroundColor: 'background.surface',
          transition: 'width 0.2s',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          alignItems: { xs: 'center', md: 'stretch' },
          justifyContent: { xs: 'space-around', md: 'flex-start' },
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        <NavContent />
      </Sheet>
    </>
  );
};

export default Sidebar;
