/**
 * Lazy Data Loading Hook
 *
 * This hook provides lazy loading capabilities for large datasets,
 * loading data incrementally instead of all at once.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataService } from '../services/DataService';

interface LazyDataOptions {
  pageSize?: number;
  initialLoadSize?: number;
  loadDelay?: number;
}

interface LazyDataResult<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  totalCount: number;
  loadedCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLazyData<T>(
  dataType: string,
  options: LazyDataOptions = {}
): LazyDataResult<T> {
  const {
    pageSize = 1000,        // Load 1000 records at a time
    initialLoadSize = 500,   // Load only 500 initially
    loadDelay = 100         // 100ms delay between loads
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);

  const loadingRef = useRef(false);
  const currentPageRef = useRef(0);

  const loadInitial = useCallback(async () => {
    if (loadingRef.current) return;

    console.log(`🚀 Starting lazy load for ${dataType} (initial: ${initialLoadSize})`);
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Get total count first if possible
      const allData = await DataService.getData(dataType) as T[];
      setTotalCount(allData.length);

      // Load only initial batch
      const initialBatch = allData.slice(0, initialLoadSize);
      setData(initialBatch);
      setLoadedCount(initialBatch.length);
      setHasMore(allData.length > initialLoadSize);

      console.log(`✅ Initial lazy load complete: ${initialBatch.length}/${allData.length} ${dataType}`);
    } catch (error) {
      console.error(`❌ Failed to load initial ${dataType}:`, error);
      setError(`Failed to load ${dataType}`);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [dataType, initialLoadSize]);

  // Load initial small batch
  useEffect(() => {
    loadInitial();
  }, [dataType, initialLoadSize, loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    console.log(`📖 Loading more ${dataType} (current: ${data.length}, page: ${currentPageRef.current + 1})`);
    loadingRef.current = true;
    setLoading(true);

    try {
      // Add small delay for UI responsiveness
      await new Promise(resolve => setTimeout(resolve, loadDelay));

      const allData = await DataService.getData(dataType) as T[];
      const startIndex = data.length;
      const endIndex = Math.min(startIndex + pageSize, allData.length);

      const nextBatch = allData.slice(startIndex, endIndex);

      setData(prev => [...prev, ...nextBatch]);
      setLoadedCount(prev => prev + nextBatch.length);
      setHasMore(endIndex < allData.length);
      currentPageRef.current += 1;

      console.log(`✅ Load more complete: ${data.length + nextBatch.length}/${allData.length} ${dataType}`);
    } catch (error) {
      console.error(`❌ Failed to load more ${dataType}:`, error);
      setError(`Failed to load more ${dataType}`);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [data.length, hasMore, pageSize, loadDelay, dataType]);

  const refresh = useCallback(async () => {
    console.log(`🔄 Refreshing ${dataType} data...`);
    setData([]);
    setLoadedCount(0);
    setHasMore(true);
    currentPageRef.current = 0;
    loadingRef.current = false;

    await loadInitial();
  }, [dataType, loadInitial]);

  return {
    data,
    loading,
    hasMore,
    error,
    totalCount,
    loadedCount,
    loadMore,
    refresh
  };
}

/**
 * Hook for search with lazy loading
 */
export function useLazySearch<T>(
  dataType: string,
  searchFn: (query: string, data: T[]) => T[],
  options: LazyDataOptions = {}
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { data, loading, hasMore, error, totalCount, loadedCount, loadMore, refresh } = useLazyData<T>(dataType, options);

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(data);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const startTime = performance.now();

        // For search, we need to load the full dataset to get accurate results
        console.log('🔍 Loading full dataset for search...');
        const fullData = await DataService.getData(dataType) as T[];
        console.log(`📊 Loaded ${fullData.length} total records for search`);

        const results = searchFn(searchQuery, fullData);
        const endTime = performance.now();

        console.log(`🔍 Full search completed: ${fullData.length} → ${results.length} in ${(endTime - startTime).toFixed(2)}ms`);
        setSearchResults(results);
      } catch (error) {
        console.error('❌ Search failed:', error);
        setSearchError('Search failed');
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, data, searchFn, dataType]);

  return {
    data: searchQuery ? searchResults : data,
    loading: loading || isSearching,
    hasMore,
    error: error || searchError,
    totalCount,
    loadedCount,
    searchQuery,
    setSearchQuery,
    loadMore,
    refresh
  };
}