import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { useVirtualScrolling } from '../hooks/usePerformanceOptimization';

export interface VirtualizedTableColumn<T = Record<string, unknown>> {
  id: keyof T;
  label: string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown) => string | React.ReactNode;
}

export interface VirtualizedTableProps<T = Record<string, unknown>> {
  data: readonly T[];
  columns: VirtualizedTableColumn<T>[];
  itemHeight?: number;
  containerHeight?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function VirtualizedTable<T extends Record<string, unknown>>({
  data,
  columns,
  itemHeight = 60,
  containerHeight = 400,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false
}: VirtualizedTableProps<T>) {
  const { visibleItems, scrollElementProps, totalHeight } = useVirtualScrolling(
    data,
    itemHeight,
    containerHeight
  );

  const columnWidths = useMemo(() => {
    return columns.map(col => ({
      ...col,
      width: col.minWidth || 150
    }));
  }, [columns]);

  const tableWidth = useMemo(() => {
    return columnWidths.reduce((sum, col) => sum + (col.width || 150), 0);
  }, [columnWidths]);

  const renderCellContent = useCallback((row: T, column: VirtualizedTableColumn<T>) => {
    const value = row[column.id];
    return column.format ? column.format(value) : value?.toString() || '';
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: containerHeight
        }}
      >
        Loading...
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: containerHeight
        }}
      >
        {emptyMessage}
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer {...scrollElementProps}>
        <Table stickyHeader aria-label='virtualized table' sx={{ minWidth: tableWidth }}>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell
                  key={column.id as string}
                  align={column.align || 'left'}
                  style={{
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                    width: column.minWidth || 150
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Spacer element to maintain scroll height */}
            <TableRow>
              <TableCell
                colSpan={columns.length}
                sx={{
                  padding: 0,
                  height: visibleItems.offsetY,
                  border: 'none'
                }}
              />
            </TableRow>

            {/* Visible rows */}
            {visibleItems.items.map((row, index) => (
              <TableRow
                hover
                role='checkbox'
                tabIndex={-1}
                key={`${row.id || index}-${visibleItems.startIndex + index}`}
                onClick={() => onRowClick?.(row)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  height: itemHeight
                }}
              >
                {columns.map(column => (
                  <TableCell
                    key={column.id as string}
                    align={column.align || 'left'}
                    sx={{
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {renderCellContent(row, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Bottom spacer to maintain scroll height */}
            <TableRow>
              <TableCell
                colSpan={columns.length}
                sx={{
                  padding: 0,
                  height:
                    totalHeight - visibleItems.offsetY - visibleItems.items.length * itemHeight,
                  border: 'none'
                }}
              />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
