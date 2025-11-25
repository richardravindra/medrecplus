import React, { useState, useEffect, useMemo } from 'react';
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
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useDialog';
import Add from '@mui/icons-material/Add';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Search from '@mui/icons-material/Search';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import Sheet from '@mui/joy/Sheet';
import SimpleDataService from '../../services/SimpleDataService';
import { Operator } from '../../types';
import { log } from '../../utils/logger';

const OperatorSettings: React.FC = () => {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [operatorFormData, setOperatorFormData] = useState({
    name: '',
    role: ''
  });

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Dialog hook
  const confirmDialog = useConfirmDialog();

  useEffect(() => {
    loadOperators();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadOperators = async () => {
    try {
      setLoading(true);
      // Use SimpleDataService to get operators
      const data = await SimpleDataService.getOperators();
      setOperators(data);
      log.debug('Operators loaded successfully', { count: data.length }, 'OperatorSettings');
    } catch {
      log.error('Error loading operators', { _error: 'Failed to load operators' }, 'OperatorSettings');
      setError('Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate operators
  const filteredAndPaginatedOperators = useMemo(() => {
    let filtered = operators;

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = operators.filter(
        operator =>
          operator.name.toLowerCase().includes(searchLower) ||
          operator.role.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      operators: paginated,
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  }, [operators, debouncedSearchTerm, currentPage, itemsPerPage]);

  const { operators: paginatedOperators, totalCount, totalPages } = filteredAndPaginatedOperators;

  // Pagination handlers
  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleOperatorInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
    confirmDialog.openDialog({
      title: 'Delete Operator',
      message: `Are you sure you want to delete operator "${operator.name}"?`,
      onConfirm: async () => {
        try {
          // Use the new proper deleteOperator method
          const result = await SimpleDataService.deleteOperator(operator.id);

          if (result) {
            log.info(
              'Operator deleted',
              { id: operator.id, name: operator.name },
              'OperatorSettings'
            );

            // Force a small delay to ensure storage operations complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Force reload directly from storage to bypass any caching
            const updatedOperators = await SimpleDataService.getOperatorsFresh();

            // Force state update with new array reference
            setOperators([...updatedOperators]);

            // Reset to first page if current page becomes empty
            const startIndex = (currentPage - 1) * itemsPerPage;
            if (startIndex >= updatedOperators.length && currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
          } else {
            log.warn(
              'Operator deletion failed',
              { id: operator.id, name: operator.name },
              'OperatorSettings'
            );
          }
        } catch {
          log.error(
            'Failed to delete operator',
            { _error, operatorId: operator.id },
            'OperatorSettings'
          );
          setError('Failed to delete operator');
        }
      }
    });
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
        const updatedOperator: Operator = {
          ...editingOperator,
          name: operatorFormData.name.trim(),
          role: operatorFormData.role.trim()
        };

        await SimpleDataService.saveOperator(updatedOperator);
        log.info(
          'Operator updated',
          { id: updatedOperator.id, name: updatedOperator.name },
          'OperatorSettings'
        );

        // Update local state
        setOperators(operators.map(op => (op.id === editingOperator.id ? updatedOperator : op)));
      } else {
        // Add new operator
        const newOperator: Operator = {
          id: Date.now(),
          name: operatorFormData.name.trim(),
          role: operatorFormData.role.trim(),
          created_at: new Date().toISOString()
        };

        const savedOperator = await SimpleDataService.saveOperator(newOperator);
        log.info(
          'Operator created',
          { id: savedOperator.id, name: savedOperator.name },
          'OperatorSettings'
        );

        // Update local state with the correct ID from storage
        setOperators([...operators, savedOperator]);
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
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}
      >
        <Typography level='body-lg'>Loading operators...</Typography>
      </Box>
    );
  }

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
        <Button
          variant='outlined'
          startDecorator={<ArrowBack />}
          onClick={() => navigate('/settings')}
          sx={{ borderRadius: 'sm' }}
        >
          Back to Settings
        </Button>
        <Typography level='h2'>Operator Management</Typography>
      </Box>

      {_error && (
        <Alert color='danger' sx={{ mb: 3 }}>
          {_error}
        </Alert>
      )}

      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography level='h4'>System Operators</Typography>
            <Typography level='body-sm' sx={{ color: '#ffffff' }}>
              Manage system operators and their roles ({totalCount} total)
            </Typography>
          </Box>
          <Button
            variant='solid'
            color='primary'
            startDecorator={<Add />}
            onClick={handleAddOperator}
          >
            Add Operator
          </Button>
        </Box>

        {/* Search Box */}
        <Box sx={{ mb: 3 }}>
          <Input
            placeholder='Search operators by name or role...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            startDecorator={<Search />}
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
        </Box>

        {totalCount === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography level='body-lg' sx={{ color: '#ffffff', mb: 2 }}>
              {operators.length === 0 ? 'No operators found' : 'No operators match your search'}
            </Typography>
            {operators.length === 0 ? (
              <Button variant='outlined' startDecorator={<Add />} onClick={handleAddOperator}>
                Add First Operator
              </Button>
            ) : (
              <Button variant='outlined' onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            )}
          </Box>
        ) : (
          <Sheet
            sx={{
              overflow: 'auto',
              borderRadius: 'sm',
              overflowX: 'auto',
              width: '100%',
              maxWidth: '100%'
            }}
          >
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
              <Table
                aria-labelledby='tableTitle'
                hoverRow
                sx={{
                  minWidth: { xs: 'auto', md: 'auto' },
                  width: { xs: '100%', md: '100%' },
                  tableLayout: { xs: 'auto', md: 'auto' },
                  '& tbody tr:hover': {
                    backgroundColor: 'background.level2'
                  },
                  '& thead th': {
                    backgroundColor: 'background.level1',
                    fontWeight: 'bold',
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    minWidth: { xs: 'auto', md: 'auto' },
                    padding: { xs: '8px 12px', md: '12px' }
                  },
                  '& tbody td': {
                    whiteSpace: 'nowrap',
                    minWidth: { xs: 'auto', md: 'auto' },
                    padding: { xs: '8px 12px', md: '12px' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
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
                  {paginatedOperators.map(operator => (
                    <tr key={operator.id}>
                      <td>
                        <Typography level='body-sm' fontWeight='bold'>
                          {operator.name}
                        </Typography>
                      </td>
                      <td>
                        <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                          {operator.role}
                        </Typography>
                      </td>
                      <td>
                        <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                          {new Date(operator.created_at || '').toLocaleDateString()}
                        </Typography>
                      </td>
                      <td>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size='sm'
                            variant='outlined'
                            color='neutral'
                            onClick={() => handleEditOperator(operator)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size='sm'
                            variant='outlined'
                            color='danger'
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 3,
              px: 2
            }}
          >
            <Typography level='body-sm' sx={{ color: '#ffffff' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} operators
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton
                size='sm'
                variant='outlined'
                onClick={handleFirstPage}
                disabled={currentPage === 1}
                sx={{
                  color: currentPage === 1 ? '#000000' : '#ffffff',
                  borderColor: currentPage === 1 ? '#000000' : '#ffffff',
                  '&:disabled': {
                    color: '#000000',
                    borderColor: '#000000'
                  },
                  '&:not(:disabled):hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& svg': {
                    color: 'inherit'
                  }
                }}
              >
                <FirstPage />
              </IconButton>
              <IconButton
                size='sm'
                variant='outlined'
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                sx={{
                  color: currentPage === 1 ? '#000000' : '#ffffff',
                  borderColor: currentPage === 1 ? '#000000' : '#ffffff',
                  '&:disabled': {
                    color: '#000000',
                    borderColor: '#000000'
                  },
                  '&:not(:disabled):hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& svg': {
                    color: 'inherit'
                  }
                }}
              >
                <ChevronLeft />
              </IconButton>

              <Typography
                level='body-sm'
                sx={{
                  color: '#ffffff',
                  mx: 2,
                  minWidth: '60px',
                  textAlign: 'center'
                }}
              >
                Page {currentPage} of {totalPages}
              </Typography>

              <IconButton
                size='sm'
                variant='outlined'
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                sx={{
                  color: currentPage === totalPages ? '#000000' : '#ffffff',
                  borderColor: currentPage === totalPages ? '#000000' : '#ffffff',
                  '&:disabled': {
                    color: '#000000',
                    borderColor: '#000000'
                  },
                  '&:not(:disabled):hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& svg': {
                    color: 'inherit'
                  }
                }}
              >
                <ChevronRight />
              </IconButton>
              <IconButton
                size='sm'
                variant='outlined'
                onClick={handleLastPage}
                disabled={currentPage === totalPages}
                sx={{
                  color: currentPage === totalPages ? '#000000' : '#ffffff',
                  borderColor: currentPage === totalPages ? '#000000' : '#ffffff',
                  '&:disabled': {
                    color: '#000000',
                    borderColor: '#000000'
                  },
                  '&:not(:disabled):hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& svg': {
                    color: 'inherit'
                  }
                }}
              >
                <LastPage />
              </IconButton>
            </Box>
          </Box>
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
                    placeholder='Enter operator name'
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
                    placeholder='Enter role (e.g., Doctor, Nurse, Administrator)'
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
                    variant='outlined'
                    color='neutral'
                    onClick={() => setIsOperatorModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' variant='solid' color='primary'>
                    {editingOperator ? 'Update' : 'Add'} Operator
                  </Button>
                </Box>
              </Stack>
            </form>
          </DialogContent>
        </ModalDialog>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.isOpen}
        onClose={confirmDialog.closeDialog}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.config.title}
        message={confirmDialog.config.message}
        confirmText={confirmDialog.config.confirmText}
        cancelText={confirmDialog.config.cancelText}
        variant={confirmDialog.config.variant}
      />
    </Box>
  );
};

export default OperatorSettings;
