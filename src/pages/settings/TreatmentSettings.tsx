import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Table from '@mui/joy/Table';
import Input from '@mui/joy/Input';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import FormLabel from '@mui/joy/FormLabel';
import FormControl from '@mui/joy/FormControl';
import Stack from '@mui/joy/Stack';
import Alert from '@mui/joy/Alert';
import IconButton from '@mui/joy/IconButton';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Sheet from '@mui/joy/Sheet';

interface Treatment {
  id: number;
  name: string;
  description: string;
  price: number;
  created_at: string;
}

const TreatmentSettings: React.FC = () => {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [treatmentFormData, setTreatmentFormData] = useState({
    name: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = async () => {
    try {
      const treatmentsRaw = localStorage.getItem('treatments');
      const storedTreatments: Treatment[] = JSON.parse(treatmentsRaw || '[]');
      setTreatments(storedTreatments);
    } catch {
      setError('Failed to load treatments');
    } finally {
      setLoading(false);
    }
  };

  const handleTreatmentInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setTreatmentFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddTreatment = () => {
    setEditingTreatment(null);
    setTreatmentFormData({ name: '', description: '', price: '' });
    setIsTreatmentModalOpen(true);
  };

  const handleEditTreatment = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setTreatmentFormData({
      name: treatment.name,
      description: treatment.description,
      price: treatment.price.toString()
    });
    setIsTreatmentModalOpen(true);
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

  const handleTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!treatmentFormData.name.trim()) {
      setError('Treatment name is required');
      return;
    }

    if (!treatmentFormData.description.trim()) {
      setError('Description is required');
      return;
    }

    const price = parseFloat(treatmentFormData.price);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      if (editingTreatment) {
        // Update existing treatment
        const updatedTreatments = treatments.map(t =>
          t.id === editingTreatment.id
            ? { ...t, name: treatmentFormData.name.trim(), description: treatmentFormData.description.trim(), price }
            : t
        );
        localStorage.setItem('treatments', JSON.stringify(updatedTreatments));
        setTreatments(updatedTreatments);
      } else {
        // Add new treatment
        const newTreatment: Treatment = {
          id: Date.now(),
          name: treatmentFormData.name.trim(),
          description: treatmentFormData.description.trim(),
          price: price,
          created_at: new Date().toISOString()
        };
        const updatedTreatments = [...treatments, newTreatment];
        localStorage.setItem('treatments', JSON.stringify(updatedTreatments));
        setTreatments(updatedTreatments);
      }

      setIsTreatmentModalOpen(false);
      setTreatmentFormData({ name: '', description: '', price: '' });
      setEditingTreatment(null);
      setError(null);
    } catch {
      setError(editingTreatment ? 'Failed to update treatment' : 'Failed to add treatment');
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
        <Typography level="body-lg">Loading treatments...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100%',
      p: { xs: 1, md: 2 },
      pt: { xs: 0, md: 2 },
      pr: { xs: 2, md: 2 },
      boxSizing: 'border-box',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startDecorator={<ArrowBack />}
          onClick={() => navigate('/settings')}
          sx={{ borderRadius: 'sm' }}
        >
          Back to Settings
        </Button>
        <Typography level="h2">Treatment Management</Typography>
      </Box>

      {error && (
        <Alert color="danger" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography level="h4">Available Treatments</Typography>
            <Typography level="body-sm" sx={{ color: '#ffffff' }}>
              Manage available treatments and their pricing
            </Typography>
          </Box>
          <Button
            variant="solid"
            color="primary"
            startDecorator={<Add />}
            onClick={handleAddTreatment}
          >
            Add Treatment
          </Button>
        </Box>

        {treatments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography level="body-lg" sx={{ color: '#ffffff', mb: 2 }}>
              No treatments available
            </Typography>
            <Button
              variant="outlined"
              startDecorator={<Add />}
              onClick={handleAddTreatment}
            >
              Add First Treatment
            </Button>
          </Box>
        ) : (
          <Sheet sx={{
            overflow: 'auto',
            borderRadius: 'sm',
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100%'
          }}>
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
              <Table
                aria-labelledby="tableTitle"
                hoverRow
                sx={{
                  minWidth: { xs: 'auto', md: 'auto' },
                  width: { xs: '100%', md: '100%' },
                  tableLayout: { xs: 'auto', md: 'auto' },
                  '& tbody tr:hover': {
                    backgroundColor: 'background.level2',
                  },
                  '& thead th': {
                    backgroundColor: 'background.level1',
                    fontWeight: 'bold',
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    minWidth: { xs: 'auto', md: 'auto' },
                    padding: { xs: '8px 12px', md: '12px' },
                  },
                  '& tbody td': {
                    whiteSpace: 'nowrap',
                    minWidth: { xs: 'auto', md: 'auto' },
                    padding: { xs: '8px 12px', md: '12px' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              >
                <thead>
                  <tr>
                    <th style={{ color: '#ffffff' }}>Treatment Name</th>
                    <th style={{ color: '#ffffff' }}>Description</th>
                    <th style={{ color: '#ffffff' }}>Price</th>
                    <th style={{ color: '#ffffff' }}>Actions</th>
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
                        <Typography level="body-sm" color="success" fontWeight="bold">
                          {formatCurrency(treatment.price)}
                        </Typography>
                      </td>
                      <td>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="sm"
                            variant="outlined"
                            color="neutral"
                            onClick={() => handleEditTreatment(treatment)}
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
            </Box>
          </Sheet>
        )}
      </Card>

      {/* Add/Edit Treatment Modal */}
      <Modal open={isTreatmentModalOpen} onClose={() => setIsTreatmentModalOpen(false)}>
        <ModalDialog>
          <ModalClose />
          <DialogTitle sx={{ color: '#ffffff' }}>
            {editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleTreatmentSubmit}>
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel>Treatment Name *</FormLabel>
                  <Input
                    value={treatmentFormData.name}
                    onChange={handleTreatmentInputChange('name')}
                    placeholder="Enter treatment name"
                    required
                    sx={{
                      color: '#ffffff',
                      '& input::placeholder': {
                        color: '#ffffff !important',
                        opacity: 0.7
                      },
                      '& input': {
                        color: '#ffffff !important'
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description *</FormLabel>
                  <Input
                    value={treatmentFormData.description}
                    onChange={handleTreatmentInputChange('description')}
                    placeholder="Enter treatment description"
                    required
                    sx={{
                      color: '#ffffff',
                      '& input::placeholder': {
                        color: '#ffffff !important',
                        opacity: 0.7
                      },
                      '& input': {
                        color: '#ffffff !important'
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Price (IDR) *</FormLabel>
                  <Input
                    type="number"
                    value={treatmentFormData.price}
                    onChange={handleTreatmentInputChange('price')}
                    placeholder="Enter price in IDR"
                    required
                    slotProps={{ input: { min: 0 } }}
                    sx={{
                      color: '#ffffff',
                      '& input::placeholder': {
                        color: '#ffffff !important',
                        opacity: 0.7
                      },
                      '& input': {
                        color: '#ffffff !important'
                      }
                    }}
                  />
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="neutral"
                    onClick={() => setIsTreatmentModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="solid" color="primary">
                    {editingTreatment ? 'Update' : 'Add'} Treatment
                  </Button>
                </Box>
              </Stack>
            </form>
          </DialogContent>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default TreatmentSettings;