import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';

export const SimpleNavigationTest: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0,0,0,0.9)',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 9999,
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    }}>
      <Button
        onClick={() => {
          console.log('🧪 Simple Nav: Going to Patients');
          navigate('/patients');
        }}
        sx={{ minWidth: '80px' }}
      >
        Patients
      </Button>
      <Button
        onClick={() => {
          console.log('🧪 Simple Nav: Going to Appointments');
          navigate('/appointments');
        }}
        sx={{ minWidth: '80px' }}
      >
        Appointments
      </Button>
      <Button
        onClick={() => {
          console.log('🧪 Simple Nav: Going to Test');
          navigate('/test');
        }}
        sx={{ minWidth: '80px' }}
      >
        Test
      </Button>
      <Button
        onClick={() => {
          console.log('🧪 Simple Nav: Going to Dashboard');
          navigate('/');
        }}
        sx={{ minWidth: '80px' }}
      >
        Dashboard
      </Button>
    </Box>
  );
};