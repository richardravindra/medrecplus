import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import Alert from '@mui/joy/Alert';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import Search from '@mui/icons-material/Search';
import CurrencyExchange from '@mui/icons-material/CurrencyExchange';
import { useCurrency } from '../../utils/currencyUtils';

// Comprehensive list of world currencies
const WORLD_CURRENCIES_RAW = [
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union' },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', country: 'Australia' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', country: 'Canada' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', country: 'Hong Kong' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$', country: 'Singapore' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', country: 'South Korea' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', country: 'Malaysia' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', country: 'Thailand' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', country: 'Indonesia' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', country: 'Vietnam' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', country: 'Philippines' },
  { code: 'BND', name: 'Brunei Dollar', symbol: '$', country: 'Brunei' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', country: 'Sri Lanka' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', country: 'Pakistan' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', country: 'Bangladesh' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', country: 'Nepal' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', country: 'Maldives' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', country: 'Afghanistan' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.', country: 'Bhutan' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', country: 'Mongolia' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', country: 'Kazakhstan' },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'с', country: 'Kyrgyzstan' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'с', country: 'Uzbekistan' },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'с', country: 'Tajikistan' },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'm', country: 'Turkmenistan' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', country: 'Saudi Arabia' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', country: 'Qatar' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', country: 'Kuwait' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', country: 'Bahrain' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', country: 'Oman' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', country: 'Jordan' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', country: 'Lebanon' },
  { code: 'SYP', name: 'Syrian Pound', symbol: '£S', country: 'Syria' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'د.ع', country: 'Iraq' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', country: 'Iran' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', country: 'Israel' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', country: 'Egypt' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'د.ل', country: 'Libya' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', country: 'Tunisia' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', country: 'Algeria' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', country: 'Morocco' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', country: 'West Africa' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'CFA', country: 'Central Africa' },
  { code: 'XPF', name: 'CFP Franc', symbol: '₣', country: 'French Pacific' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', country: 'Ghana' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', country: 'Uganda' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', country: 'Tanzania' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', country: 'Rwanda' },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu', country: 'Burundi' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', country: 'Ethiopia' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh.so.', country: 'Somalia' },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', country: 'Djibouti' },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', country: 'Eritrea' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.', country: 'Sudan' },
  { code: 'SSP', name: 'South Sudanese Pound', symbol: '£', country: 'South Sudan' },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', country: 'Gambia' },
  { code: 'LRD', name: 'Liberian Dollar', symbol: '$', country: 'Liberia' },
  { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le', country: 'Sierra Leone' },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'FG', country: 'Guinea' },
  { code: 'CVE', name: 'Cape Verdean Escudo', symbol: '$', country: 'Cape Verde' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', country: 'Senegal' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', country: 'Mali' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', country: 'Ivory Coast' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', country: 'Burkina Faso' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', country: 'Benin' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', country: 'Togo' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', country: 'Niger' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', country: 'Guinea-Bissau' },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'CFA', country: 'Cameroon' },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'CFA', country: 'Chad' },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'CFA', country: 'Congo' },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'CFA', country: 'Central African Republic' },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'CFA', country: 'Gabon' },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'CFA', country: 'Equatorial Guinea' },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'CFA', country: 'Sao Tome & Principe' },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', country: 'Madagascar' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: 'SR', country: 'Seychelles' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: 'Rs', country: 'Mauritius' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', country: 'Russia' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', country: 'Ukraine' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', country: 'Poland' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', country: 'Czech Republic' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', country: 'Hungary' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', country: 'Romania' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', country: 'Bulgaria' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', country: 'Croatia' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', country: 'Serbia' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', country: 'North Macedonia' },
  { code: 'BAM', name: 'Bosnia and Herzegovina Convertible Mark', symbol: 'KM', country: 'Bosnia' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', country: 'Albania' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'lei', country: 'Moldova' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', country: 'Norway' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', country: 'Sweden' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', country: 'Denmark' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', country: 'Iceland' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', country: 'Turkey' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', country: 'Georgia' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', country: 'Armenia' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', country: 'Azerbaijan' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', country: 'Belarus' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', country: 'Mexico' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', country: 'Argentina' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', country: 'Chile' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', country: 'Peru' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', country: 'Colombia' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs', country: 'Venezuela' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', country: 'Bolivia' },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', country: 'Paraguay' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', country: 'Uruguay' },
  { code: 'GYD', name: 'Guyanaese Dollar', symbol: '$', country: 'Guyana' },
  { code: 'SRD', name: 'Surinamese Dollar', symbol: '$', country: 'Suriname' },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: '$', country: 'Trinidad' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: '$', country: 'Jamaica' },
  { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', country: 'Haiti' },
  { code: 'XCD', name: 'Eastern Caribbean Dollar', symbol: '$', country: 'Caribbean' },
  { code: 'CUP', name: 'Cuban Peso', symbol: '$', country: 'Cuba' },
  { code: 'DOP', name: 'Dominican Peso', symbol: '$', country: 'Dominican Republic' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', country: 'Nicaragua' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', country: 'Honduras' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', country: 'Guatemala' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', country: 'Costa Rica' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', country: 'Panama' },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: '$', country: 'Bahamas' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: '$', country: 'Barbados' },
  { code: 'BZD', name: 'Belize Dollar', symbol: '$', country: 'Belize' },
  { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ', country: 'Aruba' },
  { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ', country: 'Netherlands Antilles' },
  { code: 'XCD', name: 'Eastern Caribbean Dollar', symbol: '$', country: 'Antigua and Barbuda' },
  { code: 'XCD', name: 'Eastern Caribbean Dollar', symbol: '$', country: 'St. Kitts and Nevis' },
  { code: 'XCD', name: 'Eastern Caribbean Dollar', symbol: '$', country: 'St. Lucia' },
  { code: 'XCD', name: 'Eastern Caribbean Dollar', symbol: '$', country: 'St. Vincent' },
  { code: 'XCD', name: 'Eastern Caribbean Dollar', symbol: '$', country: 'Grenada' },
  { code: 'XCD', name: 'Eastern Caribbean Dollar', symbol: '$', country: 'Dominica' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: '$', country: 'Fiji' },
  { code: 'WST', name: 'Samoan Tālā', symbol: 'WS$', country: 'Samoa' },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', country: 'Tonga' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT', country: 'Vanuatu' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: '$', country: 'Solomon Islands' },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', country: 'Papua New Guinea' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', country: 'New Zealand' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', country: 'Australia' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: '$', country: 'Fiji' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: '$', country: 'Namibia' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', country: 'Botswana' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', country: 'Zambia' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', country: 'Malawi' },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', country: 'Lesotho' },
  { code: 'SZL', name: 'Eswatini Lilangeni', symbol: 'E', country: 'Eswatini' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', country: 'Angola' },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'CFA', country: 'Central African Republic' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', country: 'West Africa' },
  { code: 'XPF', name: 'CFP Franc', symbol: '₣', country: 'French Pacific' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', country: 'Nepal' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', country: 'Maldives' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.', country: 'Bhutan' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', country: 'Mongolia' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', country: 'Kazakhstan' },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'с', country: 'Kyrgyzstan' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'с', country: 'Uzbekistan' },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'с', country: 'Tajikistan' },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'm', country: 'Turkmenistan' }
];

// Remove duplicate currencies based on code and country combination
const WORLD_CURRENCIES = WORLD_CURRENCIES_RAW.filter((currency, index, self) =>
  index === self.findIndex((c) => c.code === currency.code && c.country === currency.country)
);

const CurrencySettings: React.FC = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load current currency settings on component mount
  useEffect(() => {
    // Only set default if no currency exists at all
    if (!currency) {
      // Default to Indonesian Rupiah if no currency is set
      const defaultCurrency = WORLD_CURRENCIES.find(c => c.code === 'IDR');
      if (defaultCurrency) {
        const config = {
          code: defaultCurrency.code,
          name: defaultCurrency.name,
          symbol: defaultCurrency.symbol,
          locale: 'id-ID'
        };
        setCurrency(config);
      }
    }
  }, [currency, setCurrency]); // Include currency and setCurrency as dependencies

  // Filter currencies based on search term
  const filteredCurrencies = useMemo(() => {
    if (!searchTerm) return WORLD_CURRENCIES;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return WORLD_CURRENCIES.filter(currency =>
      currency.code.toLowerCase().includes(lowerSearchTerm) ||
      currency.name.toLowerCase().includes(lowerSearchTerm) ||
      currency.country.toLowerCase().includes(lowerSearchTerm) ||
      currency.symbol.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm]);

  const handleCurrencySelect = (currencyCode: string) => {
    const worldCurrency = WORLD_CURRENCIES.find(c => c.code === currencyCode);
    if (worldCurrency) {
      setCurrency({
        code: worldCurrency.code,
        name: worldCurrency.name,
        symbol: worldCurrency.symbol,
        locale: getLocaleForCurrency(worldCurrency.code)
      });
    }
  };

  const getLocaleForCurrency = (currencyCode: string): string => {
    // Map currency codes to locales for proper formatting
    const localeMap: Record<string, string> = {
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'JPY': 'ja-JP',
      'CNY': 'zh-CN',
      'INR': 'hi-IN',
      'AUD': 'en-AU',
      'CAD': 'en-CA',
      'CHF': 'de-CH',
      'HKD': 'zh-HK',
      'SGD': 'en-SG',
      'KRW': 'ko-KR',
      'MYR': 'ms-MY',
      'THB': 'th-TH',
      'IDR': 'id-ID',
      'VND': 'vi-VN',
      'PHP': 'en-PH',
      'BND': 'en-BN',
      'LKR': 'si-LK',
      'PKR': 'ur-PK',
      'BDT': 'bn-BD',
      'NPR': 'ne-NP',
      'MVR': 'dv-MV',
      'MNT': 'mn-MN',
      'KZT': 'kk-KZ',
      'KGS': 'ky-KG',
      'UZS': 'uz-UZ',
      'TJS': 'tg-TJ',
      'TMT': 'tk-TM',
      'AED': 'ar-AE',
      'SAR': 'ar-SA',
      'QAR': 'ar-QA',
      'KWD': 'ar-KW',
      'BHD': 'ar-BH',
      'OMR': 'ar-OM',
      'JOD': 'ar-JO',
      'LBP': 'ar-LB',
      'SYP': 'ar-SY',
      'IQD': 'ar-IQ',
      'IRR': 'fa-IR',
      'ILS': 'he-IL',
      'EGP': 'ar-EG',
      'LYD': 'ar-LY',
      'TND': 'ar-TN',
      'DZD': 'ar-DZ',
      'MAD': 'ar-MA',
      'XOF': 'fr-SN',
      'XAF': 'fr-CM',
      'XPF': 'fr-PF',
      'ZAR': 'en-ZA',
      'NGN': 'en-NG',
      'GHS': 'en-GH',
      'KES': 'en-KE',
      'UGX': 'en-UG',
      'TZS': 'sw-TZ',
      'RWF': 'rw-RW',
      'BIF': 'fr-BI',
      'ETB': 'am-ET',
      'SOS': 'so-SO',
      'DJF': 'fr-DJ',
      'ERN': 'ti-ER',
      'SDG': 'ar-SD',
      'SSP': 'en-SS',
      'GMD': 'en-GM',
      'LRD': 'en-LR',
      'SLL': 'en-SL',
      'GNF': 'fr-GN',
      'CVE': 'pt-CV',
      'MGA': 'mg-MG',
      'SCR': 'en-SC',
      'MUR': 'en-MU',
      'RUB': 'ru-RU',
      'UAH': 'uk-UA',
      'PLN': 'pl-PL',
      'CZK': 'cs-CZ',
      'HUF': 'hu-HU',
      'RON': 'ro-RO',
      'BGN': 'bg-BG',
      'HRK': 'hr-HR',
      'RSD': 'sr-RS',
      'MKD': 'mk-MK',
      'BAM': 'bs-BA',
      'ALL': 'sq-AL',
      'MDL': 'ro-MD',
      'NOK': 'nn-NO',
      'SEK': 'sv-SE',
      'DKK': 'da-DK',
      'ISK': 'is-IS',
      'TRY': 'tr-TR',
      'GEL': 'ka-GE',
      'AMD': 'hy-AM',
      'AZN': 'az-AZ',
      'BYN': 'be-BY',
      'MXN': 'es-MX',
      'BRL': 'pt-BR',
      'ARS': 'es-AR',
      'CLP': 'es-CL',
      'PEN': 'es-PE',
      'COP': 'es-CO',
      'VES': 'es-VE',
      'BOB': 'es-BO',
      'PYG': 'es-PY',
      'UYU': 'es-UY',
      'GYD': 'en-GY',
      'SRD': 'nl-SR',
      'TTD': 'en-TT',
      'JMD': 'en-JM',
      'HTG': 'fr-HT',
      'XCD': 'en-XC',
      'CUP': 'es-CU',
      'DOP': 'es-DO',
      'NIO': 'es-NI',
      'HNL': 'es-HN',
      'GTQ': 'es-GT',
      'CRC': 'es-CR',
      'PAB': 'es-PA',
      'BSD': 'en-BS',
      'BBD': 'en-BB',
      'BZD': 'en-BZ',
      'AWG': 'nl-AW',
      'ANG': 'nl-AN',
      'FJD': 'en-FJ',
      'WST': 'sm-WS',
      'TOP': 'to-TO',
      'VUV': 'en-VU',
      'SBD': 'en-SB',
      'PGK': 'en-PG',
      'NZD': 'en-NZ',
      'NAD': 'en-NA',
      'BWP': 'en-BW',
      'ZMW': 'en-ZM',
      'MWK': 'en-MW',
      'LSL': 'en-LS',
      'SZL': 'en-SZ',
      'AOA': 'pt-AO'
    };
    return localeMap[currencyCode] || 'en-US';
  };

  const formatSampleAmount = (amount: number) => {
    if (!currency) return 'Sample: 0.00';

    try {
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency.symbol} ${amount.toFixed(2)}`;
    }
  };

  const saveCurrencySettings = () => {
    if (!currency) {
      setSaveMessage({ type: 'error', text: 'Please select a currency' });
      return;
    }

    setIsLoading(true);
    setSaveMessage(null);

    try {
      // Explicitly save the current currency setting
      setCurrency(currency);
      setSaveMessage({ type: 'success', text: 'Currency settings saved successfully!' });

      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving currency settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save currency settings' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100%',
      p: { xs: 1, md: 2 },
      pt: { xs: 0, md: 2 },
      pr: { xs: 2, md: 2 },
      boxSizing: 'border-box',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startDecorator={<ArrowBack />}
          onClick={() => navigate('/settings')}
          sx={{ borderRadius: 'sm' }}
        >
          Back to Settings
        </Button>
        <CurrencyExchange sx={{ fontSize: 32, color: '#ffffff' }} />
        <Typography level="h2">Currency Settings</Typography>
      </Box>

      {/* Current Selection */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography level="h4" sx={{ mb: 2, color: '#ffffff' }}>
            Current Currency Selection
          </Typography>
          {currency ? (
            <Box>
              <Typography level="body-lg" sx={{ color: '#ffffff', mb: 1 }}>
                {currency.symbol} {currency.code} - {currency.name}
              </Typography>
              <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
                Sample formatting: {formatSampleAmount(12345.67)}
              </Typography>
            </Box>
          ) : (
            <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
              No currency selected
            </Typography>
          )}
        </Box>
      </Card>

      {/* Currency List with Search */}
      <Card sx={{ flex: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 2 }}>
          {/* Search Bar */}
          <Input
            startDecorator={<Search />}
            placeholder="Search currencies by code, name, country, or symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              backgroundColor: '#2d2d2d',
              '& input': { color: '#ffffff' },
              '&::placeholder': { color: '#666' },
              mb: 2
            }}
          />

          {/* Currency List Header */}
          <Typography level="h4" sx={{ mb: 2, color: '#ffffff' }}>
            Available Currencies ({filteredCurrencies.length})
          </Typography>

          {filteredCurrencies.length === 0 ? (
            <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8, textAlign: 'center', py: 4 }}>
              No currencies found matching your search.
            </Typography>
          ) : (
            <Box sx={{
              height: '400px',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              {filteredCurrencies.map((worldCurrency, index) => (
                <Box
                  key={`${worldCurrency.code}-${worldCurrency.country}-${index}`}
                  sx={{
                    p: 1.5,
                    border: currency?.code === worldCurrency.code
                      ? '2px solid #1976d2'
                      : '1px solid #444',
                    borderRadius: 'sm',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: currency?.code === worldCurrency.code
                      ? 'rgba(25, 118, 210, 0.1)'
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: '#666'
                    }
                  }}
                  onClick={() => handleCurrencySelect(worldCurrency.code)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography level="body-md" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                        {worldCurrency.symbol} {worldCurrency.code} - {worldCurrency.name}
                      </Typography>
                      <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
                        {worldCurrency.country}
                      </Typography>
                    </Box>
                    <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.7 }}>
                      {formatSampleAmount(1000)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Card>

      {/* Save Button */}
      <Card sx={{ mt: 2 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography level="body-sm" sx={{ color: '#ffffff' }}>
              Changes will apply to all price displays throughout the application.
            </Typography>
            {saveMessage && (
              <Alert
                color={saveMessage.type === 'error' ? 'danger' : 'success'}
                sx={{ mt: 1 }}
              >
                {saveMessage.text}
              </Alert>
            )}
          </Box>
          <Button
            variant="solid"
            startDecorator={<Save />}
            onClick={saveCurrencySettings}
            disabled={!currency || isLoading}
            loading={isLoading}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
              '&:disabled': { backgroundColor: '#444' },
            }}
          >
            Save Settings
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default CurrencySettings;