import React, { useState, useEffect } from 'react';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Badge from '@mui/joy/Badge';
import People from '@mui/icons-material/People';
import MedicalServices from '@mui/icons-material/MedicalServices';
import Backup from '@mui/icons-material/Backup';
import History from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import Receipt from '@mui/icons-material/Receipt';
import Science from '@mui/icons-material/Science';
import CurrencyExchange from '@mui/icons-material/CurrencyExchange';
import Security from '@mui/icons-material/Security';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: number;
  action: string;
  operatorName: string;
  targetType: 'patient' | 'appointment' | 'invoice';
  targetId?: number;
  targetName?: string;
  patientId?: number;
  patientName?: string;
  timestamp: string;
  details?: string;
}

interface SettingsMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    // Set up an interval to check for new logs
    const interval = setInterval(loadUnreadCount, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = () => {
    try {
      const storedLogs = localStorage.getItem('activity_logs');
      if (storedLogs) {
        const logsData = JSON.parse(storedLogs);
        // Calculate unread logs (logs from last session)
        const lastSeen = localStorage.getItem('logs_last_seen') || '0';
        const unreadLogs = logsData.filter((log: LogEntry) => log.id > parseInt(lastSeen));
        setUnreadCount(unreadLogs.length);
      }
    } catch { // Error handled silently
    }
  };

  const settingsMenuItems: SettingsMenuItem[] = [
    {
      title: 'Operator Management',
      description: 'Manage system operators and their roles',
      icon: <People sx={{ fontSize: 24, color: '#ffffff' }} />,
      path: '/settings/operators'
    },
    {
      title: 'Treatment Management',
      description: 'Manage available treatments and their pricing',
      icon: <MedicalServices sx={{ fontSize: 24, color: '#ffffff' }} />,
      path: '/settings/treatments'
    },
    {
      title: 'Backup & Restore',
      description: 'Export and import application data',
      icon: <Backup sx={{ fontSize: 24, color: '#ffffff' }} />,
      path: '/settings/backup'
    },
    {
      title: 'Activity Logs',
      description: 'View operator actions and system activity',
      icon: <History sx={{ fontSize: 24, color: '#ffffff' }} />,
      path: '/settings/logs',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      title: 'Print Receipt Setup',
      description: 'Configure receipt header and footer for printing',
      icon: <Receipt sx={{ fontSize: 24, color: '#ffffff' }} />,
      path: '/settings/receipt'
    },
    {
      title: 'Custom Patient Examinations',
      description: 'Manage custom examination fields for patient appointments',
      icon: <Science sx={{ fontSize: 24, color: '#ffffff' }} />,
      path: '/settings/custom-examinations'
    },
    {
      title: 'Password and Security',
      description: 'Manage app password, lockscreen settings and security preferences',
      icon: <Security sx={{ fontSize: 24, color: '#ffffff' }} />,
      path: '/settings/security'
    },
    {
      title: 'Change Currency Unit',
      description: 'Select and configure the currency used throughout the application',
      icon: <CurrencyExchange sx={{ fontSize: 24, color: '#ffffff' }} />,
      path: '/settings/currency'
    }
  ];

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
        <SettingsIcon sx={{ fontSize: 32, color: '#ffffff' }} />
        <Typography level='h2'>Settings</Typography>
      </Box>

      {/* Settings Menu Grid */}
      <Stack spacing={0.75}>
        {settingsMenuItems.map(item => (
          <Card
            key={item.path}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                backgroundColor: 'background.level1'
              }
            }}
            onClick={() => navigate(item.path)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 0.75 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'background.level1',
                  color: '#ffffff'
                }}
              >
                {item.icon}
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography level='h4' sx={{ color: '#ffffff' }}>
                    {item.title}
                  </Typography>
                  {item.badge && <Badge badgeContent={item.badge} color='danger' />}
                </Box>
                <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                  {item.description}
                </Typography>
              </Box>
            </Box>
          </Card>
        ))}
      </Stack>

      {/* Attribution Footer */}
      <Box
        sx={{
          mt: 'auto',
          pt: 2,
          textAlign: 'center',
          width: '100%'
        }}
      >
        <Typography
          level='body-xs'
          sx={{
            color: '#ffffff',
            opacity: 0.7,
            fontSize: '0.75rem'
          }}
        >
          Copyrights © 2025 BSP Center Clinic. Made with ❤︎ in Bekasi
        </Typography>
      </Box>
    </Box>
  );
};

export default Settings;
