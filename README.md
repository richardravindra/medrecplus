# MedRecPlus - Comprehensive Patient Management System

A modern offline cross-platform medical records management application built with Tauri, React, Vite, and Joy UI for complete healthcare practice management. Features performance-optimized data handling and comprehensive settings management. Available for Windows, Linux, and Android.

## Features

### Core Patient Management
- **🏥 Complete Patient Records**: Full CRUD operations for comprehensive patient data
- **📋 Smart Record Numbers**: Auto-generated patient IDs (PT202500001 format)
- **🔍 Advanced Search**: Real-time optimized search across all patient data
- **📱 Responsive Design**: Modern UI built with Joy UI components
- **💾 Data Storage**: Unified storage system with performance optimization
- **⚡ Performance**: Virtualized tables and lazy loading for large datasets

### Appointments & Scheduling
- **📅 Optimized Appointment Management**: Schedule and manage patient appointments with performance optimization
- **🔄 Appointment Details**: Track appointment status and patient information
- **📊 Vital Signs Recording**: Comprehensive vital signs capture including custom examinations
- **💰 Treatment Integration**: Direct treatment selection and pricing during appointments

### Treatments & Medical Records
- **💊 Treatment Management**: Create, edit, and manage treatment plans with pricing
- **📋 Treatment History**: Complete treatment and examination records
- **🔬 Custom Examinations**: Configurable medical examination types with units
- **📈 Performance Tracking**: Monitor treatment effectiveness over time

### Financial Management
- **💰 Optimized Invoicing System**: Generate and manage patient invoices with sorting and filtering
- **📈 Revenue Tracking**: Monitor financial performance with interactive charts
- **🧾 Receipt Management**: Generate professional receipts with customizable headers and footers
- **💱 Multi-Currency Support**: Configurable currency settings with real-time formatting

### Reporting & Analytics
- **📊 Performance Dashboard**: Comprehensive overview with lazy-loaded charts and statistics
- **📈 Monthly Reports**: Track patient growth, appointments, and revenue trends
- **📋 Activity Logs**: Complete audit trail of all system activities with filtering
- **📊 Data Visualization**: Interactive charts using Recharts with lazy loading

### System Configuration
- **⚙️ Comprehensive Settings Panel**: Full system configuration with multiple setting categories
- **👤 Operator Management**: User and role management
- **💾 Backup & Restore**: Enhanced data backup and recovery with validation
- **🔐 Security Settings**: Password protection, encryption setup, and session management
- **💱 Currency Configuration**: Multi-currency support with symbol and locale settings
- **🧾 Receipt Customization**: Configure receipt headers, footers, and business information
- **🔬 Custom Examinations**: Define custom medical examination types and units
- **💊 Treatment Management**: Configure treatment options and pricing
- **📊 Activity Monitoring**: Track system usage and access logs

### Navigation & UX
- **🎯 Clean Interface**: Intuitive navigation sidebar with collapsible menu and animations
- **📱 Responsive Design**: Modern mobile-first responsive design with adaptive layouts
- **🔄 Seamless Navigation**: Smooth transitions and breadcrumb navigation
- **⚡ Performance Optimized**: Virtualized tables, lazy loading, and optimized rendering
- **🎨 Modern UI**: Edge-to-edge design with Joy UI components and animations

## Tech Stack

### Frontend
- **React 19.1** - Latest React with hooks and TypeScript
- **Vite 7.1** - Ultra-fast build tool and development server
- **Joy UI 5.0** - Beautiful, accessible React components
- **Material-UI (MUI) 7.3** - Comprehensive React component library
- **React Router 7.9** - Modern client-side routing
- **TypeScript 5.9** - Type-safe development
- **TanStack React Table 8.21** - Powerful data table functionality with virtualization
- **Recharts 3.3** - Interactive charts and data visualization
- **DayJS 1.11** - Lightweight date manipulation library
- **XLSX 0.18** - Excel file export functionality
- **Chrono 1.0** - Natural language date parsing

### Backend
- **Tauri 2.0** - Build cross-platform apps (desktop & mobile) with web tech
- **Rust 2021 Edition** - Systems programming language for backend
- **SQLite 0.31** - Self-contained, serverless database with bundled features
- **Chrono 0.4** - Comprehensive date and time handling
- **Tokio** - Asynchronous runtime for Rust
- **Serde** - Serialization framework for Rust

## Application Structure

