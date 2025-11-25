import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Typography, Input, Card } from '@mui/joy';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Clear from '@mui/icons-material/Clear';
import dayjs, { Dayjs } from 'dayjs';

interface DateRangeDropdownProps {
  value: [Dayjs | null, Dayjs | null];
  onChange: (value: [Dayjs | null, Dayjs | null]) => void;
}

const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Dayjs | null>(value[0]);
  const [tempEndDate, setTempEndDate] = useState<Dayjs | null>(value[1]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update temp values when props change
  useEffect(() => {
    setTempStartDate(value[0]);
    setTempEndDate(value[1]);
  }, [value]);

  const formatDate = (date: Dayjs | null): string => {
    if (!date) return '';
    return date.format('DD MMM YYYY').toUpperCase();
  };

  const getButtonText = (): string => {
    if (value[0] && value[1]) {
      return `${formatDate(value[0])}-${formatDate(value[1])}`;
    } else if (value[0]) {
      return `${formatDate(value[0])}-PRESENT`;
    } else {
      return 'SELECT DATE RANGE';
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Reset temp values to current values when opening
    setTempStartDate(value[0]);
    setTempEndDate(value[1]);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange([tempStartDate, tempEndDate]);
    handleClose();
  };

  const handleClear = () => {
    onChange([null, null]);
    handleClose();
  };

  const handleQuickRange = (days: number) => {
    const endDate = dayjs().endOf('day');
    const startDate = dayjs()
      .subtract(days - 1, 'day')
      .startOf('day');
    onChange([startDate, endDate]);
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button
        ref={buttonRef}
        variant='outlined'
        onClick={handleOpen}
        startDecorator={<CalendarToday />}
        sx={{
          borderColor: '#ffffff',
          color: '#ffffff',
          backgroundColor: 'transparent',
          minWidth: '200px',
          justifyContent: 'flex-start',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: '#ffffff'
          },
          '& svg': { color: '#ffffff' }
        }}
      >
        <Typography sx={{ fontSize: '14px', color: '#ffffff' }}>{getButtonText()}</Typography>
      </Button>

      {value[0] || value[1] ? (
        <IconButton
          onClick={handleClear}
          size='sm'
          variant='outlined'
          sx={{
            color: '#ffffff',
            borderColor: '#ffffff',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: '#ffffff'
            },
            '& svg': {
              color: '#ffffff'
            }
          }}
          title='Clear date range'
        >
          <Clear />
        </IconButton>
      ) : null}

      <Menu
        anchorEl={buttonRef.current}
        open={isOpen}
        onClose={handleClose}
        placement='bottom-start'
        sx={{
          '& .MuiMenu-list': {
            backgroundColor: '#1a1a1a',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '300px'
          }
        }}
      >
        <Card sx={{ backgroundColor: '#1a1a1a', p: 2, border: 'none' }}>
          <Box sx={{ mb: 2 }}>
            <Typography level='body-sm' sx={{ color: '#ffffff', mb: 1, fontWeight: 'bold' }}>
              Select Date Range
            </Typography>

            {/* Quick Range Options */}
            <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
              <MenuItem
                onClick={() => handleQuickRange(1)}
                sx={{
                  backgroundColor: '#2d2d2d',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#444'
                  }
                }}
              >
                Today
              </MenuItem>
              <MenuItem
                onClick={() => handleQuickRange(7)}
                sx={{
                  backgroundColor: '#2d2d2d',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#444'
                  }
                }}
              >
                Last 7 Days
              </MenuItem>
              <MenuItem
                onClick={() => handleQuickRange(30)}
                sx={{
                  backgroundColor: '#2d2d2d',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#444'
                  }
                }}
              >
                Last 30 Days
              </MenuItem>
            </Box>

            {/* Custom Date Range */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography level='body-xs' sx={{ color: '#ffffff', mb: 1 }}>
                  Start Date
                </Typography>
                <Input
                  type='date'
                  value={tempStartDate ? tempStartDate.format('YYYY-MM-DD') : ''}
                  onChange={e => {
                    const newDate = e.target.value ? dayjs(e.target.value) : null;
                    setTempStartDate(newDate);
                  }}
                  sx={{
                    backgroundColor: '#2d2d2d',
                    color: '#ffffff',
                    '& input': {
                      color: '#ffffff',
                      backgroundColor: '#2d2d2d',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      fontSize: '14px'
                    },
                    '&:hover input': {
                      borderColor: '#666'
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography level='body-xs' sx={{ color: '#ffffff', mb: 1 }}>
                  End Date
                </Typography>
                <Input
                  type='date'
                  value={tempEndDate ? tempEndDate.format('YYYY-MM-DD') : ''}
                  onChange={e => {
                    const newDate = e.target.value ? dayjs(e.target.value) : null;
                    setTempEndDate(newDate);
                  }}
                  sx={{
                    backgroundColor: '#2d2d2d',
                    color: '#ffffff',
                    '& input': {
                      color: '#ffffff',
                      backgroundColor: '#2d2d2d',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      fontSize: '14px'
                    },
                    '&:hover input': {
                      borderColor: '#666'
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
              <Button
                size='sm'
                variant='plain'
                onClick={handleClose}
                sx={{
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                size='sm'
                onClick={handleApply}
                sx={{
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0'
                  }
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Card>
      </Menu>
    </Box>
  );
};

export default DateRangeDropdown;
