/**
 * Virtualized Table Component for Large Datasets
 *
 * This component uses react-window to efficiently render large datasets
 * (400K+ records) without performance issues by only rendering visible rows.
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Sheet
} from '@mui/joy';
import { Appointment, Invoice } from '../../types';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  height?: number;
  rowHeight?: number;
  onItemClick?: (item: T) => void;
  searchQuery?: string;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
}

export interface Column<T> {
  key: keyof T;
  label: string;
  width: number;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  dataType?: 'string' | 'number' | 'date';
}

// Row component for virtualization
const Row = React.memo(({
  index,
  style,
  data
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    columns: Column<any>[];
    onItemClick?: (item: any) => void;
  }
}) => {
  const item = data.items[index];

  const handleClick = useCallback(() => {
    if (data.onItemClick) {
      data.onItemClick(item);
    }
  }, [item, data.onItemClick]);

  return (
    <div style={style}>
      <tr
        style={{
          cursor: data.onItemClick ? 'pointer' : 'default'
        }}
        onClick={handleClick}
      >
        {data.columns.map((column) => (
          <td
            key={`${String(column.key)}-${item.id || index}`}
            style={{
              width: column.width,
              minWidth: column.width,
              maxWidth: column.width,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {column.render
              ? column.render(item[column.key], item)
              : String(item[column.key] || '')
            }
          </td>
        ))}
      </tr>
    </div>
  );
});

Row.displayName = 'VirtualizedRow';

export function VirtualizedTable<T extends { id?: number | string }>({
  data,
  columns,
  loading = false,
  height = 600,
  rowHeight = 60,
  onItemClick,
  searchQuery = '',
  sortKey,
  sortDirection,
  onSort
}: VirtualizedTableProps<T>) {
  const [filteredData, setFilteredData] = useState<T[]>(data);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      
      // Handle different data types
      if (aValue === undefined || bValue === undefined) return 0;
      
      const column = columns.find(col => col.key === sortKey);
      const dataType = column?.dataType || 'string';
      
      let comparison = 0;
      
      switch (dataType) {
        case 'number':
          comparison = (Number(aValue) || 0) - (Number(bValue) || 0);
          break;
        case 'date':
          comparison = new Date(String(aValue)).getTime() - new Date(String(bValue)).getTime();
          break;
        default:
          comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Efficient filtering with memoization
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }

    const startTime = performance.now();

    const filtered = data.filter(item => {
      return Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    const endTime = performance.now();
    console.log(`🔍 Filtered ${data.length} items to ${filtered.length} in ${(endTime - startTime).toFixed(2)}ms`);

    setFilteredData(filtered);
  }, [data, searchQuery]);

  // Memoize row data to prevent unnecessary re-renders
  const rowData = useMemo(() => ({
    items: sortedData,
    columns,
    onItemClick
  }), [sortedData, columns, onItemClick]);

  // Handle header click for sorting
  const handleHeaderClick = useCallback((column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    
    const newDirection = sortKey === column.key && sortDirection === 'desc' ? 'asc' : 'desc';
    onSort(column.key, newDirection);
  }, [sortKey, sortDirection, onSort]);

  // Handle empty state
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
      >
        <CircularProgress size="lg" />
        <Typography level="body-lg" ml={2}>
          Loading data...
        </Typography>
      </Box>
    );
  }

  if (sortedData.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
      >
        <Typography level="body-lg" color="neutral">
          {searchQuery ? 'No results found' : 'No data available'}
        </Typography>
      </Box>
    );
  }

  return (
    <Sheet
      variant="outlined"
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.surface'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: '#1d293d',
          padding: '12px'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  style={{
                    width: column.width,
                    minWidth: column.width,
                    maxWidth: column.width,
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                  onClick={() => handleHeaderClick(column)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {column.label}
                    {column.sortable && sortKey === column.key && (
                      <IconButton size="sm" variant="plain" sx={{ color: '#ffffff' }}>
                        {sortDirection === 'asc' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    )}
                  </Box>
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </Box>

      {/* Virtualized Body */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <List
          height={height - 60}
          itemCount={sortedData.length}
          itemSize={rowHeight}
          itemData={rowData}
          overscanCount={5} // Render 5 extra rows above/below for smooth scrolling
        >
          {Row}
        </List>
      </Box>

      {/* Footer with stats */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        borderTop="1px solid"
        borderColor="divider"
      >
        <Typography level="body-sm" color="neutral">
          Showing {sortedData.length.toLocaleString()} of {data.length.toLocaleString()} records
        </Typography>
        {searchQuery && (
          <Typography level="body-sm" color="neutral">
            Filtered by: "{searchQuery}"
          </Typography>
        )}
      </Box>
    </Sheet>
  );
}

// Appointment-specific columns
export const appointmentColumns: Column<Appointment>[] = [
  {
    key: 'date',
    label: 'Date & Time',
    width: 180,
    render: (value: string) => {
      try {
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return value;
      }
    }
  },
  {
    key: 'patientName',
    label: 'Patient',
    width: 200,
    render: (value: string) => (
      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Box>
    )
  },
  {
    key: 'totalPrice',
    label: 'Total Price',
    width: 120,
    render: (value: number) => (
      <Typography fontWeight="medium">
        Rp {value?.toLocaleString('id-ID') || '0'}
      </Typography>
    )
  },
  {
    key: 'operatorName',
    label: 'Operator',
    width: 200,
    render: (value: string) => (
      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Box>
    )
  },
  {
    key: 'treatments',
    label: 'Treatments',
    width: 250,
    render: (value: any[]) => (
      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value?.slice(0, 2).map((t: any) => t.name).join(', ')}
        {value?.length > 2 && ` (+${value.length - 2})`}
      </Box>
    )
  }
];

// Invoice-specific columns
export const invoiceColumns: Column<Invoice>[] = [
  {
    key: 'invoiceNumber',
    label: 'Invoice #',
    width: 150
  },
  {
    key: 'patientName',
    label: 'Patient',
    width: 180
  },
  {
    key: 'date',
    label: 'Date & Time',
    width: 160,
    sortable: true,
    dataType: 'date',
    render: (value: string) => {
      try {
        const date = new Date(value);
        return date.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } catch {
        return value;
      }
    }
  },
  {
    key: 'operatorName',
    label: 'Operator',
    width: 180
  },
  {
    key: 'totalAmount',
    label: 'Total Amount',
    width: 120,
    render: (value: number) => (
      <Typography fontWeight="medium">
        Rp {value?.toLocaleString('id-ID') || '0'}
      </Typography>
    )
  },
  {
    key: 'status',
    label: 'Status',
    width: 100,
    render: (value: string) => (
      <Box
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 'sm',
          backgroundColor: value === 'paid' ? 'success.softBg' :
                           value === 'pending' ? 'warning.softBg' :
                           value === 'void' ? 'danger.softBg' : 'neutral.softBg',
          color: value === 'paid' ? 'success.softColor' :
                 value === 'pending' ? 'warning.softColor' :
                 value === 'void' ? 'danger.softColor' : 'neutral.softColor',
          fontSize: 'sm',
          fontWeight: 'medium',
          textAlign: 'center'
        }}
      >
        {value?.charAt(0).toUpperCase() + value?.slice(1)}
      </Box>
    )
  }
];

export default VirtualizedTable;