```
medrecplus/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── MainLayout.tsx        # Main app layout with sidebar
│   │   │   ├── Header.tsx             # Header with breadcrumbs
│   │   │   └── Sidebar.tsx           # Navigation sidebar with animations
│   │   ├── tables/
│   │   │   ├── VirtualizedTable.tsx  # Virtualized table component
│   │   │   ├── LazyPatientTable.tsx  # Lazy-loaded patient table
│   │   │   ├── LazyAppointmentTable.tsx # Lazy-loaded appointment table
│   │   │   ├── LazyInvoiceTable.tsx  # Lazy-loaded invoice table
│   │   │   ├── patientColumns.tsx    # Patient table column definitions
│   │   │   ├── appointmentColumns.tsx # Appointment table column definitions
│   │   │   └── invoiceColumns.tsx    # Invoice table column definitions
│   │   ├── charts/
│   │   │   ├── LazyLineChart.tsx     # Lazy-loaded line chart
│   │   │   └── LazyBarChart.tsx      # Lazy-loaded bar chart
│   │   ├── EnhancedRestoreDialog.tsx # Enhanced backup/restore dialog
│   │   ├── LockScreen.tsx            # Application lock screen
│   │   ├── OptimizedSearch.tsx       # Performance-optimized search
│   │   └── PerformanceOptimizer.tsx  # Performance optimization utilities
│   ├── hooks/
│   │   └── useSidebar.ts             # Sidebar state management hook
│   ├── pages/
│   │   ├── Dashboard.tsx             # Main dashboard with lazy-loaded statistics
│   │   ├── OptimizedPatientList.tsx  # Optimized patient list with virtualization
│   │   ├── AddPatient.tsx            # Add new patient form
│   │   ├── PatientDetails.tsx        # View patient details
│   │   ├── EditPatient.tsx          # Edit patient form
│   │   ├── OptimizedAppointments.tsx # Optimized appointment management
│   │   ├── NewAppointment.tsx        # Create new appointment
│   │   ├── AppointmentDetails.tsx    # View appointment details
│   │   ├── OptimizedInvoices.tsx     # Optimized invoice management
│   │   ├── InvoiceDetails.tsx        # View invoice details
│   │   ├── Reports.tsx               # Reports and analytics
│   │   ├── Settings.tsx              # Main settings page
│   │   ├── EncryptionSetup.tsx       # Security and encryption setup
│   │   └── settings/
│   │       ├── BackupRestoreSettings.tsx    # Enhanced backup/restore configuration
│   │       ├── OperatorSettings.tsx         # User management
│   │       ├── CustomExaminationsSettings.tsx # Medical examination types
│   │       ├── ReceiptSettings.tsx          # Receipt configuration
│   │       ├── TreatmentSettings.tsx        # Treatment settings
│   │       ├── ActivityLogsSettings.tsx     # System activity logs
│   │       ├── CurrencySettings.tsx         # Currency configuration
│   │       └── PasswordAndSecuritySettings.tsx # Security settings
│   ├── services/
│   │   ├── UnifiedStorage.ts         # Unified data storage service
│   │   ├── database.ts               # Tauri API interface
│   │   ├── databaseMock.ts           # Mock service for development
│   │   ├── optimizedDatabaseMock.ts  # Performance-optimized mock service
│   │   ├── databaseService.ts        # Database service layer
│   │   └── logService.ts             # Activity logging service
│   ├── utils/
│   │   ├── currencyUtils.tsx         # Currency formatting and conversion
│   │   └── logger.ts                 # Logging utilities
│   └── types/
│       └── index.ts                  # Comprehensive TypeScript type definitions
├── src-tauri/
│   ├── src/
│   │   └── main.rs                   # Rust backend with SQLite
│   └── Cargo.toml                    # Rust dependencies
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Rust and Cargo (for Tauri development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medrecplus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Development mode**
   ```bash
   # Start the React development server (mock data)
   npm run dev

   # Or start the full Tauri app with SQLite backend
   npm run tauri:dev

   # Or build and run on Android
   npm run android:dev
   ```

4. **Production build**
   ```bash
   # Build web version
   npm run build

   # Build desktop application (Windows, Linux)
   npm run tauri:build

   # Build Android APK
   npm run android:build
   ```

## System Features

### Patient Management
- **Auto-generated Record Numbers**: Format PT202500001 with year-based numbering
- **Comprehensive Patient Data**: Name, age, contact details, medical history
- **Advanced Search**: Real-time filtering across all patient fields
- **Sortable Data Tables**: Click headers to sort patients by any field
- **Column Visibility**: Customize which patient data columns to display
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Responsive Patient Cards**: Mobile-friendly patient display

### Appointment System
- **Smart Scheduling**: Calendar-based appointment management
- **Appointment Status Tracking**: Pending, confirmed, completed, cancelled
- **Patient-Appointment Linking**: Seamless integration with patient records
- **Appointment Reminders**: Built-in notification system
- **Time Slot Management**: Configurable appointment durations

### Treatment & Medical Records
- **Treatment Plans**: Create and manage patient treatment protocols
- **Medication Tracking**: Monitor prescribed medications and dosages
- **Examination Records**: Comprehensive medical examination history
- **Custom Examination Types**: Configurable medical procedures
- **Treatment Progress Tracking**: Monitor patient response to treatments

### Financial Management
- **Invoice Generation**: Automated invoice creation for services
- **Payment Tracking**: Monitor payment status and history
- **Revenue Analytics**: Financial performance dashboards
- **Receipt Printing**: Professional receipt generation
- **Treatment Costing**: Automated cost calculation based on services

### Reporting & Analytics
- **Executive Dashboard**: Key performance indicators and charts
- **Monthly Statistics**: Patient growth, appointment trends, revenue
- **Activity Logs**: Complete audit trail of all system activities
- **Export Functionality**: Generate Excel and PDF reports
- **Data Visualization**: Interactive charts using Recharts

### System Administration
- **User Management**: Multi-operator support with role-based access
- **Backup & Restore**: Automated data backup and recovery
- **Configuration Management**: Customizable system settings
- **Activity Monitoring**: Real-time system usage tracking
- **Data Import/Export**: Flexible data migration tools

### User Experience
- **Collapsible Sidebar**: Maximize screen real estate
- **Breadcrumbs Navigation**: Clear user path tracking
- **Edge-to-Edge Design**: Modern mobile-first responsive UI
- **Dark/Light Themes**: Eye-friendly interface options
- **Keyboard Shortcuts**: Power user productivity features

## Development Environment

### Data Storage & Services
The application uses a comprehensive data management system:

#### Unified Storage Service
- **UnifiedStorage.ts**: Centralized data management with performance optimization
- **Cross-platform compatibility**: Works with both localStorage (dev) and SQLite (production)
- **Data persistence**: Reliable data storage with backup/restore capabilities
- **Performance optimization**: Lazy loading and caching for large datasets

#### Mock Services for Development
- **databaseMock.ts**: Standard mock service for web development
- **optimizedDatabaseMock.ts**: Performance-optimized mock service with virtualization
- **Simulated API responses**: Realistic delays and sample data
- **Full CRUD functionality**: Complete operations without database setup
- **Large dataset support**: Handles thousands of records with pagination

#### Environment Detection
The application automatically detects the runtime environment:
- **Web Development**: Uses localStorage mock services (`npm run dev`)
- **Desktop Application**: Uses real SQLite backend (`npm run tauri:dev` or `npm run tauri:build`)
- **Mobile Application**: Full SQLite backend with mobile-optimized UI (`npm run android:dev`)

### Database Architecture
The application uses SQLite with the following schema:
```sql
-- Core tables for comprehensive medical practice management
CREATE TABLE patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    address TEXT,
    phone_number TEXT NOT NULL,
    initial_diagnosis TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    appointment_date DATETIME NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    treatment_type TEXT NOT NULL,
    description TEXT,
    cost DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    appointment_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    patient_name TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    operator_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'unpaid', 'void', 'pending')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Additional tables for enhanced functionality
