# MedRecPlus - Comprehensive Patient Management System

A modern offline cross-platform medical records management application built with Tauri, React, Vite, and Joy UI for complete healthcare practice management with SQLite database. Available for Windows, Linux, and Android.

## Features

### Core Patient Management
- **🏥 Complete Patient Records**: Full CRUD operations for comprehensive patient data
- **📋 Smart Record Numbers**: Auto-generated patient IDs (PT202500001 format)
- **🔍 Advanced Search**: Real-time search across all patient data
- **📱 Responsive Design**: Modern UI built with Joy UI components
- **💾 Offline Storage**: SQLite database for reliable offline data storage

### Appointments & Scheduling
- **📅 Appointment Management**: Schedule and manage patient appointments
- **🔄 Appointment Details**: Track appointment status and patient information
- **📊 Calendar Integration**: Visual calendar for appointment scheduling

### Treatments & Medical Records
- **💊 Treatment Management**: Track medications and treatment plans
- **📋 Treatment History**: Complete treatment and examination records
- **🔬 Custom Examinations**: Configurable medical examination types

### Financial Management
- **💰 Invoicing System**: Generate and manage patient invoices
- **📈 Revenue Tracking**: Monitor financial performance with charts
- **🧾 Receipt Management**: Generate professional receipts

### Reporting & Analytics
- **📊 Dashboard**: Comprehensive overview with statistics and charts
- **📈 Monthly Reports**: Track patient growth, appointments, and revenue
- **📋 Activity Logs**: Complete audit trail of system activities

### System Configuration
- **⚙️ Settings Panel**: Comprehensive system configuration
- **👤 Operator Management**: User and role management
- **💾 Backup & Restore**: Data backup and recovery options
- **🎨 Customizable UI**: Tailor the system to your practice needs

### Navigation & UX
- **🎯 Clean Interface**: Intuitive navigation sidebar with collapsible menu
- **📱 Edge-to-Edge Design**: Modern mobile-first responsive design
- **🔄 Seamless Navigation**: Smooth transitions and breadcrumb navigation

## Tech Stack

### Frontend
- **React 19.1** - Latest React with hooks and TypeScript
- **Vite 7.1** - Ultra-fast build tool and development server
- **Joy UI 5.0** - Beautiful, accessible React components
- **React Router 7.9** - Modern client-side routing
- **TypeScript 5.9** - Type-safe development
- **TanStack React Table** - Powerful data table functionality
- **Recharts 3.3** - Interactive charts and data visualization
- **XLSX 0.18** - Excel file export functionality

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
│   │   └── Layout/
│   │       ├── MainLayout.tsx        # Main app layout with sidebar
│   │       ├── Header.tsx             # Header with breadcrumbs
│   │       └── Sidebar.tsx           # Navigation sidebar
│   ├── contexts/
│   │   └── SidebarContext.tsx        # Sidebar state management
│   ├── pages/
│   │   ├── Dashboard.tsx             # Main dashboard with statistics
│   │   ├── PatientList.tsx           # Main patient list page
│   │   ├── AddPatient.tsx            # Add new patient form
│   │   ├── PatientDetails.tsx        # View patient details
│   │   ├── EditPatient.tsx          # Edit patient form
│   │   ├── Appointments.tsx          # Appointment management
│   │   ├── NewAppointment.tsx        # Create new appointment
│   │   ├── AppointmentDetails.tsx    # View appointment details
│   │   ├── Treatments.tsx            # Treatment management
│   │   ├── AddTreatment.tsx          # Add new treatment
│   │   ├── EditTreatment.tsx         # Edit treatment
│   │   ├── Invoices.tsx              # Invoice management
│   │   ├── InvoiceDetails.tsx        # View invoice details
│   │   ├── Reports.tsx               # Reports and analytics
│   │   ├── Settings.tsx              # Main settings page
│   │   └── settings/
│   │       ├── BackupRestoreSettings.tsx    # Backup/restore configuration
│   │       ├── OperatorSettings.tsx         # User management
│   │       ├── CustomExaminationsSettings.tsx # Medical examination types
│   │       ├── ReceiptSettings.tsx          # Receipt configuration
│   │       ├── TreatmentSettings.tsx        # Treatment settings
│   │       └── ActivityLogsSettings.tsx     # System activity logs
│   ├── services/
│   │   ├── database.ts               # Tauri API interface
│   │   └── databaseMock.ts           # Mock service for development
│   └── types/
│       └── index.ts                  # TypeScript type definitions
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

### Mock Service
The application uses a mock service (`databaseMock.ts`) for web development:
- Simulates API responses with realistic delays
- Includes sample patient records, appointments, and treatments
- Maintains data in memory during development session
- Provides full CRUD functionality without database setup

### Environment Detection
The application automatically detects the runtime environment:
- **Web Development**: Uses localStorage mock service (`npm run dev`)
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
    patient_id INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
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

## Current Status & Roadmap

### ✅ Completed Features
- [x] Complete patient management system with CRUD operations
- [x] Appointment scheduling and management
- [x] Treatment tracking and medical records
- [x] Invoice generation and financial management
- [x] Dashboard with statistics and charts
- [x] Responsive mobile-first design with edge-to-edge compliance
- [x] Multi-platform support (Windows, Linux, Android)
- [x] SQLite database backend with comprehensive schema
- [x] Advanced search and filtering capabilities
- [x] Export functionality for reports and data
- [x] Settings panel with system configuration
- [x] Activity logging and audit trail
- [x] Backup and restore functionality
- [x] Modern UI with Joy UI components

### 🚧 In Development
- [ ] Payment processing integration
- [ ] Advanced reporting with custom date ranges
- [ ] Patient photo upload and management
- [ ] SMS/email appointment reminders
- [ ] Multi-language support (i18n)
- [ ] Dark/light theme switching
- [ ] Data synchronization across devices

### 📋 Planned Features
- [ ] Telemedicine integration
- [ ] HIPAA compliance features
- [ ] Advanced medical imaging support
- [ ] API for third-party integrations
- [ ] Cloud backup options
- [ ] Mobile app iOS support
- [ ] Prescription management
- [ ] Lab results integration
- [ ] Insurance billing support
- [ ] Advanced user roles and permissions

## Contributing

This is a comprehensive medical records management system designed for modern healthcare practices. The application emphasizes:
- **Privacy First**: All data stored locally with optional cloud backup
- **Offline Capability**: Full functionality without internet connection
- **Cross-Platform**: Consistent experience across desktop and mobile
- **Modern Technology**: Built with the latest web technologies for performance and maintainability

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**MedRecPlus** - Modern medical records management for healthcare practices of all sizes.