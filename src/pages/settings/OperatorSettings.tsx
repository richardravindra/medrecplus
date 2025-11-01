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

interface Operator {
  id: number;
  name: string;
  role: string;
  created_at: string;
}

const OperatorSettings: React.FC = () => {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [operatorFormData, setOperatorFormData] = useState({
    name: '',
    role: ''
  });

  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    try {
      const operatorsRaw = localStorage.getItem('operators');
      const storedOperators: Operator[] = JSON.parse(operatorsRaw || '[]');
      setOperators(storedOperators);
    } catch {
      setError('Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setOperatorFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddOperator = () => {
    setEditingOperator(null);
    setOperatorFormData({ name: '', role: '' });
    setIsOperatorModalOpen(true);
  };

  const handleEditOperator = (operator: Operator) => {
    setEditingOperator(operator);
    setOperatorFormData({ name: operator.name, role: operator.role });
    setIsOperatorModalOpen(true);
  };

  const handleDeleteOperator = (operator: Operator) => {
    if (window.confirm(`Are you sure you want to delete operator "${operator.name}"?`)) {
      try {
        const updatedOperators = operators.filter(op => op.id !== operator.id);
        localStorage.setItem('operators', JSON.stringify(updatedOperators));
        setOperators(updatedOperators);
      } catch {
        setError('Failed to delete operator');
      }
    }
  };

  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!operatorFormData.name.trim()) {
      setError('Operator name is required');
      return;
    }

    if (!operatorFormData.role.trim()) {
      setError('Role is required');
      return;
    }

    try {
      if (editingOperator) {
        // Update existing operator
        const updatedOperators = operators.map(op =>
          op.id === editingOperator.id
            ? { ...op, name: operatorFormData.name.trim(), role: operatorFormData.role.trim() }
            : op
        );
        localStorage.setItem('operators', JSON.stringify(updatedOperators));
        setOperators(updatedOperators);
      } else {
        // Add new operator
        const newOperator: Operator = {
          id: Date.now(),
          name: operatorFormData.name.trim(),
          role: operatorFormData.role.trim(),
          created_at: new Date().toISOString()
        };
        const updatedOperators = [...operators, newOperator];
        localStorage.setItem('operators', JSON.stringify(updatedOperators));
        setOperators(updatedOperators);
      }

      setIsOperatorModalOpen(false);
      setOperatorFormData({ name: '', role: '' });
      setEditingOperator(null);
      setError(null);
    } catch {
      setError(editingOperator ? 'Failed to update operator' : 'Failed to add operator');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography level="body-lg">Loading operators...</Typography>
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
        <Typography level="h2">Operator Management</Typography>
      </Box>

      {error && (
        <Alert color="danger" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography level="h4">System Operators</Typography>
            <Typography level="body-sm" sx={{ color: '#ffffff' }}>
              Manage system operators and their roles
            </Typography>
          </Box>
          <Button
            variant="solid"
            color="primary"
            startDecorator={<Add />}
            onClick={handleAddOperator}
          >
            Add Operator
          </Button>
        </Box>

        {operators.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography level="body-lg" sx={{ color: '#ffffff', mb: 2 }}>
              No operators found
            </Typography>
            <Button
              variant="outlined"
              startDecorator={<Add />}
              onClick={handleAddOperator}
            >
              Add First Operator
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
                    <th style={{ color: '#ffffff' }}>Name</th>
                    <th style={{ color: '#ffffff' }}>Role</th>
                    <th style={{ color: '#ffffff' }}>Added Date</th>
                    <th style={{ color: '#ffffff' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((operator) => (
                    <tr key={operator.id}>
                      <td>
                        <Typography level="body-sm" fontWeight="bold">
                          {operator.name}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                          {operator.role}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                          {new Date(operator.created_at).toLocaleDateString()}
                        </Typography>
                      </td>
                      <td>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="sm"
                            variant="outlined"
                            color="neutral"
                            onClick={() => handleEditOperator(operator)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="outlined"
                            color="danger"
                            onClick={() => handleDeleteOperator(operator)}
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

      {/* Add/Edit Operator Modal */}
      <Modal open={isOperatorModalOpen} onClose={() => setIsOperatorModalOpen(false)}>
        <ModalDialog>
          <ModalClose />
          <DialogTitle sx={{ color: '#ffffff' }}>
            {editingOperator ? 'Edit Operator' : 'Add New Operator'}
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleOperatorSubmit}>
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel>Operator Name *</FormLabel>
                  <Input
                    value={operatorFormData.name}
                    onChange={handleOperatorInputChange('name')}
                    placeholder="Enter operator name"
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
                  <FormLabel>Role *</FormLabel>
                  <Input
                    value={operatorFormData.role}
                    onChange={handleOperatorInputChange('role')}
                    placeholder="Enter role (e.g., Doctor, Nurse, Administrator)"
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

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="neutral"
                    onClick={() => setIsOperatorModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="solid" color="primary">
                    {editingOperator ? 'Update' : 'Add'} Operator
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

export default OperatorSettings;