import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import Alert from '@mui/joy/Alert';
import Stack from '@mui/joy/Stack';
import IconButton from '@mui/joy/IconButton';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemContent from '@mui/joy/ListItemContent';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import ModalClose from '@mui/joy/ModalClose';
import FormLabel from '@mui/joy/FormLabel';
import FormControl from '@mui/joy/FormControl';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Science from '@mui/icons-material/Science';

interface CustomExamination {
  id: number;
  name: string;
  unit: string;
  created_at: string;
}

const CustomExaminationsSettings: React.FC = () => {
  const navigate = useNavigate();
  const [examinations, setExaminations] = useState<CustomExamination[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamination, setEditingExamination] = useState<CustomExamination | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    unit: ''
  });

  useEffect(() => {
    loadExaminations();
  }, []);

  const loadExaminations = () => {
    try {
      const storedExaminations = localStorage.getItem('custom_examinations');
      if (storedExaminations) {
        const examinationsData: CustomExamination[] = JSON.parse(storedExaminations);
        setExaminations(examinationsData);
      }
    } catch (error) {
      console.error('Error loading examinations:', error);
      setError('Failed to load examinations');
    }
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const resetForm = () => {
    setFormData({ name: '', unit: '' });
    setEditingExamination(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (examination: CustomExamination) => {
    setFormData({
      name: examination.name,
      unit: examination.unit
    });
    setEditingExamination(examination);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
    setError(null);
    setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Examination name is required');
      return false;
    }

    if (!formData.unit.trim()) {
      setError('Unit is required');
      return false;
    }

    // Check for duplicate names (only if not editing)
    if (!editingExamination) {
      const existingExamination = examinations.find(
        exam => exam.name.toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (existingExamination) {
        setError('An examination with this name already exists');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingExamination) {
        // Update existing examination
        const updatedExaminations = examinations.map(exam =>
          exam.id === editingExamination.id
            ? {
                ...exam,
                name: formData.name.trim(),
                unit: formData.unit.trim()
              }
            : exam
        );
        setExaminations(updatedExaminations);
        localStorage.setItem('custom_examinations', JSON.stringify(updatedExaminations));
        setSuccess('Examination updated successfully!');
      } else {
        // Add new examination
        const newExamination: CustomExamination = {
          id: Date.now(),
          name: formData.name.trim(),
          unit: formData.unit.trim(),
          created_at: new Date().toISOString()
        };
        const updatedExaminations = [...examinations, newExamination];
        setExaminations(updatedExaminations);
        localStorage.setItem('custom_examinations', JSON.stringify(updatedExaminations));
        setSuccess('Examination added successfully!');
      }

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (error) {
      console.error('Error saving examination:', error);
      setError('Failed to save examination. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (examination: CustomExamination) => {
    if (window.confirm(`Are you sure you want to delete "${examination.name}"? This action cannot be undone.`)) {
      try {
        const updatedExaminations = examinations.filter(exam => exam.id !== examination.id);
        setExaminations(updatedExaminations);
        localStorage.setItem('custom_examinations', JSON.stringify(updatedExaminations));
        setSuccess('Examination deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Error deleting examination:', error);
        setError('Failed to delete examination. Please try again.');
      }
    }
  };

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
        <Science sx={{ fontSize: 32 }} />
        <Typography level="h2">Custom Patient Examinations</Typography>
      </Box>

      {error && (
        <Alert color="danger" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert color="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Card>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography level="h4" sx={{ mb: 1 }}>Examination Fields</Typography>
            <Typography level="body-sm" sx={{ color: '#ffffff' }}>
              Create custom examination fields that will appear in the New Appointment form below the vital signs section.
            </Typography>
          </Box>
          <Button
            variant="solid"
            color="primary"
            startDecorator={<Add />}
            onClick={openAddModal}
            sx={{ borderRadius: 'sm' }}
          >
            Add Examination
          </Button>
        </Box>

        {examinations.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: 'background.level1',
            borderRadius: 'sm'
          }}>
            <Science sx={{ fontSize: 64, color: '#ffffff', opacity: 0.5, mb: 2 }} />
            <Typography level="h4" sx={{ color: '#ffffff', mb: 1 }}>
              No Custom Examinations
            </Typography>
            <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
              Create your first custom examination field to get started.
            </Typography>
          </Box>
        ) : (
          <List>
            {examinations.map((examination) => (
              <ListItem
                key={examination.id}
                sx={{
                  py: 2,
                  px: 3,
                  mb: 1,
                  backgroundColor: 'background.level1',
                  borderRadius: 'sm',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <ListItemContent>
                  <Typography level="title-lg" sx={{ color: '#ffffff', mb: 0.5 }}>
                    {examination.name}
                  </Typography>
                  <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
                    Unit: {examination.unit}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.6, mt: 0.5 }}>
                    Added: {new Date(examination.created_at).toLocaleDateString()}
                  </Typography>
                </ListItemContent>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    variant="outlined"
                    color="neutral"
                    onClick={() => openEditModal(examination)}
                    sx={{ borderRadius: 'sm' }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    variant="outlined"
                    color="danger"
                    onClick={() => handleDelete(examination)}
                    sx={{ borderRadius: 'sm' }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={isModalOpen} onClose={closeModal}>
        <ModalDialog sx={{ minWidth: '400px' }}>
          <ModalClose />
          <DialogTitle>
            {editingExamination ? 'Edit Examination' : 'Add New Examination'}
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Examination Name *</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    placeholder="e.g., Random Blood Glucose"
                    required
                    sx={{
                      '& input': {
                        color: '#ffffff'
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Unit *</FormLabel>
                  <Input
                    value={formData.unit}
                    onChange={handleInputChange('unit')}
                    placeholder="e.g., mg/dL"
                    required
                    sx={{
                      '& input': {
                        color: '#ffffff'
                      }
                    }}
                  />
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="neutral"
                    onClick={closeModal}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="solid"
                    color="primary"
                    loading={loading}
                  >
                    {editingExamination ? 'Update' : 'Add'} Examination
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

export default CustomExaminationsSettings;