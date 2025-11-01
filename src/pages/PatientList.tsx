import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Table from '@mui/joy/Table';
import Typography from '@mui/joy/Typography';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import Checkbox from '@mui/joy/Checkbox';
import Menu from '@mui/joy/Menu';
import MenuItem from '@mui/joy/MenuItem';
import MenuButton from '@mui/joy/MenuButton';
import Dropdown from '@mui/joy/Dropdown';
import Sheet from '@mui/joy/Sheet';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import Search from '@mui/icons-material/Search';
import Add from '@mui/icons-material/Add';
import Visibility from '@mui/icons-material/Visibility';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import ViewColumn from '@mui/icons-material/ViewColumn';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { Patient, ColumnVisibility } from '../types';
import { databaseService } from '../services/database';

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchTimeoutRef = useRef<number | undefined>(undefined);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    record_number: false,
    name: true,
    age: true,
    address: true,
    phone_number: false,
    initial_diagnosis: false,
    date_added: true,
  });
  const [sortField, setSortField] = useState<keyof Patient | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 items per page
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Memoized filtered patients for performance
  const filteredPatients = useMemo(() => {
    let filtered = patients;

    // Apply search filter
    if (debouncedSearchTerm.trim()) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(lowerSearchTerm) ||
        patient.record_number.toLowerCase().includes(lowerSearchTerm) ||
        (patient.phone_number && patient.phone_number.toLowerCase().includes(lowerSearchTerm)) ||
        (patient.address && patient.address.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle null/undefined values
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        // Special handling for dates
        if (sortField === 'created_at') {
          aValue = aValue ? new Date(aValue as string).getTime() : 0;
          bValue = bValue ? new Date(bValue as string).getTime() : 0;
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [patients, debouncedSearchTerm, sortField, sortDirection]);

  // Reset to page 1 when debounced search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Calculate pagination
  const totalItems = filteredPatients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  
  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await databaseService.deletePatient(id);
        await loadPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handleSort = (field: keyof Patient) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to descending by default for dates, ascending for others
      setSortField(field);
      setSortDirection(field === 'created_at' ? 'desc' : 'asc');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography level="body-lg">Loading patients...</Typography>
      </Box>
    );
  }

  return (
      <Box sx={{
        width: '100%',
        height: '100%',
        minHeight: 'calc(100vh - 120px)', // Account for header and navbar on mobile
        p: { xs: 1, md: 2 },
        pt: { xs: 0, md: 2 },
        pr: { xs: 2, md: 2 },
        boxSizing: 'border-box',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography level="h3" sx={{ fontSize: '30px', color: '#ffffff' }}>Patients</Typography>
      </Box>

        {/* Search Bar */}
      <Box sx={{ 
        mb: 1, 
        display: 'flex', 
        gap: 2, 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        flexWrap: 'wrap'
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          flex: 1,
          width: { xs: '100%', sm: 'auto' },
          minWidth: 0
        }}>
          <Input
            startDecorator={<Search sx={{ color: '#ffffff' }} />}
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              maxWidth: { xs: '100%', sm: 400 },
              flex: 1,
              color: '#ffffff',
              '&::placeholder': {
                color: '#ffffff !important',
                opacity: 0.7
              },
              '& input': {
                color: '#ffffff !important'
              }
            }}
          />

          <Dropdown>
            <MenuButton
              variant="outlined"
              startDecorator={<ViewColumn sx={{ color: '#ffffff' }} />}
              sx={{ borderRadius: 'sm', color: '#ffffff' }}
            >
              Columns
            </MenuButton>
            <Menu placement="bottom-end">
              <Box sx={{ p: 2, minWidth: 200 }}>
                <Typography level="body-sm" sx={{ mb: 1, fontWeight: 'bold', color: '#ffffff' }}>
                  Toggle Columns
                </Typography>
                <Divider sx={{ mb: 1 }} />
                {Object.entries(columnVisibility).map(([column, visible]) => (
                  <MenuItem key={column} onClick={() => toggleColumnVisibility(column as keyof ColumnVisibility)}>
                    <Checkbox
                      checked={visible}
                      size="sm"
                      sx={{ mr: 1 }}
                    />
                    <Typography sx={{ color: '#ffffff' }}>
                      {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </MenuItem>
                ))}
              </Box>
            </Menu>
          </Dropdown>
        </Box>

        <Button
          variant="solid"
          color="neutral"
          startDecorator={<Add />}
          onClick={() => navigate('/patients/add')}
          sx={{ 
            borderRadius: 'sm',
            width: { xs: '100%', sm: 'auto' },
            flexShrink: 0
          }}
        >
          Add New Patient
        </Button>
        </Box>

      {/* Pagination Info */}
      {totalItems > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* REMOVE THIS: Typography level="body-sm" with 'Page {currentPage} of {totalPages}' or similar */}
        </Box>
      )}

      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Sheet sx={{
          overflow: 'auto',
          borderRadius: 'sm',
          overflowX: 'auto',
          width: '100%',
          maxWidth: '100%',
          flex: 1,
          minHeight: 0
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
                {columnVisibility.record_number && (
                  <th style={{ padding: '12px', color: '#ffffff' }}>Record Number</th>
                )}
                {columnVisibility.name && (
                  <th style={{ padding: '12px', color: '#ffffff' }}>Patient Name</th>
                )}
                {columnVisibility.age && (
                  <th style={{ padding: '12px', color: '#ffffff' }}>Age</th>
                )}
                {columnVisibility.address && (
                  <th style={{ padding: '12px', color: '#ffffff' }}>Address</th>
                )}
                {columnVisibility.phone_number && (
                  <th style={{ padding: '12px', color: '#ffffff' }}>Phone Number</th>
                )}
                {columnVisibility.initial_diagnosis && (
                  <th style={{ padding: '12px', color: '#ffffff' }}>Initial Diagnosis</th>
                )}
                {columnVisibility.date_added && (
                  <th
                    style={{ padding: '12px', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('created_at')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {sortField === 'created_at' && (
                        sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 14, color: '#ffffff' }} /> : <ArrowDownward sx={{ fontSize: 14, color: '#ffffff' }} />
                      )}
                      Date Added
                    </Box>
                  </th>
                )}
                <th style={{ padding: '12px', color: '#ffffff' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(columnVisibility).filter(Boolean).length + 1} style={{ textAlign: 'center', padding: '40px' }}>
                    <Typography level="body-lg" sx={{ color: '#ffffff' }}>
                      {debouncedSearchTerm ? 'No patients found matching your search.' : 'No patients registered yet.'}
                    </Typography>
                    {!debouncedSearchTerm && (
                      <Button
                        startDecorator={<Add />}
                        onClick={() => navigate('/patients/add')}
                        sx={{ mt: 2 }}
                      >
                        Add First Patient
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                currentPatients.map((patient: Patient) => (
                  <tr key={patient.id}>
                    {columnVisibility.record_number && (
                      <td style={{ padding: '12px' }}>
                        <Chip color="primary" variant="soft" size="sm">
                          {patient.record_number}
                        </Chip>
                      </td>
                    )}
                    {columnVisibility.name && (
                      <td style={{ padding: '12px', fontWeight: 500, color: '#ffffff' }}>
                        <Typography
                          component="a"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/patients/${patient.id}`);
                          }}
                          sx={{
                            color: '#ffffff',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            '&:hover': {
                              color: '#ffffff',
                              textDecoration: 'none',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              textShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                            }
                          }}
                        >
                          {patient.name}
                        </Typography>
                      </td>
                    )}
                    {columnVisibility.age && (
                      <td style={{ padding: '12px', color: '#ffffff' }}>{patient.age}</td>
                    )}
                    {columnVisibility.address && (
                      <td style={{ padding: '12px', color: '#ffffff' }}>
                        {patient.address || <Typography sx={{ color: '#ffffff' }}>-</Typography>}
                      </td>
                    )}
                    {columnVisibility.phone_number && (
                      <td style={{ padding: '12px', color: '#ffffff' }}>{patient.phone_number}</td>
                    )}
                    {columnVisibility.initial_diagnosis && (
                      <td style={{ padding: '12px' }}>
                        {patient.initial_diagnosis || <Typography sx={{ color: '#ffffff' }}>-</Typography>}
                      </td>
                    )}
                    {columnVisibility.date_added && (
                      <td style={{ padding: '12px', color: '#ffffff' }}>
                        <Typography level="body-sm">
                          {formatDate(patient.created_at)}
                        </Typography>
                      </td>
                    )}
                    <td style={{ padding: '12px' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/patients/${patient.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          color="warning"
                          onClick={() => navigate(`/patients/${patient.id}/edit`)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          color="danger"
                          onClick={() => handleDelete(patient.id!)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          </Box>
        </Sheet>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box sx={{
          mt: 3,
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          flexWrap: 'wrap',
          pr: { xs: 0, md: 0 }
        }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            sx={{ color: '#ffffff', borderColor: '#ffffff' }}
            startDecorator={<FirstPage />}
          >
          </Button>
          <Button
            variant="outlined"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            sx={{ color: '#ffffff', borderColor: '#ffffff' }}
            startDecorator={<ChevronLeft />}
          >
          </Button>

          <Typography sx={{
            display: 'flex',
            alignItems: 'center',
            color: '#ffffff',
            mx: 2
          }}>
            Page {currentPage} of {totalPages}
          </Typography>

          <Button
            variant="outlined"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            sx={{ color: '#ffffff', borderColor: '#ffffff' }}
            startDecorator={<ChevronRight />}
          >
          </Button>
          <Button
            variant="outlined"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            sx={{ color: '#ffffff', borderColor: '#ffffff' }}
            startDecorator={<LastPage />}
          >
          </Button>
        </Box>
      )}
      {/* Insert 'showing X-Y of N patients' info here, always, even if only 1 page, but below pagination */}
      {totalItems > 0 && (
        <Typography sx={{ color: '#ffffff', fontSize: '12px', mt: 1, textAlign: 'center', width: '100%' }}>
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} patients
          {debouncedSearchTerm && ` (filtered from ${patients.length} total)`}
        </Typography>
      )}
    </Box>
  );
};

export default PatientList;