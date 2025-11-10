# Enhanced Data Restore System

## Overview

The Enhanced Data Restore System is designed to handle large datasets (100,000+ records) that the standard restore system cannot process due to browser and localStorage limitations.

## Key Features

### 🚀 **Chunked Data Processing**
- Processes large JSON files in 1MB chunks
- Prevents browser memory overflow
- Progressive loading with real-time progress tracking

### 💾 **Smart Storage Management**
- Automatically splits data across multiple localStorage keys when needed
- Each chunk limited to ~1000 records
- Handles localStorage 5MB per key limitation

### 📊 **Progress Tracking**
- Real-time progress indicators during restore
- Stage-by-stage processing (Reading → Parsing → Storing)
- Error handling with detailed feedback

### 🔍 **Large File Support**
- Supports files up to 500MB
- Handles 100,000+ records efficiently
- Maintains data integrity during chunked processing

## Usage Instructions

### Accessing Enhanced Restore

1. Navigate to **Settings → Backup & Restore**
2. Look for the "🚀 Enhanced Restore (Large Files)" button
3. Click to open the enhanced restore dialog

### Supported File Sizes

| File Size | Records | Recommended Method |
|-----------|---------|-------------------|
| < 1MB | < 1,000 | Standard Restore |
| 1-10MB | 1,000-10,000 | Enhanced Restore |
| 10-100MB | 10,000-100,000 | Enhanced Restore |
| 100-500MB | 100,000+ | Enhanced Restore |

### Step-by-Step Process

1. **File Selection**
   - Click "Select Backup File"
   - Choose your JSON backup file
   - System validates file size and format

2. **Restore Process**
   - Click "Start Restore"
   - Monitor progress through stages:
     - Reading file (chunk by chunk)
     - Processing data types (operators → treatments → patients → appointments → invoices)
     - Saving to chunked storage
     - Finalizing restore

3. **Completion**
   - Automatic page reload
   - Data fully restored and available

## Technical Implementation

### Chunked Storage Strategy

When data exceeds localStorage limits, the system:
- Splits data into chunks of ~1000 records each
- Stores each chunk in separate localStorage keys (`data_chunk_0`, `data_chunk_1`, etc.)
- Maintains index (`data_chunk_count`) for reconstruction
- Automatically reassembles data when retrieved

### File Processing Algorithm

```javascript
1. Read file in 1MB chunks
2. Parse JSON progressively
3. Validate data structure
4. Process each data type separately
5. Store in chunks if needed
6. Reconstruct on retrieval
```

### Memory Management

- **File Reading**: 1MB chunks to prevent memory overflow
- **Data Processing**: Process one data type at a time
- **Storage**: Automatic chunking to respect localStorage limits
- **UI Updates**: Non-blocking processing with setTimeout delays

## Testing Files Available

For testing purposes, the following mock data files are available:

| File | Size | Records | Purpose |
|------|------|---------|---------|
| `test_backup.json` | 2.7KB | 9 entries | Basic functionality test |
| `mock_final.json` | 26KB | 40 entries | Small dataset test |
| `mock_medium_100.json` | 198KB | 2,180 entries | Medium dataset test |
| `mock_medium_500.json` | 998KB | 10,900 entries | Large dataset test |
| `mock_medium_1000.json` | 2MB | 21,810 entries | Very large dataset test |
| `mock_small.json` | 22MB | 26,070 entries | Stress test |
| `mock.json` | 217MB | 260,220 entries | Extreme stress test |

## API Integration

### ChunkedDataManager Usage

```javascript
import { ChunkedDataManager } from '../utils/ChunkedDataManager';

// Get patients with pagination
const { patients, totalCount, totalPages } = ChunkedDataManager.getPatients('search term', 1, 50);

// Get appointments by patient
const appointments = ChunkedDataManager.getAppointmentsByPatientId(patientId);

// Get statistics
const stats = ChunkedDataManager.getStatistics();
```

### Enhanced Restore Usage

```javascript
import { ChunkedDataRestore } from '../utils/ChunkedDataRestore';

// Check if file can be handled
const canHandle = ChunkedDataRestore.canHandleFileSize(file.size);

// Restore with progress tracking
await ChunkedDataRestore.restoreFromLargeFile(file, (progress) => {
  console.log(`${progress.stage}: ${progress.current}`);
});
```

## Performance Optimizations

### Memory Efficiency
- Streaming file reading
- Chunked JSON parsing
- Progressive data processing
- Automatic garbage collection

### Storage Efficiency
- Compressed data storage
- Intelligent chunk sizing
- Automatic cleanup of old chunks
- Storage usage monitoring

### UI Performance
- Non-blocking processing
- Real-time progress updates
- Responsive design during restore
- Graceful error handling

## Troubleshooting

### Common Issues

1. **File too large error**
   - Ensure file is under 500MB
   - Check available browser memory
   - Try closing other tabs

2. **Restore failure mid-process**
   - Check browser console for errors
   - Ensure sufficient storage space
   - Try with a smaller test file first

3. **Data missing after restore**
   - Verify chunk indices exist
   - Check localStorage capacity
   - Use ChunkedDataManager.getData() to verify

### Performance Tips

- **For testing**: Start with `mock_medium_100.json` (198KB)
- **For production**: Use files under 100MB for best performance
- **Memory**: Close unnecessary browser tabs
- **Storage**: Clear browser cache if needed

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Tauri (Desktop app)

## Limitations

- **Maximum file size**: 500MB
- **Maximum records**: ~500,000 (depends on data complexity)
- **Browser memory**: Requires sufficient available memory
- **localStorage**: Limited by browser storage quotas

## Future Enhancements

- [ ] Web Workers for background processing
- [ ] IndexedDB integration for larger storage
- [ ] Delta updates for incremental restores
- [ ] Cloud storage integration
- [ ] Data compression algorithms