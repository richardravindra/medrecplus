# Development Mode Guide

## Overview
The medical records application supports both **Tauri desktop/mobile deployment** and **web browser development**. This document explains how the encryption features work in different environments.

## Environment Detection

The application automatically detects its runtime environment:
- **Tauri Environment**: Full encryption features available
- **Web Browser**: Development mode with simulated encryption

## Web Development Mode

### What Works in Web Browser
- ✅ **Complete UI Development** - All components render properly
- ✅ **Password Setup UI** - Test form validation and user experience
- ✅ **Lock Screen UI** - Test auto-lock and lockout features
- ✅ **Security State Management** - Test security context and timers
- ✅ **Patient Management Features** - All CRUD operations work

### What's Simulated in Web Browser
- 🔄 **Database Encryption** - Simulated with console logging
- 🔄 **SQLCipher Operations** - Replaced with timeout delays
- 🔄 **File System Operations** - Replaced with console logging

### Development Password
For testing the lock screen in web browser:
- **Password**: `password`
- **Purpose**: Quick testing without complexity
- **Note**: This only works in web development mode

## Code Pattern for Environment Detection

```typescript
// Check if Tauri API is available
if (typeof window !== 'undefined' && '__TAURI__' in window) {
  // Running in Tauri environment - use real encryption
  await invoke('setup_encryption', { password });
} else {
  // Running in web browser - simulate for development
  console.log('Running in web browser - simulating encryption setup');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

## Testing Features

### 1. Password Strength Validation
```bash
npm run dev
```
- Test various password combinations
- Verify strength indicator updates
- Test minimum requirements enforcement

### 2. Lock Screen Testing
```bash
# In web browser, lock the app manually:
# Set localStorage to simulate locked state
localStorage.setItem('security-debug', 'lock')
```

### 3. Auto-Lock Testing
- Open app in browser
- Wait 15 minutes (or modify timeout for testing)
- Verify lock screen appears

### 4. Failed Attempt Testing
- Use wrong passwords in lock screen
- After 5 attempts, verify 30-minute lockout
- Test countdown timer functionality

## Development Tips

### Modify Auto-Lock Timeout (for testing)
```typescript
// In SecurityContext.tsx
const AUTO_LOCK_TIMEOUT = 60 * 1000; // 1 minute instead of 15
```

### Modify Lockout Duration (for testing)
```typescript
// In SecurityContext.tsx
const LOCKOUT_DURATION = 60 * 1000; // 1 minute instead of 30
```

### Clear Security State
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Building for Production

### Desktop Application
```bash
# Install Tauri dependencies
npm install

# Build desktop application
npm run tauri:build
```

### Web Application (Limited)
```bash
# Build web version (encryption disabled)
npm run build
```

## Security Notes for Development

### Web Development Mode
- **No Real Encryption** - Data is not encrypted in browser
- **No File Storage** - Database operations are simulated
- **Development Password** - Use "password" for quick testing
- **Console Logging** - Security operations log to console

### Production Deployment
- **Full SQLCipher Encryption** - Real AES-256 encryption
- **Secure File Storage** - Encrypted database files
- **Strong Password Requirements** - Enforced security policies
- **No Debug Output** - Production mode hides security logs

## File Locations

### Development (Web Browser)
- **Data**: In-memory only (resets on refresh)
- **Config**: In-memory only (resets on refresh)
- **Logs**: Browser console

### Production (Tauri)
- **Database**: `patients.db` (encrypted)
- **Config**: `~/.medrec_encryption` (platform-specific)
- **Logs**: Application logs + Tauri logs

## Troubleshooting

### "invoke is not defined" Error
- **Cause**: Running in web browser without environment check
- **Fix**: Ensure all `invoke()` calls are wrapped in environment detection

### Encryption Setup Not Appearing
- **Web Browser**: Normal - automatically skips for development
- **Tauri**: Check backend logs for errors

### Lock Screen Not Working
- **Check**: SecurityContext is properly imported
- **Verify**: SecurityProvider wraps the application
- **Test**: Manual lock using browser console

## Testing Checklist

### UI Testing
- [ ] Password strength indicator works
- [ ] Form validation prevents weak passwords
- [ ] Lock screen appears and functions
- [ ] Failed attempt counter works
- [ ] Lockout timer displays correctly

### Security Testing (Tauri Only)
- [ ] Database is actually encrypted
- [ ] Wrong passwords fail appropriately
- [ ] Migration preserves data integrity
- [ ] Backup files are created

### Development Workflow
- [ ] Web development mode works smoothly
- [ ] Tauri development builds successfully
- [ ] Production build includes all features
- [ ] Error handling works in both environments

---

**Note**: The web development mode is designed for UI/UX development and testing. For security testing and validation, always use the Tauri build environment where real encryption is active.