CREATE TABLE operators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE custom_examinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Platform-Specific Builds

### Windows Desktop Application
1. **Install Rust**: https://rustup.rs/
2. **Build the application**:
   ```bash
   npm run tauri:build
   ```
3. **Find your executable**: `src-tauri/target/release/bundle/msi/PatientManagementApp_0.1.0_x64_en-US.msi`

This creates a single `.msi` installer file that users can run to install the app on Windows.

### Linux Desktop Application
```bash
npm run tauri:build
```
Creates `.deb` and `.AppImage` packages for Linux distributions in `src-tauri/target/release/bundle/`.

### Android Mobile Application

#### Prerequisites
1. **Install Rust**: https://rustup.rs/
2. **Install Android SDK**:
   - Install Android Studio: https://developer.android.com/studio
   - Set `ANDROID_HOME` environment variable
   - Add `$ANDROID_HOME/platform-tools` and `$ANDROID_HOME/tools` to your PATH

3. **Install Android NDK** (via Android Studio SDK Manager)
   - Minimum required: NDK 26.0.10792818 or newer
   - Set `ANDROID_NDK_ROOT` environment variable

4. **Install Java Development Kit (JDK)**:
   - JDK 17 or newer (recommended: OpenJDK 17+)

#### Building the APK
```bash
# For development/debug APK
npm run android:dev

# For release APK
npm run android:build
```

#### Android Configuration
- **Package Name**: `com.patientmanagement.app`
- **Min SDK**: Android 5.0 (API 21)
- **Target SDK**: Android 13 (API 33)
- **Permissions**: Internet, Storage access
- **APK Locations**:
  - Debug: `src-tauri/target/aarch64-linux-android/debug/apk/`
  - Release: `src-tauri/target/aarch64-linux-android/release/apk/`

