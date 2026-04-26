import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDemoModal } from '../context/DemoModalContext';
import { UploadCloud, PhoneCall, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Users, ArrowLeft, Package, Download, Brain, Target, TrendingUp, Search, Eye, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, DatabaseIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { motion } from 'motion/react';
import { useSmartDropState } from '../hooks/useSmartDropState';
import SmartDropStatistics from '../components/SmartDropStatistics';
import SmartDropDashboard from '../components/SmartDropDashboard';
import TimeSavingsTracker from '../components/TimeSavingsTracker';
import { SectionTransition } from '../components/PageTransition';
import { OptimizedCard } from '../components/OptimizedComponents';
import { useDebounce, useSmoothScroll } from '../hooks/usePerformance';

// Floating elements for SmartDrop page
const FloatingSmartDropElements = ({ scrollY }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Floating elements with cyan/blue theme */}
      <div 
        className="absolute top-16 left-8 w-10 h-10 bg-gradient-to-br from-cyan-400/25 to-blue-500/25 rounded-lg animate-float1 shadow-lg flex items-center justify-center"
        style={{ transform: `translateY(${scrollY * -0.15}px)` }}
      >
        <PhoneCall className="w-5 h-5 text-cyan-500/70" />
      </div>
      
      <div 
        className="absolute top-24 right-12 w-8 h-8 bg-gradient-to-br from-blue-400/25 to-sky-500/25 rounded-md animate-float2 shadow-lg flex items-center justify-center"
        style={{ transform: `translateY(${scrollY * -0.2}px)` }}
      >
        <Package className="w-4 h-4 text-blue-500/70" />
      </div>
      
      <div 
        className="absolute top-1/3 left-12 w-12 h-12 bg-gradient-to-br from-cyan-400/25 to-blue-500/25 rounded-xl animate-float3 shadow-lg flex items-center justify-center"
        style={{ transform: `translateY(${scrollY * -0.1}px)` }}
      >
        <Users className="w-6 h-6 text-cyan-500/70 animate-pulse" />
      </div>
      
      <div 
        className="absolute bottom-32 right-8 w-6 h-6 bg-gradient-to-br from-sky-400/25 to-blue-500/25 rounded-full animate-float1 shadow-lg flex items-center justify-center"
        style={{ transform: `translateY(${scrollY * -0.25}px)` }}
      >
        <Target className="w-3 h-3 text-sky-500/70" />
      </div>
      
      <div 
        className="absolute bottom-16 left-1/4 w-14 h-14 bg-gradient-to-br from-blue-500/25 to-cyan-600/25 rounded-2xl animate-float2 shadow-lg flex items-center justify-center"
        style={{ transform: `translateY(${scrollY * -0.18}px)` }}
      >
        <TrendingUp className="w-7 h-7 text-blue-500/70 animate-bounce" />
      </div>
    </div>
  );
};

const API_BASE = 'https://predelix-242m.onrender.com/api';

