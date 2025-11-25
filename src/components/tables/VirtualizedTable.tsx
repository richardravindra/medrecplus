/**
 * Virtualized Table Component for Large Datasets
 *
 * This component uses react-window to efficiently render large datasets
 * (400K+ records) without performance issues by only rendering visible rows.
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { List } from 'react-window';
import { Box, Typography, CircularProgress, IconButton, Sheet } from '@mui/joy';
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
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  sortable?: boolean;
  dataType?: 'string' | 'number' | 'date';
  align?: 'left' | 'center' | 'right';
  minWidth?: string;
  maxWidth?: string;
}

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

    const filtered = data.filter(item => {
      return Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    setFilteredData(filtered);
  }, [data, searchQuery]);

  // Memoized click handler for rows
  const handleItemClick = useCallback(
    (item: T) => {
      if (onItemClick) {
        onItemClick(item);
      }
    },
    [onItemClick]
  );

  // Handle header click for sorting
  const handleHeaderClick = useCallback(
    (column: Column<T>) => {
      if (!column.sortable || !onSort) return;

      const newDirection = sortKey === column.key && sortDirection === 'desc' ? 'asc' : 'desc';
      onSort(column.key, newDirection);
    },
    [sortKey, sortDirection, onSort]
  );

  // Handle empty state
  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' height={height}>
        <CircularProgress size='lg' />
        <Typography level='body-lg' ml={2}>
          Loading data...
        </Typography>
      </Box>
    );
  }

  if (sortedData.length === 0) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' height={height}>
        <Typography level='body-lg' color='neutral'>
          {searchQuery ? 'No results found' : 'No data available'}
        </Typography>
      </Box>
    );
  }

  return (
    <Sheet
      variant='outlined'
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
              {columns.map(column => (
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
                      <IconButton size='sm' variant='plain' sx={{ color: '#ffffff' }}>
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
          overscanCount={5} // Render 5 extra rows above/below for smooth scrolling
        >
          {/* @ts-expect-error - react-window List children function type compatibility */}
          {({ index, style }: { index: number; style: React.CSSProperties }) => {
            const item = sortedData[index];

            return (
              <div style={style}>
                <tr
                  style={{
                    cursor: onItemClick ? 'pointer' : 'default',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onClick={() => handleItemClick(item)}
                >
                  {columns.map(column => (
                    <td
                      key={String(column.key)}
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#ffffff',
                        textAlign: column.align || 'left',
                        minWidth: column.minWidth || 'auto',
                        maxWidth: column.maxWidth || '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '')}
                    </td>
                  ))}
                </tr>
              </div>
            );
          }}
        </List>
      </Box>

      {/* Footer with stats */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        p={2}
        borderTop='1px solid'
        borderColor='divider'
      >
        <Typography level='body-sm' color='neutral'>
          Showing {sortedData.length.toLocaleString()} of {data.length.toLocaleString()} records
        </Typography>
        {searchQuery && (
          <Typography level='body-sm' color='neutral'>
            Filtered by: "{searchQuery}"
          </Typography>
        )}
      </Box>
    </Sheet>
  );
}

export default VirtualizedTable;

// Note: Column configurations are available in separate files:
// - appointmentColumns in './appointmentColumns'
// - invoiceColumns in './invoiceColumns'
