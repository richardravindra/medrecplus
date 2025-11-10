# Performance Optimization Guide for MedRecPlus

This guide explains the performance optimizations implemented for your Tauri medical records application to improve memory usage, data loading, and overall performance on desktop platforms.

## 🚀 Implemented Optimizations

### 1. Lazy Data Loading
- **Pagination**: Load patient data in pages instead of all at once
- **Smart Caching**: Cache frequently accessed data with TTL (Time To Live)
- **Preloading**: Automatically preload commonly accessed data
- **Search Optimization**: Efficient search with indexed queries

### 2. Component Lazy Loading
- **Chart Components**: Heavy recharts components load on-demand
- **Table Components**: Large tables with lazy rendering
- **Suspense Boundaries**: Loading states for better UX

### 3. Database Optimization
- **IndexedDB Storage**: Enhanced storage with proper indexing
- **Query Optimization**: Indexed queries for faster data retrieval
- **Batch Operations**: Efficient batch read/write operations
- **Connection Pooling**: Optimized database connections

### 4. Memory Management
- **Smart Caching**: LRU (Least Recently Used) cache eviction
- **Memory Monitoring**: Real-time memory usage tracking
- **Automatic Cleanup**: Periodic cleanup of unused data
- **Garbage Collection**: Automatic memory optimization

## 📁 New Files Created

### Core Services
- `src/services/OptimizedDataService.tsx` - Enhanced data service with caching and lazy loading
- `src/services/optimizedDatabaseMock.ts` - Optimized database service with pagination

### Storage & Database
- `src/utils/OptimizedIndexedDBStorage.tsx` - IndexedDB with indexing and optimization
- `src/utils/MemoryManager.tsx` - Memory management and caching system

### Components
- `src/components/charts/LazyLineChart.tsx` - Lazy-loaded chart component
- `src/components/tables/LazyPatientTable.tsx` - Lazy-loaded table component
- `src/components/PerformanceOptimizer.tsx` - Performance optimization orchestrator

### Hooks & Monitoring
- `src/hooks/usePerformanceMonitor.ts` - Performance monitoring hook
- `src/pages/OptimizedPatientList.tsx` - Optimized patient list component

## 🔧 Integration Guide

### 1. Basic Integration

Add the performance optimizer to your main App component:

```tsx
import { PerformanceProvider } from './hooks/usePerformanceMonitor';
import { PerformanceOptimizer } from './components/PerformanceOptimizer';

function App() {
  return (
    <PerformanceProvider>
      <PerformanceOptimizer>
        {/* Your existing app content */}
      </PerformanceOptimizer>
    </PerformanceProvider>
  );
}
```

### 2. Replace Patient List

Replace the existing PatientList with the optimized version:

```tsx
// In your routing configuration
import OptimizedPatientList from './pages/OptimizedPatientList';

// Replace:
<Route path="patients" element={<PatientList />} />
// With:
<Route path="patients" element={<OptimizedPatientList />} />
```

### 3. Use Lazy-Loaded Components

Replace heavy components with lazy-loaded versions:

```tsx
import { LazyLineChart } from './components/charts/LazyLineChart';
import { LazyPatientTable } from './components/tables/LazyPatientTable';

// Instead of regular LineChart and Table components
<LazyLineChart data={data} dataKey="value" stroke="#1976d2" />
<LazyPatientTable patients={patients} {...props} />
```

### 4. Use Optimized Database Service

Replace database service calls:

```tsx
import { optimizedDatabaseService } from './services/optimizedDatabaseMock';

// Instead of:
const patients = await databaseService.getPatients();

// Use:
const { patients, total, hasMore } = await optimizedDatabaseService.getPatients(1, 10, search);
```

## ⚙️ Configuration

### Memory Management Configuration

```tsx
import { MemoryManager } from './utils/MemoryManager';

// Configure custom cache settings
MemoryManager.configureCache('custom_data', {
  ttl: 15 * 60 * 1000,        // 15 minutes
  maxSize: 20 * 1024 * 1024,   // 20MB
  maxItems: 1000,              // 1000 items
  cleanupInterval: 60000       // 1 minute
});
```

### Performance Optimizer Configuration

