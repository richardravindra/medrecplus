import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Table from '@mui/joy/Table';
import Input from '@mui/joy/Input';
import Chip from '@mui/joy/Chip';
import Stack from '@mui/joy/Stack';
import CircularProgress from '@mui/joy/CircularProgress';
import IconButton from '@mui/joy/IconButton';
import Sheet from '@mui/joy/Sheet';
import Visibility from '@mui/icons-material/Visibility';
import Delete from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';
import Search from '@mui/icons-material/Search';
import ViewColumn from '@mui/icons-material/ViewColumn';
import Dropdown from '@mui/joy/Dropdown';
import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import MenuItem from '@mui/joy/MenuItem';
import Checkbox from '@mui/joy/Checkbox';
import Clear from '@mui/icons-material/Clear';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';

interface VitalSigns {
  bloodPressure: string;
  respirationRate: number;
  heartRate: number;
  borgScale: number;
}

interface AppointmentTreatment {
  id: number;
  name: string;
  price: number;
}

interface Appointment {
  id: number;
  patientName: string;
  patientId: number;
  date: string;
  vitalSigns: VitalSigns;
  treatments: AppointmentTreatment[];
  totalPrice: number;
  operatorName?: string;
  created_at: string;
}

const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 items per page
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    patient: true,
    date: true,
    vitalSigns: false,
    treatments: false,
    totalPrice: true,
    operator: true,
    actions: true
  });
  const [sortField, setSortField] = useState<keyof Appointment | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const storedAppointments = localStorage.getItem('appointments');
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      } else {
        // Add some default appointments
        const defaultAppointments: Appointment[] = [
          {
            id: 1,
            patientName: 'John Doe',
            patientId: 1,
            date: new Date().toISOString().split('T')[0],
            vitalSigns: {
              bloodPressure: '120/80',
              respirationRate: 16,
              heartRate: 72,
              borgScale: 3
            },
            treatments: [
              { id: 1, name: 'General Consultation', price: 150000 },
              { id: 2, name: 'Blood Test', price: 250000 }
            ],
            totalPrice: 400000,
            created_at: new Date().toISOString()
          }
        ];
        localStorage.setItem('appointments', JSON.stringify(defaultAppointments));
        setAppointments(defaultAppointments);
      }
    } catch {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    if (window.confirm(`Are you sure you want to delete appointment for "${appointment.patientName}"?`)) {
      try {
        const updatedAppointments = appointments.filter(a => a.id !== appointment.id);
        localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
        setAppointments(updatedAppointments);
      } catch {
        setError('Failed to delete appointment');
      }
    }
  };

  const handleColumnVisibilityChange = (column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handleSort = (field: keyof Appointment) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to descending by default for dates, ascending for others
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
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

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const filteredAppointments = useMemo(() => {
    let filtered = appointments.filter(appointment => {
      const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Apply date range filter if dates are set
      if (dateRange.start || dateRange.end) {
        const appointmentDate = new Date(appointment.date);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        // Set times to start/end of day for inclusive comparison
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        if (startDate && appointmentDate < startDate) return false;
        if (endDate && appointmentDate > endDate) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle null/undefined values
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        // Special handling for dates
        if (sortField === 'date' || sortField === 'created_at') {
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
  }, [appointments, searchTerm, dateRange, sortField, sortDirection]);

  // Reset to page 1 when search term or date range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange]);

  const clearDateRange = () => {
    setDateRange({ start: '', end: '' });
    setSelectedDateRange('all');
    setShowCustomDateRange(false);
  };

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    const now = new Date();
    
    if (range === 'all') {
      setDateRange({ start: '', end: '' });
      setShowCustomDateRange(false);
    } else if (range === 'today') {
      const today = now.toISOString().split('T')[0];
      setDateRange({ start: today, end: today });
      setShowCustomDateRange(false);
    } else if (range === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      setDateRange({ 
        start: startOfWeek.toISOString().split('T')[0], 
        end: endOfWeek.toISOString().split('T')[0] 
      });
      setShowCustomDateRange(false);
    } else if (range === 'last_week') {
      const startOfLastWeek = new Date(now);
      startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      setDateRange({ 
        start: startOfLastWeek.toISOString().split('T')[0], 
        end: endOfLastWeek.toISOString().split('T')[0] 
      });
      setShowCustomDateRange(false);
    } else if (range === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({ 
        start: startOfMonth.toISOString().split('T')[0], 
        end: endOfMonth.toISOString().split('T')[0] 
      });
      setShowCustomDateRange(false);
    } else if (range === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateRange({ 
        start: startOfLastMonth.toISOString().split('T')[0], 
        end: endOfLastMonth.toISOString().split('T')[0] 
      });
      setShowCustomDateRange(false);
    } else if (range === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      setDateRange({ 
        start: startOfYear.toISOString().split('T')[0], 
        end: endOfYear.toISOString().split('T')[0] 
      });
      setShowCustomDateRange(false);
    } else if (range === 'last_30_days') {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      setDateRange({ 
        start: startDate.toISOString().split('T')[0], 
        end: now.toISOString().split('T')[0] 
      });
      setShowCustomDateRange(false);
    } else if (range === 'custom') {
      setShowCustomDateRange(true);
    }
  };

  // Calculate pagination
  const totalItems = filteredAppointments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  
  const getBorgScaleColor = (scale: number) => {
    if (scale <= 3) return 'success';
    if (scale <= 6) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography level="body-lg" sx={{ color: '#ffffff' }}>Loading appointments...</Typography>
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
      pr: { xs: 2, md: 2 },
      boxSizing: 'border-box',
      minWidth: 0
    }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography level="h2">Appointments</Typography>
      </Box>
      {error && (
        <Box sx={{ mb: 3 }}>
          <Typography color="danger">{error}</Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 2 }, width: '100%', mb: 1 }}>
        {/* Box 1: Search left, Date selector right */}
        <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: { xs: 1, md: 0 } }}>
          <Input
            startDecorator={<Search sx={{ color: '#ffffff' }} />}
            placeholder="Search appointments by patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 400, width: '100%', color: '#ffffff', fontSize: { xs: 14, sm: 16 }, '&::placeholder': { color: '#ffffff !important', opacity: 0.7 }, '& input': { color: '#ffffff !important' } }}
          />
          <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Select
              value={selectedDateRange}
              onChange={(_, value) => handleDateRangeChange(value as string)}
              placeholder="Select Date Range"
              sx={{
                height: 40,
                minHeight: 40,
                lineHeight: '40px',
                padding: 0,
                color: '#ffffff',
                fontSize: { xs: 13, sm: 16 },
                width: { xs: 110, sm: 180 },
                minWidth: 0,
                '& .MuiInputBase-input': {
                  height: '40px !important',
                  minHeight: '40px !important',
                  lineHeight: '40px !important',
                  padding: '0 !important',
                  display: 'flex !important',
                  alignItems: 'center !important',
                  justifyContent: 'center !important',
                  textAlign: 'center !important',
                  width: '100% !important',
                  fontSize: { xs: '13px !important', sm: '16px !important' },
                },
                '& .MuiSelect-select': {
                  color: '#ffffff !important',
                  height: '40px !important',
                  minHeight: '40px !important',
                  lineHeight: '40px !important',
                  padding: '0 !important',
                  display: 'flex !important',
                  alignItems: 'center !important',
                  justifyContent: 'center !important',
                  textAlign: 'center !important',
                  width: '100% !important',
                  fontSize: { xs: '13px !important', sm: '16px !important' },
                },
                '& input': {
                  height: '40px !important',
                  lineHeight: '40px !important',
                  textAlign: 'center !important',
                  padding: '0 !important',
                },
              }}
            >
              <Option value="all" sx={{ color: '#ffffff' }}>All Time</Option>
              <Option value="today" sx={{ color: '#ffffff' }}>Today</Option>
              <Option value="this_week" sx={{ color: '#ffffff' }}>This Week</Option>
              <Option value="last_week" sx={{ color: '#ffffff' }}>Last Week</Option>
              <Option value="this_month" sx={{ color: '#ffffff' }}>This Month</Option>
              <Option value="last_month" sx={{ color: '#ffffff' }}>Last Month</Option>
              <Option value="last_30_days" sx={{ color: '#ffffff' }}>Last 30 Days</Option>
              <Option value="this_year" sx={{ color: '#ffffff' }}>This Year</Option>
              <Option value="custom" sx={{ color: '#ffffff' }}>Custom Range</Option>
            </Select>
            {(dateRange.start || dateRange.end) && !showCustomDateRange && (
              <IconButton
                size="sm"
                variant="outlined"
                color="neutral"
                onClick={clearDateRange}
                sx={{ color: '#ffffff', ml: 0.5 }}
                title="Clear date filter"
              >
                <Clear />
              </IconButton>
            )}
          </Box>
        </Box>
        {/* Box 2: Columns selector left, New appointment right */}
        <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: { xs: 0, md: 0 }, overflowX: { xs: 'auto', md: 'visible' } }}>
          <Dropdown>
            <MenuButton
              variant="outlined"
              startDecorator={<ViewColumn sx={{ color: '#ffffff' }} />}
              sx={{
                maxWidth: 160,
                minWidth: 0,
                flexShrink: 1,
                width: 'auto',
                borderRadius: 'sm',
                color: '#ffffff',
                height: 40,
                minHeight: 40,
                fontSize: 16,
                whiteSpace: 'nowrap',
              }}
            >
              Columns
            </MenuButton>
            <Menu placement="bottom-end">
              <MenuItem onClick={() => handleColumnVisibilityChange('patient')}>
                <Checkbox
                  checked={columnVisibility.patient}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Patient Name</Typography>
              </MenuItem>
              <MenuItem onClick={() => handleColumnVisibilityChange('date')}>
                <Checkbox
                  checked={columnVisibility.date}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Date</Typography>
              </MenuItem>
              <MenuItem onClick={() => handleColumnVisibilityChange('vitalSigns')}>
                <Checkbox
                  checked={columnVisibility.vitalSigns}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Vital Signs</Typography>
              </MenuItem>
              <MenuItem onClick={() => handleColumnVisibilityChange('treatments')}>
                <Checkbox
                  checked={columnVisibility.treatments}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Treatments</Typography>
              </MenuItem>
              <MenuItem onClick={() => handleColumnVisibilityChange('totalPrice')}>
                <Checkbox
                  checked={columnVisibility.totalPrice}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Total Price</Typography>
              </MenuItem>
              <MenuItem onClick={() => handleColumnVisibilityChange('operator')}>
                <Checkbox
                  checked={columnVisibility.operator}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Operator</Typography>
              </MenuItem>
              <MenuItem onClick={() => handleColumnVisibilityChange('actions')}>
                <Checkbox
                  checked={columnVisibility.actions}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Actions</Typography>
              </MenuItem>
            </Menu>
          </Dropdown>
          <Button
            variant="solid"
            color="primary"
            startDecorator={<Add />}
            onClick={() => navigate('/appointments/new')}
            sx={{ flexShrink: 0, ml: 1, whiteSpace: 'nowrap', width: { xs: 'fit-content', sm: 'auto' } }}
          >
            New Appointment
          </Button>
        </Box>
      </Box>
      {totalItems > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pr: { xs: 0, md: 0 } }}>
          {/* REMOVE: 'Page {currentPage} of {totalPages}' Typography from here entirely */}
        </Box>
      )}

      {/* Appointments Table */}
      <Card>
        {currentAppointments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography level="h4" sx={{ mb: 2, color: '#ffffff' }}>
              {searchTerm ? 'No appointments found' : 'No appointments available'}
            </Typography>
            <Typography level="body-sm" sx={{ mb: 3, color: '#ffffff' }}>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first appointment'
              }
            </Typography>
            {!searchTerm && (
              <Button
                variant="solid"
                color="primary"
                startDecorator={<Add />}
                onClick={() => navigate('/appointments/new')}
              >
                Create First Appointment
              </Button>
            )}
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
                  '& tbody tr:hover': { backgroundColor: 'background.level2', },
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
                {columnVisibility.date && (
                  <th
                    style={{ padding: '12px', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('date')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 14, color: '#ffffff' }} /> : <ArrowDownward sx={{ fontSize: 14, color: '#ffffff' }} />
                      )}
                      Date
                    </Box>
                  </th>
                )}
                {columnVisibility.patient && <th style={{ padding: '12px', color: '#ffffff' }}>Patient</th>}
                {columnVisibility.vitalSigns && <th style={{ padding: '12px', color: '#ffffff' }}>Vital Signs</th>}
                {columnVisibility.treatments && <th style={{ padding: '12px', color: '#ffffff' }}>Treatments</th>}
                {columnVisibility.totalPrice && <th style={{ padding: '12px', color: '#ffffff' }}>Total Price</th>}
                {columnVisibility.operator && <th style={{ padding: '12px', color: '#ffffff' }}>Operator</th>}
                {columnVisibility.actions && <th style={{ padding: '12px', color: '#ffffff' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  {columnVisibility.date && (
                    <td style={{ padding: '12px' }}>
                      <Typography
                        component="a"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/appointments/${appointment.id}`);
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
                        {formatAppointmentDate(appointment.date)}
                      </Typography>
                    </td>
                  )}
                  {columnVisibility.patient && (
                    <td style={{ padding: '12px', fontWeight: 500, color: '#ffffff' }}>
                      <Typography
                        level="body-sm"
                        fontWeight="bold"
                        component="a"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/patients/${appointment.patientId}`);
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
                        {appointment.patientName}
                      </Typography>
                    </td>
                  )}
                  {columnVisibility.vitalSigns && (
                    <td style={{ padding: '12px' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography level="body-xs" sx={{ color: '#ffffff' }}>
                          BP: {appointment.vitalSigns.bloodPressure}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: '#ffffff' }}>
                          RR: {appointment.vitalSigns.respirationRate} | HR: {appointment.vitalSigns.heartRate}
                        </Typography>
                        <Chip
                          size="sm"
                          color={getBorgScaleColor(appointment.vitalSigns.borgScale)}
                          variant="soft"
                        >
                          Borg: {appointment.vitalSigns.borgScale}/10
                        </Chip>
                      </Box>
                    </td>
                  )}
                  {columnVisibility.treatments && (
                    <td style={{ padding: '12px' }}>
                      <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                        {appointment.treatments.length} treatment{appointment.treatments.length !== 1 ? 's' : ''}
                      </Typography>
                    </td>
                  )}
                  {columnVisibility.totalPrice && (
                    <td style={{ padding: '12px' }}>
                      <Chip color="success" variant="soft">
                        {formatCurrency(appointment.totalPrice)}
                      </Chip>
                    </td>
                  )}
                  {columnVisibility.operator && (
                    <td style={{ padding: '12px' }}>
                      <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                        {appointment.operatorName || 'Not assigned'}
                      </Typography>
                    </td>
                  )}
                  {columnVisibility.actions && (
                    <td style={{ padding: '12px' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/appointments/${appointment.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          color="danger"
                          onClick={() => handleDeleteAppointment(appointment)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
          </Box>
        </Sheet>
        )}
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', pr: { xs: 0, md: 0 } }}>
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
      {totalItems > 0 && (
        <Typography sx={{ color: '#ffffff', fontSize: '12px', mt: 1, textAlign: 'center', width: '100%' }}>
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} appointments
          {(searchTerm || dateRange.start || dateRange.end) && ` (filtered from ${appointments.length} total)`}
        </Typography>
      )}
    </Box>
  );
};

export default Appointments;