function SmartDrop() {
  // Navbar height (px)
  const NAVBAR_HEIGHT = 66;
  
  // Use persisted state for user data
  const {
    csvFile, setCsvFile,
    csvData, setCsvData,
    uploaded, setUploaded,
    uploadError, setUploadError,
    callDone, setCallDone,
    callError, setCallError,
    responses, setResponses,
    responseError, setResponseError,
    showResponses, setShowResponses,
    searchTerm, setSearchTerm,
    sortField, setSortField,
    sortDirection, setSortDirection,
    currentPage, setCurrentPage,
    isUploadDataStale,
    isCallDataStale,
    isResponseDataStale,
    isReturningSession,
    resetSmartDropState
  } = useSmartDropState();
  
  // Non-persisted state (temporary UI state)
  const [uploading, setUploading] = useState(false);
  const [calling, setCalling] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [itemsPerPage] = useState(8);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [waitingForResults, setWaitingForResults] = useState(false);
  // Use global demo modal context
  const { showDemoModal, setShowDemoModal } = useDemoModal();
  
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show restoration notification when component mounts with existing data
  useEffect(() => {
    if (isReturningSession && (csvFile || csvData || uploaded || responses)) {
      console.log('SmartDrop page state restored from previous session');
      
      // Check if data is stale and notify user
      if (isUploadDataStale() && uploaded) {
        console.warn('Upload data is stale (>15 minutes old). Consider re-uploading.');
      }
      if (isCallDataStale() && callDone) {
        console.warn('Call data is stale (>15 minutes old). Consider making new calls.');
      }
      if (isResponseDataStale() && responses) {
        console.warn('Response data is stale (>15 minutes old). Consider refreshing responses.');
      }
    }
  }, []); // Empty dependency array - only run on mount

  // Demo modal logic - always show on mount, hide only when dismissed
  // Show demo modal on first mount if not dismissed (handled by context)

  // Timer effect for waiting for call results
  useEffect(() => {
    let interval;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            setWaitingForResults(false);
            // Auto-fetch results when timer completes
            handleFetchResults();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handlers
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      showLoading("Processing file...");
      setCsvFile(selectedFile);
      setCsvData(null);
      setUploaded(false);
      setUploadError(null);
      setCallDone(false);
      setResponses(null);
      setShowResponses(false);
      hideLoading();
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    
    setUploading(true);
    setUploadError(null);
    setUploaded(false);
    setCsvData(null);
    setCallDone(false);
    setResponses(null);
    setShowResponses(false);
    showLoading("Uploading and processing customer data...");
    
    try {
      // Parse CSV for preview first (before upload)
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      const rows = lines.slice(1, Math.min(6, lines.length)).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      // Now attempt the upload
      const formData = new FormData();
      formData.append('file', csvFile);
      
      console.log('Attempting upload to:', `${API_BASE}/upload_customers`);
      console.log('File details:', {
        name: csvFile.name,
        size: csvFile.size,
        type: csvFile.type
      });

      const res = await fetch(`${API_BASE}/upload_customers`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Upload failed: ${res.status} ${res.statusText}. ${errorText}`);
      }

      const responseData = await res.json();
      console.log('Upload successful:', responseData);
      
      // Set the parsed CSV data for preview
      setCsvData({ headers, rows, totalRows: lines.length - 1 });
      setUploaded(true);
      
    } catch (err) {
      console.error('Upload error:', err);
      let errorMessage = 'Failed to upload CSV. ';
      
      if (err.message.includes('fetch')) {
        errorMessage += 'Network error - please check your connection and try again.';
      } else if (err.message.includes('CSV file must contain')) {
        errorMessage += err.message;
      } else if (err.message.includes('Upload failed:')) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please ensure your file is a valid CSV format and try again.';
      }
      
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
      hideLoading();
    }
  };

  const handleLoadDemoData = async () => {
    setIsLoadingDemo(true);
    setUploadError(null);
    setUploaded(false);
    setCsvData(null);
    setCallDone(false);
    setResponses(null);
    setShowResponses(false);
    showLoading("Loading demo customer data...");
    
    try {
      // Fetch the demo CSV file from public folder
      const response = await fetch('/input.csv');
      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Demo CSV file is invalid');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      const rows = lines.slice(1, Math.min(6, lines.length)).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      // Create a File object from the CSV text
      const blob = new Blob([csvText], { type: 'text/csv' });
      const demoFile = new File([blob], 'demo-input.csv', { type: 'text/csv' });
      
      // Upload the demo file to the server
      const formData = new FormData();
      formData.append('file', demoFile);
      
      const uploadRes = await fetch(`${API_BASE}/upload_customers`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Demo upload failed: ${uploadRes.status} ${uploadRes.statusText}. ${errorText}`);
      }

      const responseData = await uploadRes.json();
      console.log('Demo upload successful:', responseData);
      
      // Set the demo file and data
      setCsvFile(demoFile);
      setCsvData({ headers, rows, totalRows: lines.length - 1 });
      setUploaded(true);
      
    } catch (err) {
      console.error('Demo data error:', err);
      setUploadError(`Failed to load demo data: ${err.message}`);
    } finally {
      setIsLoadingDemo(false);
      hideLoading();
    }
  };

  const handleMakeCalls = async () => {
    setCalling(true);
    setCallError(null);
    setCallDone(false);
    setResponses(null);
    setShowResponses(false);
    setLoadingResponses(false);
    setWaitingForResults(false);
    setTimerActive(false);
    showLoading("Initiating customer calls...");
    
    try {
      const res = await fetch(`${API_BASE}/trigger_calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_base_url: window.location.origin }),
      });
      if (!res.ok) throw new Error('Call trigger failed');
      
      setCallDone(true);
      setWaitingForResults(true);
      setTimer(180); // 3 minutes = 180 seconds
      setTimerActive(true);
      hideLoading();
      
    } catch (err) {
      setCallError('Failed to trigger calls. Please try again.');
      hideLoading();
    } finally {
      setCalling(false);
    }
  };

  const handleFetchResults = async () => {
    setLoadingResponses(true);
    setResponseError(null);
    setResponses(null);
    setShowResponses(false);
    showLoading("Fetching call responses...");
    
    try {
      const res = await fetch(`${API_BASE}/results`);
      if (!res.ok) throw new Error('Failed to fetch responses');
      const data = await res.json();
      
      if (!data || data.length === 0) {
        setResponses([]);
        setResponseError('No responses received yet. Calls may still be in progress or customers haven\'t responded.');
      } else {
        setResponses(data);
        setShowResponses(true);
        setWaitingForResults(false);
      }
    } catch (err) {
      setResponseError('Failed to fetch responses. Please try again later.');
    } finally {
      setLoadingResponses(false);
      hideLoading();
    }
  };

  const handleViewResponses = async () => {
    handleFetchResults();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-cyan-600" /> : 
      <ArrowDown className="w-4 h-4 text-cyan-600" />;
  };

  // Data processing for table
  const filteredAndSortedData = useMemo(() => {
    if (!responses || responses.length === 0) return [];
    
    let filtered = responses.filter(item =>
      Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [responses, searchTerm, sortField, sortDirection]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
    
    return { totalPages, startIndex, paginatedData };
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const { totalPages, startIndex, paginatedData } = paginationData;

  const csvPreviewData = useMemo(() => {
    if (!csvData) return null;
    return {
      headers: csvData.headers,
      rows: csvData.rows,
      hasData: csvData.headers && csvData.rows && csvData.headers.length > 0
    };
  }, [csvData]);

  // UI
  return (
    <div className="min-h-screen theme-gradient-bg flex flex-col overflow-x-hidden transition-all duration-300">
      {/* Enhanced Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_60%,rgba(6,182,212,0.08),rgba(255,255,255,0.9))]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.06),transparent)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.06),transparent)]"></div>
        
        {/* Animated background shapes */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-cyan-400/8 to-blue-500/8 rounded-full animate-morph-slow"></div>
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-gradient-to-br from-blue-400/8 to-sky-500/8 rounded-full animate-morph-medium"></div>
      </div>
      
      <FloatingSmartDropElements scrollY={scrollY} />
      
      <div 
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: NAVBAR_HEIGHT + 32, paddingBottom: 32 }}
      >
        {/* Enhanced Header */}
        <div 
          className="text-center mb-12 transform transition-all duration-1000"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        >
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <h1 className="relative text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 bg-clip-text text-transparent mb-4 animate-slideInUp">
              SmartDrop Delivery Service
            </h1>
          </div>
          <p className="text-lg text-sky-600 max-w-3xl mx-auto leading-relaxed animate-slideInUp animation-delay-200">
            Automate your delivery confirmation calls with 
            <span className="font-semibold text-cyan-600 animate-pulse"> AI-powered communication</span>
          </p>
        </div>

        {/* Data Restoration Notification */}
        {isReturningSession && (csvFile || csvData || uploaded || responses) && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 animate-slideInUp">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-800">Previous Session Restored</h4>
                <p className="text-sm text-blue-600">
                  Your delivery call progress has been automatically saved and restored.
                  {(isUploadDataStale() && uploaded) || (isCallDataStale() && callDone) || (isResponseDataStale() && responses) ? (
                    <span className="text-amber-600 ml-1">(Some data is over 15 minutes old - consider refreshing)</span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={resetSmartDropState}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors duration-200"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Step 1: CSV Upload Section */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8 animate-slideInUp animation-delay-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center animate-pulse">
                  <UploadCloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-sky-700">Upload Customer Data</h2>
                  <p className="text-sm text-sky-600">Upload your customer CSV file to begin automated delivery calls</p>
                </div>
              </div>
              
              {/* Small Demo Data Button */}
              <button
                type="button"
                onClick={handleLoadDemoData}
                disabled={uploading || calling || isLoadingDemo}
                className={`group relative px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 transform hover:scale-105 border
                  ${uploading || calling || isLoadingDemo
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400' 
                    : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 hover:border-yellow-400 text-yellow-700 hover:text-yellow-800 shadow-md hover:shadow-lg'
                  }`}
              >
                <DatabaseIcon className="h-4 w-4" />
                <span className="text-sm">Demo Data</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* File Upload Area */}
              <div className="relative text-center p-8 border-2 border-dashed border-cyan-300/60 rounded-xl bg-gradient-to-br from-cyan-50/50 to-blue-50/50 hover:from-cyan-50 hover:to-blue-50 transition-all duration-300 cursor-pointer group hover:border-cyan-400/80">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                  disabled={uploading || calling}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <FileSpreadsheet className="relative h-12 w-12 mx-auto text-cyan-500 mb-4 animate-float1" />
                  </div>
                  <p className="text-sky-800 font-medium mb-2">
                    {csvFile ? (
                      <span className="flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5 animate-bounce text-cyan-600" />
                        <span className="text-cyan-700">{csvFile.name}</span>
                      </span>
                    ) : (
                      "Select your customer CSV file"
                    )}
                  </p>
                  <p className="text-sm text-sky-600">
                    Drag & drop your CSV file here or click to browse
                  </p>
                </label>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!csvFile || uploading || calling}
                className={`group relative w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 overflow-hidden
                  ${!csvFile || uploading || calling
                    ? 'bg-gray-200 cursor-not-allowed text-gray-400' 
                    : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 hover:from-cyan-600 hover:via-blue-600 hover:to-sky-600 text-white shadow-xl hover:shadow-2xl'
                  }`}
              >
                <div className="relative z-10 flex items-center gap-3">
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-5 w-5 animate-pulse" />
                      <span>Upload Customer Data</span>
                      <FileSpreadsheet className="h-5 w-5 group-hover:animate-bounce" />
                    </>
                  )}
                </div>
              </button>

              {/* Test CSV Preview Button (Development) */}
              {csvFile && !uploaded && !uploading && (
                <button
                  onClick={async () => {
                    try {
                      showLoading("Processing CSV preview...");
                      const text = await csvFile.text();
                      const lines = text.split('\n').filter(line => line.trim());
                      
                      if (lines.length < 2) {
                        setUploadError('CSV file must contain at least a header row and one data row');
                        return;
                      }

                      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
                      const rows = lines.slice(1, Math.min(6, lines.length)).map(line => {
                        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
                        const row = {};
                        headers.forEach((header, index) => {
                          row[header] = values[index] || '';
                        });
                        return row;
                      });

                      setCsvData({ headers, rows, totalRows: lines.length - 1 });
                      setUploaded(true);
                      setUploadError(null);
                    } catch (err) {
                      setUploadError('Failed to parse CSV file. Please check the format.');
                    } finally {
                      hideLoading();
                    }
                  }}
                  className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview CSV (Skip Upload)
                </button>
              )}

              {/* Upload Status */}
              {uploaded && csvData && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                    <div className="flex items-center justify-center gap-2 text-cyan-700">
                      <CheckCircle className="w-5 h-5 animate-bounce" />
                      <span className="text-sm font-medium">CSV uploaded successfully! Preview of your data:</span>
                    </div>
                  </div>
                  
                  {/* CSV Data Preview */}
                  <div className="bg-white border border-cyan-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 border-b border-cyan-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-cyan-700">Data Preview</h4>
                        <div className="flex items-center gap-2 text-sm text-cyan-600">
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>{csvData.totalRows} total customers</span>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {csvData.headers.map((header, idx) => (
                              <th key={idx} className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {csvData.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {csvData.headers.map((header, headerIdx) => (
                                <td key={headerIdx} className="px-4 py-3 text-gray-900">
                                  {row[header]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvData.totalRows > 5 && (
                      <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600 border-t border-gray-200">
                        Showing first 5 rows of {csvData.totalRows} total customers
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {uploadError && (
                <div className="space-y-3">
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start justify-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium text-sm">{uploadError}</div>
                        <div className="text-xs text-red-600 mt-1">
                          API Endpoint: {API_BASE}/upload_customers
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Troubleshooting tips */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Troubleshooting Tips:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Ensure your CSV file has proper headers and customer data</li>
                      <li>• Check that the backend server is running and accessible</li>
                      <li>• Try using the "Preview CSV" button to test file parsing</li>
                      <li>• Verify your internet connection</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Make Calls Section */}
          {uploaded && csvData && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8 animate-slideInUp animation-delay-400">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-sky-500 rounded-xl flex items-center justify-center animate-pulse">
                  <PhoneCall className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-sky-700">Initiate Delivery Calls</h2>
                  <p className="text-sm text-sky-600">Start automated calls to all {csvData.totalRows} customers in your uploaded list</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleMakeCalls}
                  disabled={calling || loadingResponses}
                  className={`group relative flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 overflow-hidden
                    ${calling || loadingResponses
                      ? 'bg-gray-200 cursor-not-allowed text-gray-400' 
                      : 'bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 hover:from-blue-600 hover:via-sky-600 hover:to-cyan-600 text-white shadow-xl hover:shadow-2xl'
                    }`}
                >
                  <div className="relative z-10 flex items-center gap-3">
                    {calling ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Making Calls...</span>
                      </>
                    ) : (
                      <>
                        <PhoneCall className="h-5 w-5 animate-pulse" />
                        <span>Start Delivery Calls</span>
                        <Users className="h-5 w-5 group-hover:animate-bounce" />
                      </>
                    )}
                  </div>
                </button>
                
                {/* Call Progress Indicator */}
                {(calling || loadingResponses) && (
                  <div className="flex items-center gap-3 px-6 py-4 bg-blue-50 border border-blue-200 rounded-xl min-w-fit">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <div className="text-sm">
                        <div className="font-medium text-blue-700">
                          {calling ? 'Processing Calls...' : 'Fetching Responses...'}
                        </div>
                        <div className="text-blue-600">
                          {calling ? 'Calling customers' : 'Loading results'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Status */}
              {callDone && !loadingResponses && !showResponses && (
                <div className="mt-6 space-y-4">
                  <div className="text-center p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                    <div className="flex items-center justify-center gap-2 text-cyan-700">
                      <CheckCircle className="w-5 h-5 animate-bounce" />
                      <span className="text-sm font-medium">
                        Calls completed successfully! 
                        {waitingForResults ? ' Waiting for customer responses...' : ' Ready to fetch responses.'}
                      </span>
                    </div>
                  </div>

                  {/* Timer Display */}
                  {waitingForResults && timerActive && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          <h4 className="text-lg font-semibold text-blue-700">Waiting for Customer Responses</h4>
                          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-4xl font-bold text-blue-600 mb-2 font-mono">
                          {formatTime(timer)}
                        </div>
                        <p className="text-sm text-blue-600 mb-4">
                          Results will automatically load when the timer completes
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={handleFetchResults}
                            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Check Now
                          </button>
                          <button
                            onClick={() => {
                              setTimerActive(false);
                              setWaitingForResults(false);
                              setTimer(0);
                            }}
                            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
                          >
                            Cancel Timer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Fetch Button (when timer is not active) */}
                  {callDone && !waitingForResults && !timerActive && !loadingResponses && (
                    <div className="text-center">
                      <button
                        onClick={handleFetchResults}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 hover:from-blue-600 hover:via-sky-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 flex items-center gap-3">
                          <Users className="w-5 h-5 animate-bounce" />
                          <span>Fetch Customer Responses</span>
                          <Eye className="w-5 h-5" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {callError && (
                <div className="mt-6 text-center p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{callError}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Customer Responses Section - Show when results are available */}
          {(showResponses || loadingResponses || responseError) && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8 animate-slideInUp animation-delay-500">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-xl flex items-center justify-center animate-pulse">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-sky-700">Customer Responses</h2>
                  <p className="text-sm text-sky-600">
                    {loadingResponses ? 'Loading customer responses...' :
                     responses && responses.length > 0 
                      ? `Responses collected from ${responses.length} customers`
                      : responseError ? 'Error loading responses' : 'No responses available yet'
                    }
                  </p>
                </div>
              </div>

              {/* Response Status */}
              {loadingResponses && (
                <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-center gap-3 text-blue-700">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <div className="text-left">
                      <div className="font-medium">Loading customer responses...</div>
                      <div className="text-sm text-blue-600">Please wait while we collect all call results</div>
                    </div>
                  </div>
                </div>
              )}

              {responseError && (
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{responseError}</span>
                    </div>
                    <button
                      onClick={handleFetchResults}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {!loadingResponses && !responseError && responses && responses.length === 0 && (
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        No responses received yet. Calls may still be in progress or customers haven't responded.
                      </span>
                    </div>
                    <button
                      onClick={handleFetchResults}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Refresh Results
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Time Savings Tracker - Only show when we have actual response data */}
          {responses && responses.length > 0 && (
            <TimeSavingsTracker 
              responses={responses} 
              csvData={csvData} 
              callDone={callDone}
            />
          )}

          {/* SmartDrop Dashboard */}
          {responses && responses.length > 0 && (
            <SmartDropDashboard 
              responses={responses} 
              csvData={csvData} 
              callDone={callDone}
            />
          )}

          {/* SmartDrop Statistics */}
          {responses && responses.length > 0 && (
            <SmartDropStatistics 
              responses={responses} 
              csvData={csvData} 
              callDone={callDone}
            />
          )}

          {/* Step 4: Response Table */}
          {showResponses && responses && responses.length > 0 && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 overflow-hidden animate-slideInUp animation-delay-600">
              {/* Header with Stats and Controls */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-8 py-6 border-b border-cyan-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-sky-700">Call Results</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-sky-600">
                          {filteredAndSortedData.length} of {responses.length} responses
                          {searchTerm && ` matching "${searchTerm}"`}
                        </p>
                        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-100 rounded-full">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-cyan-700">{responses.length} total responses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Search and Filter Controls */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search responses..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Filter className="w-4 h-4" />
                      <span>Page {currentPage} of {totalPages}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {responses.length > 0 && Object.keys(responses[0])
                        .filter(key => !['recording_sid', 'recording_duration', 'response'].includes(key.toLowerCase()))
                        .map((key, idx) => (
                        <th key={idx} className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort(key)}
                            className="flex items-center space-x-2 font-semibold text-gray-700 hover:text-cyan-600 transition-colors duration-200"
                          >
                            <span>{key.replace(/_/g, ' ').toUpperCase()}</span>
                            {getSortIcon(key)}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-cyan-50/50 transition-colors duration-200">
                        {Object.entries(row)
                          .filter(([key]) => !['recording_sid', 'recording_duration', 'response'].includes(key.toLowerCase()))
                          .map(([key, value], valueIdx) => (
                          <td key={valueIdx} className="px-6 py-4 text-sm">
                            <div className={`
                              ${key.includes('phone') || key.includes('number') ? 'font-mono text-blue-600' : 'text-gray-900'}
                              ${key.includes('name') || key.includes('customer') ? 'font-semibold text-cyan-600' : ''}
                              ${key.includes('status') || key.includes('transcription') ? 'font-medium' : ''}
                            `}>
                              {value}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              currentPage === pageNum
                                ? 'bg-cyan-500 text-white'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && (
                        <>
                          <span className="px-2 text-gray-400">...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              currentPage === totalPages
                                ? 'bg-cyan-500 text-white'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Back to Home Button */}
              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                <button
                  onClick={() => navigate('/')}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 hover:from-cyan-600 hover:via-blue-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <ArrowLeft className="w-5 h-5 animate-bounce" />
                    <span>Back to Home</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      
      {/* Custom animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(6px) rotate(-2deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        @keyframes slideInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes morph-slow {
          0%, 100% { transform: scale(1) rotate(0deg); border-radius: 50%; }
          50% { transform: scale(1.2) rotate(180deg); border-radius: 30%; }
        }
        @keyframes morph-medium {
          0%, 100% { transform: scale(1) rotate(0deg); border-radius: 50%; }
          50% { transform: scale(0.8) rotate(-90deg); border-radius: 40%; }
        }
        
        .animate-float1 { animation: float1 4s ease-in-out infinite; }
        .animate-float2 { animation: float2 5s ease-in-out infinite; }
        .animate-float3 { animation: float3 6s ease-in-out infinite; }
        .animate-slideInUp { animation: slideInUp 1s ease-out forwards; }
        .animate-morph-slow { animation: morph-slow 20s ease-in-out infinite; }
        .animate-morph-medium { animation: morph-medium 15s ease-in-out infinite; }
        
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-600 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}

export default SmartDrop; 