**Note**: Building for Android on Windows may require WSL2 for best compatibility.

### Cross-Platform Development
The application supports:
- **Web Development**: Full mock data environment for rapid prototyping
- **Desktop**: Native Windows and Linux applications with SQLite
- **Mobile**: Android support with touch-optimized interface
- **Responsive Design**: Seamlessly adapts to different screen sizes and input methods

## Performance & Architecture Highlights

### 🚀 Performance Optimizations
- **Virtualized Tables**: Handle thousands of records efficiently with TanStack React Table
- **Lazy Loading**: Components and charts load on-demand for faster initial page loads
- **Optimized Search**: Real-time search with debouncing and indexing
- **Memory Management**: Efficient data handling with cleanup and garbage collection
- **Caching Strategy**: Smart caching for frequently accessed data with TTL

### 🏗️ Architecture Patterns
- **Component-Based Architecture**: Modular, reusable React components
- **Service Layer Pattern**: Separation of data logic from UI components
- **Unified Storage**: Abstracted data access layer supporting multiple backends
- **Type-Safe Development**: Comprehensive TypeScript definitions throughout
- **Error Boundaries**: Graceful error handling and recovery mechanisms

### 🔒 Security & Privacy
- **Local-First Design**: All sensitive data stored locally by default
- **Encryption Support**: Optional data encryption for sensitive information
- **Activity Logging**: Comprehensive audit trail of all user actions
- **Session Management**: Secure session handling with timeout protection
- **Input Validation**: Client-side validation with sanitization

## Current Status & Roadmap

### ✅ Completed Features (v0.2.0)
- [x] **Complete Patient Management**: Full CRUD operations with optimized search and filtering
- [x] **Performance-Optimized Tables**: Virtualized tables handling large datasets efficiently
- [x] **Advanced Appointment System**: Vital signs recording, custom examinations, treatment integration
- [x] **Comprehensive Financial Management**: Optimized invoicing with sorting, filtering, and multi-currency support
- [x] **Enhanced Dashboard**: Lazy-loaded charts and real-time statistics
- [x] **Comprehensive Settings Panel**: 8 configuration categories including security, currency, and customizations
- [x] **Security Features**: Password protection, encryption setup, and session management
- [x] **Multi-Currency Support**: Configurable currencies with real-time formatting and conversion
- [x] **Backup & Restore System**: Enhanced data backup with validation and recovery options
- [x] **Activity Logging**: Complete audit trail with filtering and monitoring
- [x] **Custom Examinations**: Configurable medical examination types with units
- [x] **Treatment Management**: Full treatment lifecycle with pricing and notes
- [x] **Receipt Customization**: Professional receipt generation with business information
- [x] **Operator Management**: User and role management system
- [x] **Performance Optimization**: Lazy loading, virtualization, and optimized rendering
- [x] **Modern UI/UX**: Responsive design with animations and edge-to-edge compliance
- [x] **Multi-Platform Support**: Windows, Linux, and Android applications
- [x] **Unified Storage System**: Cross-platform data management with performance optimization

### 🚧 In Development (v0.3.0)
- [ ] Advanced reporting with custom date ranges and filtering
- [ ] Patient photo upload and management
- [ ] SMS/email appointment reminders with notifications
- [ ] Multi-language support (i18n) for international use
- [ ] Dark/light theme switching with system preference detection
- [ ] Data synchronization across multiple devices
- [ ] Advanced export options (PDF, Word, custom Excel templates)
- [ ] Barcode integration for patient identification

### 📋 Planned Features (Future Versions)
- [ ] Telemedicine integration with video calling
- [ ] HIPAA compliance features and data encryption standards
- [ ] Advanced medical imaging support and DICOM integration
- [ ] REST API for third-party integrations and webhooks
- [ ] Cloud backup options with automatic synchronization
- [ ] Mobile app iOS support for full cross-platform coverage
- [ ] Prescription management with drug interaction checking
- [ ] Lab results integration and electronic health records (EHR)
- [ ] Insurance billing support and claim processing
- [ ] Advanced user roles, permissions, and access control
- [ ] Appointment scheduling with AI-powered optimization
- [ ] Predictive analytics for patient care trends

## Contributing

This is a comprehensive medical records management system designed for modern healthcare practices. The application emphasizes:
- **Privacy First**: All data stored locally with optional cloud backup
- **Offline Capability**: Full functionality without internet connection
- **Cross-Platform**: Consistent experience across desktop and mobile
- **Modern Technology**: Built with the latest web technologies for performance and maintainability
- **Performance Focused**: Optimized for handling large datasets with smooth user experience
- **Developer Friendly**: Clean, well-documented codebase with comprehensive TypeScript support

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**MedRecPlus** - Modern medical records management for healthcare practices of all sizes.