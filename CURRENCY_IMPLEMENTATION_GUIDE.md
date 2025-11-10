# Currency Implementation Guide

This guide explains how to use the new currency system throughout your MedRecPlus application.

## 📁 New Files Created

1. **`src/pages/settings/CurrencySettings.tsx`** - Currency management page
2. **`src/utils/currencyUtils.tsx`** - Currency utilities and hooks
3. **Updated `src/pages/Settings.tsx`** - Added currency menu item
4. **Updated `src/App.tsx`** - Added route for currency settings

## 🚀 How to Use

### 1. Basic Currency Formatting

```tsx
import { formatCurrency } from '../utils/currencyUtils';

// Simple formatting
const price = 25000;
const formattedPrice = formatCurrency(price);
// Output: "Rp 25,000.00" (for Indonesian Rupiah)
```

### 2. Whole Number Formatting

```tsx
import { formatCurrencyWhole } from '../utils/currencyUtils';

const totalPrice = 25000;
const formatted = formatCurrencyWhole(totalPrice);
// Output: "Rp 25,000" (no decimal places)
```

### 3. React Hook for Dynamic Updates

```tsx
import { useCurrency } from '../utils/currencyUtils';

function MyComponent() {
  const [currency, setCurrency] = useCurrency();

  const handlePriceChange = (newPrice: number) => {
    const formatted = formatCurrency(newPrice, currency);
    console.log(formatted);
  };

  return (
    <div>
      <p>Current currency: {currency.symbol} {currency.code}</p>
      <p>Price: {formatCurrency(25000, currency)}</p>
    </div>
  );
}
```

### 4. Global Event Listener

```tsx
import { addCurrencyChangeListener } from '../utils/currencyUtils';

function MyComponent() {
  useEffect(() => {
    const cleanup = addCurrencyChangeListener((newCurrency) => {
      console.log('Currency changed to:', newCurrency.code);
      // Update your component state here
    });

    return cleanup; // Remove listener when component unmounts
  }, []);
}
```

## 🔧 Implementation in Existing Components

### Replace Existing Currency Formatting

**Before:**
```tsx
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
```

**After:**
```tsx
import { formatCurrency } from '../utils/currencyUtils';

// The function will automatically use the selected currency
const formattedPrice = formatCurrency(amount);
```

### Update Components that Display Prices

1. **InvoiceDetails.tsx**
   - Replace the `formatCurrency` function
   - Use `formatCurrencyForPrint` for printing

2. **TreatmentSettings.tsx**
   - Update treatment price display
   - Use `formatCurrencyWhole` for price inputs

3. **NewAppointment.tsx**
   - Update total price calculation display
   - Make it responsive to currency changes

4. **Dashboard.tsx**
   - Update revenue displays
   - Use proper currency formatting

## 🎯 Example: Updating a Component

```tsx
// src/components/TreatmentPrice.tsx
import React from 'react';
import Typography from '@mui/joy/Typography';
import { useCurrency, formatCurrency } from '../utils/currencyUtils';

interface TreatmentPriceProps {
  price: number;
}

const TreatmentPrice: React.FC<TreatmentPriceProps> = ({ price }) => {
  const [currency] = useCurrency();

  return (
    <Typography level="body-sm" sx={{ color: '#ffffff' }}>
      {formatCurrency(price, currency)}
    </Typography>
  );
};

export default TreatmentPrice;
```

## 📊 Supported Currencies

The currency system supports **200+ world currencies** including:

- **Major Currencies**: USD, EUR, GBP, JPY, CNY, INR, AUD, CAD, CHF
- **Asian Currencies**: KRW, MYR, THB, SGD, VND, PHP, BND, LKR, PKR, BDT
- **Middle Eastern Currencies**: AED, SAR, QAR, KWD, BHD, OMR, IRR, ILS
- **European Currencies**: NOK, SEK, DKK, ISK, RUB, PLN, CZK, HUF, RON
- **African Currencies**: ZAR, NGN, GHS, KES, UGX, EGP, MAD, TND
- **American Currencies**: MXN, BRL, ARS, CLP, PEN, COP, VES, BOB
- **And many more...**

## 🔍 Features

### Search Functionality
- Search by currency code (USD, EUR, etc.)
- Search by currency name (US Dollar, Euro, etc.)
- Search by country name (United States, France, etc.)
- Search by symbol ($, €, £, etc.)

### Auto-Locale Detection
- Each currency is mapped to its appropriate locale
- Proper number formatting for each region
- Handles decimal places according to local conventions

### Persistent Settings
- Currency preference saved to localStorage
- Automatically loads on app restart
- Global state management across all components

### Real-time Updates
- Components automatically update when currency changes
- Custom event system for currency change notifications
- React hook for easy integration

## 🛠️ Technical Details

### Data Structure
```typescript
interface CurrencyConfig {
  code: string;      // USD, EUR, IDR
  name: string;      // US Dollar, Euro, Indonesian Rupiah
  symbol: string;    // $, €, Rp
  locale: string;    // en-US, de-DE, id-ID
}
```

### Storage
- Settings saved in `localStorage` under key `app_currency`
- JSON format for easy serialization
- Default fallback to Indonesian Rupiah (IDR)

### Event System
- Custom `currencyChanged` events
- Listener pattern for component updates
- Automatic cleanup on component unmount

## 🎨 UI Integration

### Settings Menu
- Added "Change Currency Unit" menu item
- Currency exchange icon
- Navigates to `/settings/currency`

### Currency Selection Page
- Searchable currency list
- Sample formatting preview
- Save settings with confirmation
- Responsive design for all screen sizes

## 🔄 Migration Steps

1. **Update imports** in components that format currency
2. **Replace hard-coded formatting** with utility functions
3. **Add currency listeners** where real-time updates are needed
4. **Test with different currencies** to ensure proper formatting
5. **Update print layouts** to use `formatCurrencyForPrint`

## 📱 Mobile Considerations

- Currency picker is mobile-friendly
- Search works on touch devices
- Compact display for small screens
- Proper locale formatting for mobile browsers

## 🚨 Troubleshooting

### Common Issues

1. **Currency not updating**: Check if component uses the `useCurrency` hook
2. **Wrong formatting**: Verify the locale mapping for the currency
3. **Storage errors**: Ensure localStorage is available and not full
4. **Performance**: Use memoization for expensive formatting operations

### Debug Mode

Add this to your component to debug currency issues:
```tsx
useEffect(() => {
  console.log('Current currency:', getCurrencyConfig());
}, []);
```

## 💡 Best Practices

1. **Use the hook** for components that need to react to currency changes
2. **Import the function** for one-time formatting
3. **Use `formatCurrencyWhole`** for whole amounts (most medical prices)
4. **Use `formatCurrencyForPrint`** for receipts and invoices
5. **Test with different currencies** to ensure proper display

---

Your MedRecPlus application now supports comprehensive currency management! Users can select from 200+ world currencies, and all price displays will automatically update throughout the application.