```tsx
<PerformanceOptimizer
  config={{
    enableMemoryMonitoring: true,
    enableDatabaseOptimization: true,
    enableLazyLoading: true,
    memoryLimitMB: 100,           // 100MB memory limit
    cleanupIntervalMs: 60000      // 1 minute cleanup interval
  }}
  onOptimizationComplete={(status) => {
    console.log('Optimization completed:', status);
  }}
/>
```

## 📊 Performance Monitoring

### Component-Level Monitoring

```tsx
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';

function MyComponent() {
  const { stats, optimizeMemory, getDetailedStats } = usePerformanceMonitor('MyComponent');

  useEffect(() => {
    // Component will automatically monitor render performance
    if (stats.averageRenderTime > 100) {
      console.warn('Slow render detected');
    }
  }, [stats]);

  return <div>My Component</div>;
}
```

### Global Performance Monitoring

```tsx
import { useGlobalPerformance } from './hooks/usePerformanceMonitor';

function PerformanceDashboard() {
  const { isMonitoring, startMonitoring, getGlobalStats, optimizeAll } = useGlobalPerformance();

  return (
    <div>
      <button onClick={startMonitoring}>Start Monitoring</button>
      <button onClick={optimizeAll}>Optimize All</button>
      {/* Display performance stats */}
    </div>
  );
}
```

## 🎯 Best Practices

### 1. Memory Management
- Clear caches when data is no longer needed
- Monitor memory usage regularly
- Set appropriate TTL for cached data
- Use pagination for large datasets

### 2. Database Optimization
- Use indexed queries for frequent searches
- Batch operations when possible
- Preload commonly accessed data
- Clean up old data periodically

### 3. Component Optimization
- Use lazy loading for heavy components
- Implement proper loading states
- Monitor component render times
- Use memoization for expensive calculations

## 🔍 Development Tools

### Performance Overlay (Development Only)

In development mode, you'll see performance overlays showing:
- Memory usage
- Cache sizes
- Render performance
- Optimization controls

### Memory Statistics

```tsx
import { MemoryManager } from './utils/MemoryManager';

// Get detailed memory statistics
const stats = MemoryManager.getMemoryStats();
console.log('Memory Stats:', stats);

// Export/import cache for debugging
const cacheData = MemoryManager.exportCache('patients');
MemoryManager.importCache(cacheData);
```

## 📈 Expected Performance Improvements

### Memory Usage
- **Before**: 100-150MB+ with large datasets
- **After**: 50-80MB with intelligent caching

### Data Loading
- **Before**: Load all patients at once (slow with large datasets)
- **After**: Paginated loading (fast initial load)

### Search Performance
- **Before**: Linear search through all data
- **After**: Indexed queries with caching

### Component Rendering
- **Before**: All components render immediately
- **After**: Lazy loading with suspense boundaries

## 🚨 Troubleshooting

### High Memory Usage
1. Check cache sizes: `MemoryManager.getMemoryStats()`
2. Force cleanup: `MemoryManager.forceCleanup()`
3. Reduce cache TTL or size limits
4. Clear unused caches: `MemoryManager.clearCache('cache_name')`

### Slow Data Loading
1. Check if lazy loading is enabled
2. Verify pagination is working
3. Monitor database queries
4. Check for memory leaks

### Performance Issues
1. Enable performance monitoring
2. Check component render times
3. Optimize expensive calculations
4. Use memoization where appropriate

## 🔄 Migration Steps

### Step 1: Add Performance Optimizer
```bash
# Add the performance optimizer to your main App component
# (See Integration Guide above)
```

### Step 2: Replace Database Service
```bash
# Update imports from databaseMock to optimizedDatabaseMock
# Update service calls to use pagination
```

### Step 3: Update Components
```bash
# Replace heavy components with lazy-loaded versions
# Add performance monitoring where needed
```

### Step 4: Test and Monitor
```bash
# Test with large datasets
# Monitor memory usage
# Check performance improvements
```

## 📚 Additional Resources

- [Tauri Performance Guide](https://tauri.app/v1/guides/performance/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit#optimizing-performance)
- [IndexedDB Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria)

## 🤝 Contributing

When adding new features:
1. Use the optimized data services
2. Add performance monitoring for new components
3. Test with large datasets
4. Document memory usage patterns

---

**Note**: These optimizations are specifically designed for Tauri desktop applications where memory management and local storage performance are critical. For web deployment, some optimizations may need adjustment.