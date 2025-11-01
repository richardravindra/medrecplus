import React from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Breadcrumbs from '@mui/joy/Breadcrumbs';
import Link from '@mui/joy/Link';
import People from '@mui/icons-material/People';
import Dashboard from '@mui/icons-material/Dashboard';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Edit from '@mui/icons-material/Edit';
import Settings from '@mui/icons-material/Settings';
import MedicalServices from '@mui/icons-material/MedicalServices';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Receipt from '@mui/icons-material/Receipt';

const Header: React.FC = () => {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ label: string; href: string; icon?: React.ReactElement }> = [];

    // If we're on the home page (dashboard)
    if (location.pathname === '/') {
      breadcrumbs.push({ label: 'Dashboard', href: '/', icon: <Dashboard /> });
      return breadcrumbs;
    }

    // Always start with Dashboard
    breadcrumbs.push({ label: 'Dashboard', href: '/', icon: <Dashboard /> });

    pathSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      let label = segment;
      let icon: React.ReactElement | undefined;

      if (segment === 'patients') {
        // Check if this is the patients list or just part of another route
        if (pathSegments.length === 1) {
          label = 'All Patients';
          icon = <People />;
        } else {
          return; // Skip this segment as it's part of a longer route
        }
      } else if (segment === 'add') {
        // Check if this is for treatments or patients
        const previousSegment = pathSegments[index - 1];
        if (previousSegment === 'treatments') {
          label = 'Add Treatment';
          icon = <PersonAdd />;
        } else {
          label = 'Add Patient';
          icon = <PersonAdd />;
        }
      } else if (!isNaN(Number(segment))) {
        // Check if next segment is 'edit'
        const nextSegment = pathSegments[index + 1];
        const previousSegment = pathSegments[index - 1];
        if (nextSegment === 'edit') {
          if (previousSegment === 'treatments') {
            label = 'Edit Treatment';
            icon = <Edit />;
          } else {
            label = 'Edit Patient';
            icon = <Edit />;
          }
        } else if (previousSegment === 'appointments') {
          // This is an appointment ID (for appointment details)
          label = 'Appointment Details';
          icon = <CalendarMonth />;
        } else if (previousSegment === 'invoices') {
          // This is an invoice ID (for invoice details)
          label = 'Invoice Details';
          icon = <Receipt />;
        } else {
          label = 'Patient Details';
          icon = <People />;
        }
      } else if (segment === 'edit') {
        return; // Skip this as it's handled with the ID
      } else if (segment === 'settings') {
        label = 'Settings';
        icon = <Settings />;
      } else if (segment === 'new') {
        // Check if this is for appointments
        const previousSegment = pathSegments[index - 1];
        if (previousSegment === 'appointments') {
          label = 'New Appointment';
          icon = <PersonAdd />;
        }
      } else if (segment === 'appointments') {
        // Check if this is the appointments list or part of another route
        if (pathSegments.length === 1 || (pathSegments.length === 2 && pathSegments[1] === 'new')) {
          label = 'All Appointments';
          icon = <CalendarMonth />;
        } else {
          return; // Skip this segment as it's part of a longer route
        }
      } else if (segment === 'invoices') {
        // Check if this is the invoices list or part of another route
        if (pathSegments.length === 1) {
          label = 'All Invoices';
          icon = <Receipt />;
        } else {
          return; // Skip this segment as it's part of a longer route
        }
      } else if (segment === 'treatments') {
        // Check if this is the treatments list or part of another route
        if (pathSegments.length === 1) {
          label = 'All Treatments';
          icon = <MedicalServices />;
        } else {
          return; // Skip this segment as it's part of a longer route
        }
      }

      if (label !== segment) { // Only add if we processed this segment
        if (icon) {
          breadcrumbs.push({ label, href, icon });
        } else {
          breadcrumbs.push({ label, href });
        }
      }
    });

    return breadcrumbs;
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 3 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.surface',
        display: 'none',
      }}
    >
      <Breadcrumbs 
        separator="›"
        sx={{
          fontSize: { xs: '0.875rem', md: '1rem' },
          flexWrap: 'wrap',
        }}
      >
        {getBreadcrumbs().map((crumb, index) => (
          <Link
            key={index}
            href={crumb.href}
            underline="hover"
            color="neutral"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, md: 1 },
              fontSize: { xs: '0.875rem', md: '1rem' },
              fontWeight: index === getBreadcrumbs().length - 1 ? 'bold' : 'normal',
              color: index === getBreadcrumbs().length - 1 ? 'primary' : 'text.secondary',
            }}
          >
            {crumb.icon && <span style={{ marginRight: '4px', fontSize: '1rem' }}>{crumb.icon}</span>}
            {crumb.label}
          </Link>
        ))}
      </Breadcrumbs>
    </Box>
  );
};

export default Header;