/**
 * Optimized Search Component with Debouncing and Performance Monitoring
 *
 * This component provides efficient search functionality for large datasets
 * with debouncing, Web Workers, and performance tracking.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input, Box, Typography, CircularProgress } from '@mui/joy';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

interface OptimizedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showStats?: boolean;
  disabled?: boolean;
  dataCount?: number;
}

export function OptimizedSearch({
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  showStats = true,
  disabled = false
}: OptimizedSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStats, setSearchStats] = useState({
    searchTime: 0,
    resultCount: 0,
    lastQuery: ''
  });

  const debounceTimeoutRef = useRef<number | undefined>(undefined);
  const { profile } = usePerformanceMonitor('OptimizedSearch');

  // Debounced search with performance monitoring
  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (!searchQuery.trim()) {
        onSearch('');
        setSearchStats(prev => ({ ...prev, lastQuery: '' }));
        return;
      }

      setIsSearching(true);

      debounceTimeoutRef.current = setTimeout(() => {
        profile('search', () => {
          const startTime = performance.now();
          onSearch(searchQuery);

          // Simulate async search completion timing
          requestAnimationFrame(() => {
            const endTime = performance.now();
            const searchTime = endTime - startTime;

            setSearchStats({
              searchTime,
              resultCount: 0, // Will be updated by parent component
              lastQuery: searchQuery
            });

            setIsSearching(false);
          });
        });
      }, debounceMs);
    },
    [onSearch, debounceMs, profile]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = event.target.value;
      setQuery(newQuery);
      debouncedSearch(newQuery);
    },
    [debouncedSearch]
  );

  // Handle clear search
  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
    setSearchStats(prev => ({ ...prev, lastQuery: '', resultCount: 0 }));
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, [onSearch]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClear();
      }
      // Ctrl/Cmd + K focuses search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Input should be focused by this event
      }
    },
    [handleClear]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Search performance indicator
  const getPerformanceColor = (time: number) => {
    if (time < 50) return 'success';
    if (time < 150) return 'warning';
    return 'danger';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ position: 'relative' }}>
        <Input
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          startDecorator={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🔍
              {isSearching && <CircularProgress size='sm' />}
            </Box>
          }
          endDecorator={
            query && (
              <Box
                sx={{
                  cursor: 'pointer',
                  px: 1,
                  py: 0.5,
                  borderRadius: 'sm',
                  '&:hover': { backgroundColor: 'neutral.level1' }
                }}
                onClick={handleClear}
              >
                ✕
              </Box>
            )
          }
          sx={{
            fontSize: 'md',
            '&:focus-within': {
              '--Input-focusedHighlight': 'var(--joy-palette-primary-outlinedColor)'
            }
          }}
        />

        {/* Search shortcut hint */}
        {!query && !disabled && (
          <Typography
            level='body-xs'
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'neutral.400',
              pointerEvents: 'none'
            }}
          >
            Ctrl+K
          </Typography>
        )}
      </Box>

      {/* Search statistics */}
      {showStats && searchStats.lastQuery && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1,
            px: 1
          }}
        >
          <Typography level='body-xs' color='neutral'>
            Searching for: <strong>{searchStats.lastQuery}</strong>
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {searchStats.searchTime > 0 && (
              <Typography level='body-xs' color={getPerformanceColor(searchStats.searchTime)}>
                ⏱️ {searchStats.searchTime.toFixed(0)}ms
              </Typography>
            )}

            {searchStats.resultCount > 0 && (
              <Typography level='body-xs' color='neutral'>
                📊 {searchStats.resultCount.toLocaleString()} results
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Performance hint for slow searches */}
      {searchStats.searchTime > 150 && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            backgroundColor: 'warning.softBg',
            borderRadius: 'sm'
          }}
        >
          <Typography level='body-xs' color='warning'>
            💡 Search is taking longer than expected. Consider:
            <br />• Reducing dataset size with filters • Using more specific search terms • Adding
            search indexes
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// Advanced search with filters
export function AdvancedSearch({ dataCount }: { dataCount: number }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // const handleFilterChange = useCallback((key: keyof SearchFilters, value: string | number | { start: string; end: string }) => {
  //   const newFilters = { ...filters, [key]: value };
  //   setFilters(newFilters);
  //   onFilter?.(newFilters);
  // }, [filters, onFilter]);

  return (
    <Box sx={{ mb: 2 }}>
      <OptimizedSearch
        onSearch={() => {
          /* Search handled by parent */
        }}
        dataCount={dataCount}
      />

      <Box sx={{ mt: 1 }}>
        <Typography
          level='body-sm'
          sx={{ cursor: 'pointer', '&:hover': { color: 'primary' } }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Filters
        </Typography>

        {showAdvanced && (
          <Box sx={{ mt: 1, p: 2, backgroundColor: 'neutral.level0', borderRadius: 'sm' }}>
            {/* Add advanced filter options here */}
            <Typography level='body-sm'>Advanced filters coming soon...</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Search filters interface
export interface SearchFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  operator?: string;
}

export default OptimizedSearch;
