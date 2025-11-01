import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Table from '@mui/joy/Table';
import Chip from '@mui/joy/Chip';
import Stack from '@mui/joy/Stack';
import CircularProgress from '@mui/joy/CircularProgress';
import IconButton from '@mui/joy/IconButton';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';

interface Treatment {
  id: number;
  name: string;
  description: string;
  price: number;
  created_at: string;
}

const Treatments: React.FC = () => {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = async () => {
    try {
      // For now, we'll use localStorage for treatment management
      // In a real app, this would be an API call
      const storedTreatments = localStorage.getItem('treatments');
      if (storedTreatments) {
        setTreatments(JSON.parse(storedTreatments));
      } else {
        // Add some default treatments
        const defaultTreatments: Treatment[] = [
          {
            id: 1,
            name: 'General Consultation',
            description: 'Basic medical consultation and examination',
            price: 150000,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Blood Test',
            description: 'Complete blood count and basic chemistry panel',
            price: 250000,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            name: 'X-Ray',
            description: 'Digital radiography examination',
            price: 350000,
            created_at: new Date().toISOString()
          }
        ];
        localStorage.setItem('treatments', JSON.stringify(defaultTreatments));
        setTreatments(defaultTreatments);
      }
    } catch {
      setError('Failed to load treatments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTreatment = (treatment: Treatment) => {
    if (window.confirm(`Are you sure you want to delete treatment "${treatment.name}"?`)) {
      try {
        const updatedTreatments = treatments.filter(t => t.id !== treatment.id);
        localStorage.setItem('treatments', JSON.stringify(updatedTreatments));
        setTreatments(updatedTreatments);
      } catch {
        setError('Failed to delete treatment');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography level="body-lg">Loading treatments...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100%',
      p: { xs: 1, md: 2 },
      pt: { xs: 0, md: 2 },
      boxSizing: 'border-box',
      minWidth: 0
    }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography level="h2">Treatments</Typography>
        <Button
          variant="solid"
          color="neutral"
          startDecorator={<Add />}
          onClick={() => navigate('/treatments/add')}
        >
          New Treatment
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Typography color="danger">{error}</Typography>
        </Box>
      )}

      
      {/* Treatments Table */}
      <Card>
        {treatments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography level="h4" sx={{ mb: 2, color: '#ffffff' }}>
              No treatments available
            </Typography>
            <Typography level="body-sm" sx={{ mb: 3, color: '#ffffff' }}>
              Get started by adding your first treatment
            </Typography>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Add />}
              onClick={() => navigate('/treatments/add')}
            >
              Add First Treatment
            </Button>
          </Box>
        ) : (
          <Table
            stripe="odd"
            sx={{
              '& tbody tr:hover': {
                backgroundColor: 'background.level1',
              },
            }}
          >
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Treatment Name</th>
                <th style={{ width: '35%' }}>Description</th>
                <th style={{ width: '20%' }}>Price</th>
                <th style={{ width: '15%' }}>Added Date</th>
                <th style={{ width: '5%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {treatments.map((treatment) => (
                <tr key={treatment.id}>
                  <td>
                    <Typography level="body-sm" fontWeight="bold">
                      {treatment.name}
                    </Typography>
                  </td>
                  <td>
                    <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                      {treatment.description}
                    </Typography>
                  </td>
                  <td>
                    <Chip color="success" variant="soft">
                      {formatCurrency(treatment.price)}
                    </Chip>
                  </td>
                  <td>
                    <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                      {new Date(treatment.created_at).toLocaleDateString()}
                    </Typography>
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="sm"
                        variant="outlined"
                        color="neutral"
                        onClick={() => navigate(`/treatments/${treatment.id}/edit`)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="sm"
                        variant="outlined"
                        color="danger"
                        onClick={() => handleDeleteTreatment(treatment)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Box>
  );
};

export default Treatments;