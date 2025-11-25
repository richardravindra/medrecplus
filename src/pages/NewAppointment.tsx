import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import FormLabel from '@mui/joy/FormLabel';
import FormControl from '@mui/joy/FormControl';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Alert from '@mui/joy/Alert';
import Stack from '@mui/joy/Stack';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import IconButton from '@mui/joy/IconButton';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import Info from '@mui/icons-material/Info';
import Search from '@mui/icons-material/Search';
import Refresh from '@mui/icons-material/Refresh';
import Clear from '@mui/icons-material/Clear';
import { Patient, Operator, CustomExamination, Treatment, VitalSigns } from '../types';
import { dataService } from '../services/SimpleMedRecDataService';
import { log } from '../utils/logger';
import { formatCurrency } from '../utils/currencyUtils';

interface AppointmentData {
  patientId: string;
  operatorId: string;
  vitalSigns: VitalSigns;
  selectedTreatment: number | null;
}

const NewAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [customExaminations, setCustomExaminations] = useState<CustomExamination[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [debouncedPatientSearch, setDebouncedPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [preSelectedPatientId, setPreSelectedPatientId] = useState<number | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Refs for debouncing and dropdown handling
  const searchTimeoutRef = useRef<number | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<AppointmentData>({
    patientId: '',
    operatorId: '',
    vitalSigns: {
      bloodPressure: '',
      respirationRate: 0,
      heartRate: 0,
      borgScale: 0
    },
    selectedTreatment: null
  });

  const calculateTotalPrice = useCallback(() => {
    if (formData.selectedTreatment) {
      const treatment = treatments.find(t => t.id === formData.selectedTreatment);
      const price = treatment?.price || 0;
      setTotalPrice(price);
    } else {
      setTotalPrice(0);
    }
  }, [formData.selectedTreatment, treatments]);

  // Prevent re-initialization by tracking if we've already initialized
  const [hasInitialized, setHasInitialized] = useState(false);

  // Pre-defined functions to avoid hoisting issues
  const checkForPreSelectedPatient = useCallback(() => {
    try {
      const preSelectedPatient = localStorage.getItem('selectedPatientForAppointment');

      if (preSelectedPatient) {
        const patientData = JSON.parse(preSelectedPatient);

        // Only set if we haven't already set a pre-selected patient
        if (preSelectedPatientId === null) {
          setPreSelectedPatientId(patientData.id);
        } else {
          // Pre-selected patient already set, keep current selection
        }

        // Clear the stored selection
        localStorage.removeItem('selectedPatientForAppointment');
        return true; // Return true if we found a pre-selected patient
      } else {
        return false; // Return false if no pre-selected patient
      }
    } catch {
      // Error accessing localStorage, return false
      return false;
    }
  }, [preSelectedPatientId]);

  const searchForPreSelectedPatient = useCallback(async (patientId: number) => {
    try {
      // Load more patients to find the pre-selected one
      const expandedResult = await dataService.getPatients({
        page: 1,
        pageSize: 5000 // Load more to find the patient
      });

      const patient = expandedResult.data.find(p => p.id === patientId);
      if (patient) {
        setPatients(expandedResult.data); // Update patients list
        handlePatientSelect(patient);
        setPreSelectedPatientId(null);
      } else {
        setPreSelectedPatientId(null);
      }
    } catch {
      setPreSelectedPatientId(null);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialized) {
      const hasPreSelectedPatient = checkForPreSelectedPatient();
      loadData(hasPreSelectedPatient);
      setHasInitialized(true);
    } else {
      // Already initialized
    }
  }, [hasInitialized, checkForPreSelectedPatient]);

  // OLD SEARCH STATE - KEEP FOR COMPATIBILITY (no longer used but referenced by old code)
   
  const [_specialSearchResult, setSpecialSearchResult] = useState<Patient | null>(null);

  const [_isSearchingByRecord, setIsSearchingByRecord] = useState(false);

  // Special search function for record numbers that bypasses pagination
  const searchPatientByRecordNumber = useCallback(
    async (recordNumber: string): Promise<Patient | null> => {
      try {
        // Use the enhanced getPatients method to get all patients without pagination
        const allPatientsResult = await dataService.getPatients({
          page: 1,
          pageSize: 10000 // Large enough to get all patients
        });
        const allPatients = allPatientsResult.data;

        // Try exact match first
        let foundPatient = allPatients.find(p => p.record_number === recordNumber);

        // If no exact match, try partial match
        if (!foundPatient) {
          foundPatient = allPatients.find(
            p =>
              p.record_number && p.record_number.toLowerCase().includes(recordNumber.toLowerCase())
          );
        }

        // If still no match, try case-insensitive exact match
        if (!foundPatient) {
          foundPatient = allPatients.find(
            p => p.record_number && p.record_number.toLowerCase() === recordNumber.toLowerCase()
          );
        }

        if (foundPatient) {
          return foundPatient;
        }

        return null;
      } catch {
        // Error accessing patient suggestions
        return null;
      }
    },
    []
  );

  // Special search function for names that bypasses pagination
  const searchPatientByName = useCallback(async (name: string): Promise<Patient | null> => {
    try {
      // Use the enhanced getPatients method to get all patients without pagination
      const allPatientsResult = await dataService.getPatients({
        page: 1,
        pageSize: 10000 // Large enough to get all patients
      });
      const allPatients = allPatientsResult.data;

      // Try exact match first (case insensitive)
      let foundPatient = allPatients.find(
        p => p.name && p.name.toLowerCase() === name.toLowerCase()
      );

      // If no exact match, try partial match with priority for starts-with matches
      if (!foundPatient) {
        const searchLower = name.toLowerCase();

        // First, try to find patients where name starts with the search term
        foundPatient = allPatients.find(
          p => p.name && p.name.toLowerCase().startsWith(searchLower)
        );

        // If still no match, try includes match
        if (!foundPatient) {
          foundPatient = allPatients.find(
            p => p.name && p.name.toLowerCase().includes(searchLower)
          );
        }
      }

      // If still no match, try matching individual words in the name
      if (!foundPatient && name.includes(' ')) {
        const nameParts = name.toLowerCase().split(' ');
        foundPatient = allPatients.find(
          p => p.name && nameParts.every(part => p.name.toLowerCase().includes(part))
        );
      }

      // Try matching parts of the name (split by spaces)
      if (!foundPatient) {
        const searchParts = name.toLowerCase().split(' ');
        foundPatient = allPatients.find(p => {
          if (!p.name) return false;
          const patientNameParts = p.name.toLowerCase().split(' ');
          return searchParts.some(searchPart =>
            patientNameParts.some(
              patientPart => patientPart.includes(searchPart) || searchPart.includes(patientPart)
            )
          );
        });
      }

      if (foundPatient) {
          return foundPatient;
      }

      return null;
    } catch {
      // Error checking pre-selected patient
      return null;
    }
  }, []);

  // Trigger special search with performance optimizations
  useEffect(() => {
    // Don't search on empty input
    if (!debouncedPatientSearch || debouncedPatientSearch.length < 1) {
      setSpecialSearchResult(null);
      setIsSearchingByRecord(false);
      return;
    }

    const isRecordNumberSearch = /^PT\d+/.test(debouncedPatientSearch);

    if (isRecordNumberSearch && debouncedPatientSearch.length >= 8) {
      // Record number search - high priority, immediate search (reduced from 12 to 8 chars)
      setIsSearchingByRecord(true);
      searchPatientByRecordNumber(debouncedPatientSearch).then(patient => {
        setSpecialSearchResult(patient);
        setIsSearchingByRecord(false);
      });
    } else if (debouncedPatientSearch.length >= 2) {
      // For names and other searches, check if we need to do a full database search
      // Quick check against current patients (increased limit for better coverage)
      const normalSearchResults = patients
        .slice(0, 1000)
        .filter(
          p =>
            (p.name && p.name.toLowerCase().includes(debouncedPatientSearch.toLowerCase())) ||
            (p.record_number &&
              p.record_number.toLowerCase().includes(debouncedPatientSearch.toLowerCase())) ||
            (p.phone_number && p.phone_number.includes(debouncedPatientSearch))
        );


      // Improved logic: trigger full search if we have a large dataset OR if results seem limited
      const shouldDoFullSearch =
        patients.length > 10000 || // Large datasets always need full search
        normalSearchResults.length < 5 || // If we find very few results
        (debouncedPatientSearch.length >= 4 && normalSearchResults.length <= 10); // Specific searches

      if (shouldDoFullSearch && !isRecordNumberSearch) {
        setIsSearchingByRecord(true);

        // Add a small delay to prevent overwhelming the system with rapid searches
        const searchTimeout = setTimeout(() => {
          searchPatientByName(debouncedPatientSearch).then(patient => {
            setSpecialSearchResult(patient);
            setIsSearchingByRecord(false);
          });
        }, 200);

        return () => clearTimeout(searchTimeout);
      } else if (isRecordNumberSearch && normalSearchResults.length <= 1) {
        setIsSearchingByRecord(true);

        const searchTimeout = setTimeout(() => {
          searchPatientByRecordNumber(debouncedPatientSearch).then(patient => {
            setSpecialSearchResult(patient);
            setIsSearchingByRecord(false);
          });
        }, 200);

        return () => clearTimeout(searchTimeout);
      } else {
        setSpecialSearchResult(null);
        setIsSearchingByRecord(false);
      }
    }
  }, [debouncedPatientSearch, searchPatientByRecordNumber, searchPatientByName, patients]);

  // Simplified search state
  const [searchResults, setSearchResults] = useState<Patient[]>([]);

  // Simple and effective search using the proven SimpleDataService.getPatients method
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedPatientSearch) {
        setSearchResults([]);
        // setIsSearching(false); // Not needed for now
        return;
      }

      // setIsSearching(true); // Not needed for now

      try {
        // Use the same search logic that works in OptimizedPatientList
        const result = await dataService.getPatients({
          page: 1,
          pageSize: 100, // Show more results
          sortBy: 'name',
          sortOrder: 'asc',
          filter: {
            search: debouncedPatientSearch
          }
        });

        setSearchResults(result.data);
      } catch {
        setSearchResults([]);
      } finally {
        // setIsSearching(false); // Not needed for now
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [debouncedPatientSearch]);

  // Combine initial patients (for no search) with search results
  const filteredPatients = useMemo(() => {
    if (debouncedPatientSearch) {
      return searchResults;
    }

    // Show initial patients when no search term
    return patients.slice(0, 100); // Show first 100 initially
  }, [patients, searchResults, debouncedPatientSearch]);

  /* OLD COMPLEX SEARCH LOGIC - COMMENTED OUT
  const filteredPatients = useMemo(() => {
    // Check if this is a record number search
    const isRecordNumberSearch = /^PT\d+/.test(debouncedPatientSearch);

      search: debouncedPatientSearch,
      totalPatients: patients.length,
      hasLargeDataset: patients.length > 10000,
      specialSearchResult: specialSearchResult?.name,
      isSearchingByRecord,
      isRecordNumberSearch
    });

    // Only use special search result for exact record number matches
    // For name searches, always use the comprehensive search to show all matches
    if (specialSearchResult && isRecordNumberSearch) {
      return [specialSearchResult];
    }

    // If we have a special search result for names, add it to the results but don't limit to just that one
    let additionalResults: Patient[] = [];
    if (specialSearchResult && !isRecordNumberSearch) {
      additionalResults = [specialSearchResult];
    }

    if (!debouncedPatientSearch) {
      // Show first 100 patients initially so users can see some patients without searching
      return patients.slice(0, 100);
    }

    // For very large datasets, require at least 2 characters for search to avoid performance issues
    if (patients.length > 50000 && debouncedPatientSearch.length < 2) {
      return [];
    }

    const searchLower = debouncedPatientSearch.toLowerCase();

    // Performance optimization: increase search results limit and improve logic
    const maxResults = patients.length > 50000 ? 300 : patients.length > 10000 ? 1000 : patients.length;
    const filtered = [];

      searchLower,
      maxResults,
      totalPatients: patients.length
    });

    // Improved search algorithm with better matching
    // For large datasets, search through more patients to ensure comprehensive results
    const searchLimit = patients.length > 10000 ? Math.min(patients.length, 10000) : patients.length;

      searchLower,
      searchLimit,
      maxResults,
      totalPatients: patients.length,
      firstPatient: patients[0]?.name,
      searchExample: patients.find(p => p.name?.toLowerCase().includes('diah'))?.name
    });

    for (let i = 0; i < searchLimit && filtered.length < maxResults; i++) {
      const patient = patients[i];

      // More comprehensive name matching - check if search term appears anywhere in name
      const nameMatch = patient.name && patient.name.toLowerCase().includes(searchLower);

      // Debug logging for the specific problematic cases
      if (searchLower === 'diah' && patient.name?.toLowerCase().includes('diah')) {
          patientName: patient.name,
          patientId: patient.id,
          recordNumber: patient.record_number,
          nameMatch,
          index: i
        });
      }

      if (searchLower === 'muji' && patient.name?.toLowerCase().includes('muji')) {
          patientName: patient.name,
          patientId: patient.id,
          recordNumber: patient.record_number,
          nameMatch,
          index: i
        });
      }

      // Exact record number match gets higher priority
      const recordMatch = patient.record_number && (
        patient.record_number.toLowerCase() === searchLower ||
        patient.record_number.toLowerCase().includes(searchLower)
      );

      // Phone number matching
      const phoneMatch = patient.phone_number && patient.phone_number.includes(debouncedPatientSearch);

      // Also check for partial matches in the middle of names/records
      const partialMatch = patient.name && patient.name.toLowerCase().split(' ').some(word =>
        word.includes(searchLower)
      );

      const matches = nameMatch || recordMatch || phoneMatch || partialMatch;

      if (matches) {
        filtered.push(patient);
      }
    }

      search: debouncedPatientSearch,
      totalPatients: patients.length,
      resultCount: filtered.length,
      maxResults,
      isLargeDataset: patients.length > 10000
    });

    // Additional logging for our specific test cases
    if (debouncedPatientSearch.toLowerCase() === 'diah') {
        searchTerm: debouncedPatientSearch,
        foundResults: filtered.length,
        resultNames: filtered.map(p => p.name),
        hasDiahFauziah: filtered.some(p => p.name?.toLowerCase().includes('diah fauziah'))
      });
    }

    if (debouncedPatientSearch.toLowerCase() === 'muji') {
        searchTerm: debouncedPatientSearch,
        foundResults: filtered.length,
        resultNames: filtered.map(p => p.name),
        hasMujiyono: filtered.some(p => p.name?.toLowerCase().includes('mujiyono'))
      });
    }

    // Combine regular search results with additional special search results
    // Remove duplicates that might appear in both arrays
    const allResults = [...filtered, ...additionalResults];
    const uniqueResults = allResults.filter((patient, index, self) =>
      index === self.findIndex((p) => p.id === patient.id)
    );

    // Sort results: prioritize starts-with matches, then alphabetical
    uniqueResults.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const searchTerm = searchLower; // Use existing searchLower variable

      const aStarts = aName.startsWith(searchTerm);
      const bStarts = bName.startsWith(searchTerm);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return aName.localeCompare(bName);
    });

      originalFiltered: filtered.length,
      additionalResults: additionalResults.length,
      uniqueResults: uniqueResults.length,
      resultNames: uniqueResults.map(p => p.name)
    });

    return uniqueResults;
  }, [patients, debouncedPatientSearch, specialSearchResult, isSearchingByRecord]);
  */

  // Handle clicks outside the dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close patient dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        patientInputRef.current &&
        !patientInputRef.current.contains(event.target as Node)
      ) {
        setShowPatientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [showPatientDropdown]);

  useEffect(() => {
    calculateTotalPrice();
  }, [calculateTotalPrice]);

  const loadData = async (_hasPreSelectedPatient = false, _forceRefresh = false) => {
    try {

      // Always try to get all patients to ensure comprehensive search
      const allPatientsResult = await dataService.getPatients({
        page: 1,
        pageSize: 10000 // Large enough to get all patients
      });
      const allPatients = allPatientsResult.data;

      // If we have too many patients (performance concern), limit to first 1000 for display
      // but keep the full list for searching
      const displayPatients = allPatients.length > 1000 ? allPatients.slice(0, 1000) : allPatients;
      setPatients(displayPatients);

      // Store the full patient list in a ref for comprehensive searching
      if (allPatients.length > 1000) {
        // You could store this in a ref if needed for future searches
      }

      // Load other data - we'll need to access UnifiedStorage directly for operators, treatments, etc.
      // since dataService doesn't have those methods yet
      const { storage } = await import('../services/UnifiedStorage');
      const [storedOperators, storedTreatments, storedCustomExaminations] = await Promise.all([
        storage.getOperators(),
        storage.getTreatments(),
        storage.getCustomExaminations()
      ]);

      setOperators(storedOperators);

      setTreatments(storedTreatments);

      setCustomExaminations(storedCustomExaminations);

    } catch {
      // Error loading custom examinations from localStorage
    }
  };

  // Add manual reload function
  const reloadData = () => {
    loadData(preSelectedPatientId !== null); // Pass true if we have a pre-selected patient
  };

  // Effect to handle pre-selected patient after patients are loaded
  useEffect(() => {

    // Only proceed if we have patients and a pre-selected patient ID, and we haven't already selected someone
    if (patients.length > 0 && preSelectedPatientId !== null && !selectedPatient) {
      const patient = patients.find(p => p.id === preSelectedPatientId);

      if (patient) {
        handlePatientSelect(patient);
        setPreSelectedPatientId(null); // Clear the pre-selected ID after using it
      } else {
        // If not found in current loaded patients, try to search for it specifically
        searchForPreSelectedPatient(preSelectedPatientId);
      }
    }
  }, [
    patients,
    preSelectedPatientId,
    hasInitialized,
    selectedPatient,
    searchForPreSelectedPatient
  ]); // Include selectedPatient in dependencies

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name.startsWith('vitalSigns.')) {
      const vitalField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vitalSigns: {
          ...prev.vitalSigns,
          [vitalField]:
            vitalField === 'bloodPressure' ? value : value === '' ? '' : parseInt(value) || 0
        }
      }));
    } else if (name.startsWith('custom_')) {
      // Handle custom examination inputs
      setFormData(prev => ({
        ...prev,
        vitalSigns: {
          ...prev.vitalSigns,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePatientSearch = (value: string) => {
    setPatientSearch(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search (PERFORMANCE OPTIMIZED)
    searchTimeoutRef.current = setTimeout(async () => {
      setDebouncedPatientSearch(value);

      // PERFORMANCE OPTIMIZATION: Only reload patient data if we have a very small dataset
      // For large datasets (1000+ patients), avoid full reloads during search
      // The special search functions will handle finding patients outside the current dataset
      if (value.trim() && value.length >= 2 && patients.length < 200) {
        try {
          const patientsResult = await dataService.getPatients({
            page: 1,
            pageSize: 200
          });
          setPatients(patientsResult.data);
        } catch {
      // Error handled
    }
      }
    }, 300); // Reduced debounce delay for better UX, but rely on optimized search
  };

  const handleInputFocus = useCallback(async () => {
    if (patientInputRef.current) {
      const rect = patientInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
      setShowPatientDropdown(true);

      // Force fresh data when focusing on search input
      try {
        await dataService.clearCache();
        const patientsResult = await dataService.getPatients({
          page: 1,
          pageSize: 1000
        });
        setPatients(patientsResult.data);
      } catch {
      // Error handled
    }
    }
  }, []);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: (patient.id ?? 0).toString() // Keep as string for consistency
    }));
    setPatientSearch(patient.name); // Update input to show selected patient name
    setShowPatientDropdown(false);

    // Also update debounced search to ensure filtering works
    setDebouncedPatientSearch(patient.name);
  };

  const handleClearPatientSelection = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setDebouncedPatientSearch('');
    setFormData(prev => ({
      ...prev,
      patientId: ''
    }));
    setShowPatientDropdown(false);
    if (patientInputRef.current) {
      patientInputRef.current.focus();
    }
  };

  const validateForm = (): boolean => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return false;
    }
    if (!formData.operatorId) {
      setError('Please select an operator');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedTreatmentData = treatments.find(t => t.id === formData.selectedTreatment);
      const selectedOperator = operators.find(op => op.id === parseInt(formData.operatorId));

      const newAppointment = {
        patientName: selectedPatient?.name || '',
        patientId: selectedPatient?.id || 0,
        operatorName: selectedOperator?.name || '',
        operatorId: selectedOperator?.id || 0,
        date: new Date().toISOString(),
        vitalSigns: {
          bloodPressure: formData.vitalSigns.bloodPressure.trim() || 'Not recorded',
          respirationRate: formData.vitalSigns.respirationRate || 0,
          heartRate: formData.vitalSigns.heartRate || 0,
          borgScale: formData.vitalSigns.borgScale,
          // Include custom examinations
          ...Object.fromEntries(
            customExaminations.map(exam => [
              `custom_${exam.id}`,
              {
                name: exam.name,
                unit: exam.unit,
                value:
                  (formData.vitalSigns[`custom_${exam.id}`] as string)?.trim() || 'Not recorded'
              }
            ])
          )
        },
        treatments: selectedTreatmentData ? [selectedTreatmentData] : [],
        totalPrice: totalPrice
      };

      // Create appointment using the unified storage system
      const { storage } = await import('../services/UnifiedStorage');
      const appointments = await storage.getAppointments();
      const maxId = appointments.length > 0 ? Math.max(...appointments.map(a => a.id || 0)) : 0;
      const savedAppointment = {
        ...newAppointment,
        id: maxId + 1,
        created_at: new Date().toISOString()
      };

      appointments.push(savedAppointment);
      await storage.storeAppointments(appointments);

      // Clear the cache to ensure fresh data
      await dataService.clearCache();

      // Log appointment creation
      log.info(
        'Appointment created successfully',
        {
          id: savedAppointment.id,
          patientId: savedAppointment.patientId,
          patientName: savedAppointment.patientName
        },
        'NewAppointment'
      );

      navigate(`/appointments/${savedAppointment.id}`);
    } catch {
      setError('Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
    checkForPreSelectedPatient();
  }, [checkForPreSelectedPatient]);

  // Reload data when search changes to ensure we have the latest data
  useEffect(() => {
    if (patientSearch && patientSearch.length > 2) {
      // Reload data when user starts typing to ensure latest data is available
      const reloadDataWithSearch = async () => {
        try {
          const patientsResult = await dataService.getPatients({
            page: 1,
            pageSize: 1000
          });
          setPatients(patientsResult.data);
        } catch {
      // Error handled
    }
      };

      // Debounce the reload to avoid too many calls
      const timeoutId = setTimeout(reloadDataWithSearch, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [patientSearch]);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#020618'
      }}
    >
      {/* Header with Back button and title */}
      <Box sx={{ p: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant='outlined'
              startDecorator={<ArrowBack />}
              onClick={() => navigate('/appointments')}
              sx={{ borderRadius: 'sm' }}
            >
              Back to Appointments
            </Button>
            <Typography level='h3'>New Appointment</Typography>
          </Box>
          <Button size='sm' variant='outlined' onClick={reloadData} startDecorator={<Refresh />}>
            Reload
          </Button>
        </Box>

        {_error && (
          <Alert color='danger' sx={{ mb: 3 }} startDecorator={<Info />}>
            {_error}
          </Alert>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, px: 3, pb: 3, overflowY: 'auto' }}>
        <Card>
          <form onSubmit={handleSubmit}>
            <Box
              sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}
            >
              {/* Patient Selection */}
              <FormControl sx={{ maxWidth: '600px' }}>
                <FormLabel>Patient *</FormLabel>
                <Box sx={{ position: 'relative' }}>
                  <Input
                    ref={patientInputRef}
                    startDecorator={<Search sx={{ color: 'white' }} />}
                    endDecorator={
                      patientSearch ? (
                        <IconButton
                          size='sm'
                          variant='plain'
                          onClick={handleClearPatientSelection}
                          sx={{
                            color: 'white !important',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            },
                            '& svg': {
                              color: 'white !important'
                            }
                          }}
                        >
                          <Clear sx={{ fontSize: '16px', color: 'white' }} />
                        </IconButton>
                      ) : null
                    }
                    placeholder='Search and select a patient...'
                    value={patientSearch}
                    onChange={e => handlePatientSearch(e.target.value)}
                    onFocus={handleInputFocus}
                    onClick={handleInputFocus}
                    required
                    sx={{
                      maxWidth: '600px',
                      '&::placeholder': {
                        color: 'lightgray'
                      }
                    }}
                  />

                  {/* Selected Patient Indicator */}
                  {selectedPatient && (
                    <Typography
                      level='body-xs'
                      sx={{
                        mt: 0.5,
                        color: '#ccc',
                        fontSize: '12px'
                      }}
                    >
                      Selected: <span style={{ color: 'white' }}>{selectedPatient.name}</span>
                      {selectedPatient.record_number && ` (${selectedPatient.record_number})`}
                    </Typography>
                  )}

                  {/* Patient Dropdown - Using Portal to render outside normal flow */}
                  {showPatientDropdown &&
                    createPortal(
                      <Box
                        ref={dropdownRef}
                        sx={{
                          position: 'fixed',
                          backgroundColor: '#2d2d2d',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                          zIndex: 9999,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`,
                          width: `${dropdownPosition.width}px`
                        }}
                      >
                        {_isSearchingByRecord ? (
                          <Box sx={{ p: 3, color: '#fff', textAlign: 'center' }}>
                            <div style={{ color: '#ffffff', marginBottom: '8px' }}>Loading...</div>
                            <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                              Searching entire database...
                            </Typography>
                            <Typography level='body-xs' sx={{ color: '#ccc', mt: 1 }}>
                              Searching through {patients.length.toLocaleString()}+ patients
                            </Typography>
                          </Box>
                        ) : filteredPatients.length === 0 ? (
                          <Box sx={{ p: 2, color: '#fff' }}>
                            <Typography sx={{ mb: 1 }}>No patients found</Typography>
                            <Typography level='body-xs' sx={{ color: '#ccc' }}>
                              Search term: "{debouncedPatientSearch}"
                            </Typography>
                            <Typography level='body-xs' sx={{ color: '#ccc' }}>
                              Total patients loaded: {patients.length.toLocaleString()}
                            </Typography>
                            <Typography level='body-xs' sx={{ color: '#ccc' }}>
                              Try searching by name, record number, or phone number
                            </Typography>
                            <Typography level='body-xs' sx={{ color: '#ccc', mt: 1 }}>
                              Debug: Check browser console for search details
                            </Typography>
                          </Box>
                        ) : (
                          filteredPatients.slice(0, 10).map(patient => (
                            <Box
                              key={patient.id}
                              onClick={() => handlePatientSelect(patient)}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                color: '#fff',
                                borderBottom: '1px solid #444',
                                '&:hover': {
                                  backgroundColor: '#3d3d3d'
                                }
                              }}
                            >
                              <Box>
                                <Typography level='body-sm' fontWeight='bold'>
                                  {patient.name}
                                </Typography>
                                <Typography level='body-xs' sx={{ color: '#ccc' }}>
                                  {patient.record_number} • {patient.age} years
                                </Typography>
                                {patient.phone_number && (
                                  <Typography level='body-xs' sx={{ color: '#ccc' }}>
                                    {patient.phone_number}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          ))
                        )}
                      </Box>,
                      document.body
                    )}
                </Box>
              </FormControl>

              {/* Operator Selection */}
              <FormControl sx={{ maxWidth: '600px' }}>
                <FormLabel>Operator *</FormLabel>
                <Select
                  value={formData.operatorId}
                  onChange={(_, value) =>
                    setFormData(prev => ({ ...prev, operatorId: value || '' }))
                  }
                  required
                  sx={{
                    maxWidth: '600px',
                    color: 'white',
                    '& .MuiSelect-select': {
                      color: 'white'
                    },
                    '& .MuiSelect-indicator': {
                      color: 'white !important'
                    },
                    '& svg': {
                      color: 'white !important'
                    }
                  }}
                >
                  {operators.map(operator => (
                    <Option
                      key={operator.id}
                      value={operator.id.toString()}
                      sx={{ color: 'white' }}
                    >
                      {operator.name}
                    </Option>
                  ))}
                </Select>
                {operators.length === 0 ? (
                  <Alert color='warning' sx={{ mt: 1 }}>
                    No operator created. Go make one in Settings &gt; Operator Management
                  </Alert>
                ) : (
                  <Typography level='body-xs' sx={{ color: '#ccc', mt: 1 }}>
                    {operators.length} operator{operators.length !== 1 ? 's' : ''} loaded
                  </Typography>
                )}
              </FormControl>

              {/* Vital Signs */}
              <Box sx={{ maxWidth: '600px' }}>
                <Typography level='h4' sx={{ mb: 2 }}>
                  Vital Signs
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 2
                  }}
                >
                  <FormControl>
                    <FormLabel>Blood Pressure</FormLabel>
                    <Input
                      name='vitalSigns.bloodPressure'
                      placeholder='e.g., 120/80 (optional)'
                      value={formData.vitalSigns.bloodPressure}
                      onChange={handleInputChange('bloodPressure')}
                      sx={{
                        maxWidth: '600px',
                        '&::placeholder': {
                          color: 'lightgray'
                        }
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Respiration Rate (breaths/min)</FormLabel>
                    <Input
                      name='vitalSigns.respirationRate'
                      type='number'
                      value={formData.vitalSigns.respirationRate || ''}
                      onChange={handleInputChange('respirationRate')}
                      sx={{ maxWidth: '600px' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Heart Rate (bpm)</FormLabel>
                    <Input
                      name='vitalSigns.heartRate'
                      type='number'
                      value={formData.vitalSigns.heartRate || ''}
                      onChange={handleInputChange('heartRate')}
                      sx={{ maxWidth: '600px' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Borg Scale (1-10)</FormLabel>
                    <Input
                      name='vitalSigns.borgScale'
                      type='number'
                      value={formData.vitalSigns.borgScale || ''}
                      onChange={handleInputChange('borgScale')}
                      sx={{ maxWidth: '600px' }}
                    />
                  </FormControl>
                </Box>
                <Typography level='body-xs' sx={{ mt: 1, color: 'text.secondary' }}>
                  1: Very light | 4: Somewhat hard | 7: Very hard | 10: Maximal exertion
                </Typography>
              </Box>

              {/* Custom Examinations */}
              {customExaminations.length > 0 && (
                <Box sx={{ maxWidth: '600px' }}>
                  <Typography level='h4' sx={{ mb: 2 }}>
                    Custom Examinations
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: 2
                    }}
                  >
                    {customExaminations.map(exam => (
                      <FormControl key={exam.id}>
                        <FormLabel>
                          {exam.name} ({exam.unit})
                        </FormLabel>
                        <Input
                          name={`custom_${exam.id}`}
                          placeholder={`Enter ${exam.name.toLowerCase()}`}
                          value={(formData.vitalSigns[`custom_${exam.id}`] as string) || ''}
                          onChange={handleInputChange(`custom_${exam.id}`)}
                          sx={{
                            maxWidth: '600px',
                            '&::placeholder': {
                              color: 'lightgray'
                            }
                          }}
                        />
                      </FormControl>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Treatment Selection */}
              <Box sx={{ maxWidth: '600px' }}>
                <Typography level='h4' sx={{ mb: 2 }}>
                  Treatment
                </Typography>
                <FormControl>
                  <FormLabel>Select Treatment *</FormLabel>
                  <Select
                    value={formData.selectedTreatment?.toString() || ''}
                    onChange={(_, value) =>
                      setFormData(prev => ({
                        ...prev,
                        selectedTreatment: value ? parseInt(value) : null
                      }))
                    }
                    required
                    sx={{
                      maxWidth: '600px',
                      color: 'white',
                      '& .MuiSelect-select': {
                        color: 'white'
                      }
                    }}
                  >
                    <Option value='' sx={{ color: 'white' }}>
                      Select a treatment
                    </Option>
                    {treatments.map(treatment => (
                      <Option
                        key={treatment.id}
                        value={treatment.id.toString()}
                        sx={{ color: 'white' }}
                      >
                        {treatment.name} - {formatCurrency(treatment.price)}
                      </Option>
                    ))}
                  </Select>
                  {treatments.length === 0 && (
                    <Alert color='warning' sx={{ mt: 1 }}>
                      You don't have any Treatments yet. To add Treatments, go to Settings &gt;
                      Treatments &gt; Add Treatment
                    </Alert>
                  )}
                </FormControl>
              </Box>

              {/* Total Price Display */}
              <Box sx={{ textAlign: 'left', mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography level='h4'>Total Price:</Typography>
                  <Typography level='h3' color='primary'>
                    {formatCurrency(totalPrice)}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Stack direction='row' spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant='outlined'
                  onClick={() => navigate('/appointments')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  loading={loading}
                  startDecorator={<Save />}
                  disabled={loading}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Create Appointment
                </Button>
              </Stack>
            </Box>
          </form>
        </Card>
      </Box>
    </Box>
  );
};

export default NewAppointment;
