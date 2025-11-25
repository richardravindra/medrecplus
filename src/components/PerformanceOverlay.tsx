import React, { useState, useEffect } from 'react';
import { useGlobalPerformance } from '../hooks/usePerformanceMonitor';

export const PerformanceOverlay: React.FC = () => {
  const { isMonitoring, getGlobalStats, optimizeAll } = useGlobalPerformance();
  const [stats, setStats] = useState<ReturnType<typeof getGlobalStats> | null>(null);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setStats(getGlobalStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, getGlobalStats]);

  if (!isMonitoring || !stats || import.meta.env.MODE === 'production') {
    return null; // Disable performance overlay in production or when not monitoring
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#00ff00',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        minWidth: '200px'
      }}
    >
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Performance Monitor</div>
      <div>
        Memory: {(stats.memoryUsage.used / 1024 / 1024).toFixed(1)}MB (
        {stats.memoryUsage.percentage.toFixed(1)}%)
      </div>
      <div>Caches: {(stats.totalCachesSize / 1024 / 1024).toFixed(1)}MB</div>
      <div>
        {Object.entries(stats.caches).map(
          ([name, info]: [string, { items: number; size: number }]) => (
            <div key={name} style={{ marginLeft: '10px' }}>
              {name}: {info.items} items
            </div>
          )
        )}
      </div>
      <button
        onClick={optimizeAll}
        style={{
          marginTop: '5px',
          padding: '2px 5px',
          background: '#333',
          color: '#00ff00',
          border: '1px solid #00ff00',
          borderRadius: '3px',
          fontSize: '10px',
          cursor: 'pointer'
        }}
      >
        Optimize
      </button>
    </div>
  );
};
