// Backend server URL
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { Footer } from './common/Footer';
import { UploadCloud, BarChart2, DatabaseIcon, RefreshCw, Truck, Package, Globe, Zap, Shield, TrendingUp, Target, Brain, Download, Store, Calendar, ArrowLeft, FileSpreadsheet, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, Eye } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLoading } from '../context/LoadingContext';
import { useModal } from '../context/ModalContext';
import { motion } from 'motion/react';
import PredictionDashboard from '../components/PredictionDashboard';
import { SectionTransition } from '../components/PageTransition';

import { OptimizedCard } from '../components/OptimizedComponents';
import { usePredictState } from '../hooks/usePredictState';
import { feedbackService, localFeedbackStorage } from '../services/feedback.service';
import { predictionService } from '../services/prediction.service';
import { useDebounce, useSmoothScroll } from '../hooks/usePerformance';

class PredictSectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown render error'
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Predict section render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
          <p className="font-semibold">Visualization failed to render.</p>
          <p className="text-sm mt-1">{this.state.errorMessage}</p>
          <p className="text-sm mt-1">Prediction rows are still available in the table below.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Floating elements for Predict page - Now with varied colors
const FloatingPredictElements = ({ scrollY }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Floating prediction elements with cyan/blue theme */}
      <div 
        className="absolute top-16 left-8 w-10 h-10 bg-gradient-to-br from-cyan-400/25 to-blue-500/25 rounded-lg animate-float1 shadow-lg flex items-center justify-center"
        style={{ transform: `translateY(${scrollY * -0.15}px)` }}
      >
        <BarChart2 className="w-5 h-5 text-cyan-500/70" />
      </div>
      
      <div 
        className="absolute top-24 right-12 w-8 h-8 bg-gradient-to-br from-blue-400/25 to-sky-500/25 rounded-md animate-float2 shadow-lg flex items-center justify-center"
        style={{ transform: `translateY(${scrollY * -0.2}px)` }}
      >
        <TrendingUp className="w-4 h-4 text-blue-500/70" />
      </div>
      
      <div 
        className="absolute top-1/3 left-12 w-12 h-12 bg-gradient-to-br from-cyan-400/25 to-blue-500/25 rounded-xl animate-float3 shadow-lg flex items-center justify-center"
        style={{ transform: `translateY(${scrollY * -0.1}px)` }}
      >
        <Brain className="w-6 h-6 text-cyan-500/70 animate-pulse" />
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
        <Package className="w-7 h-7 text-blue-500/70 animate-bounce" />
      </div>
    </div>
  );
};

function groupPredictionsByStoreAndProduct(predictions) {
  if (!Array.isArray(predictions)) return {};
  const stores = {};
  predictions.forEach(pred => {
    if (!stores[pred.store_id]) stores[pred.store_id] = {};
    if (!stores[pred.store_id][pred.product_id]) stores[pred.store_id][pred.product_id] = [];
    stores[pred.store_id][pred.product_id].push({
      date: pred.date,
      predicted_stock: pred.predicted_stock,
      actual_stock: pred.actual_stock || null,  // Include actual stock data if available
    });
  });
  return stores;
}

function Predict() {
  // Actuals: uploaded by user for comparison
  const [actuals, setActuals] = useState([]);
  const [actualDataFile, setActualDataFile] = useState(null);

  // Navbar height (px)
  const NAVBAR_HEIGHT = 66; // px (matches py-[13px] + 40px content)
  
  // Use persisted state for user data
  const {
    file, setFile,
    predictions, setPredictions,
    csvBlob, setCsvBlob,
    selectedStore, setSelectedStore,
    currentPage, setCurrentPage,
    searchTerm, setSearchTerm,
    sortField, setSortField,
    sortDirection, setSortDirection,
    storeCurrentPage, setStoreCurrentPage,
    showUploadSection, setShowUploadSection,
    predictionHistory, setPredictionHistory,
    activePredictionId, setActivePredictionId,
    isPredictionDataStale,
    isFileDataStale,
    isReturningSession,
    resetPredictState
  } = usePredictState();
  
  // Non-persisted state (temporary UI state)
  const [loading, setLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [itemsPerPage] = useState(8);
  const [storesPerPage] = useState(6);
  const [feedbackData, setFeedbackData] = useState([]);
  
  const { themeColors } = useTheme();
  const { showLoading, hideLoading } = useLoading();
  const { openStoreModal, modalState, updateActualStockData } = useModal();

  // Actuals upload and parse
  const handleActualDataFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;
    setActualDataFile(uploadedFile);
    setLoading(true);
    showLoading("Processing actuals data...");
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredColumns = ['store_id', 'date', 'product_id', 'sales'];
        const headers = results.meta.fields;
        const missing = requiredColumns.filter(col => !headers.includes(col));
        if (missing.length > 0) {
          alert(`Missing columns: ${missing.join(', ')}`);
          setLoading(false);
          hideLoading();
          return;
        }
        // Normalize and filter actuals
        const actualsData = results.data.filter(row =>
          row.store_id && row.date && row.product_id && row.sales !== undefined && row.sales !== null && row.sales !== ''
        ).map(row => ({
          store_id: String(row.store_id).trim(),
          date: String(row.date).trim(),
          product_id: String(row.product_id).trim(),
          sales: Number(row.sales)
        }));
        setActuals(actualsData);
        setLoading(false);
        hideLoading();
        if (actualsData.length === 0) {
          alert('No valid actual sales data found in file.');
        } else {
          alert('Actual sales data uploaded!');
        }
        // Debug log for diagnosis
        console.log('Actuals uploaded:', actualsData);
        if (predictions && predictions.length > 0) {
          const normalizedPredictions = predictions.map(row => ({
            store_id: String(row.store_id).trim(),
            date: String(row.date).trim(),
            product_id: String(row.product_id).trim(),
            predicted_stock: Number(row.predicted_stock)
          }));
          console.log('Predictions for comparison:', normalizedPredictions);
        }
      },
      error: (err) => {
        alert('Error parsing CSV: ' + err.message);
        setLoading(false);
        hideLoading();
      }
    });
  };
  // Ensure dashboard re-renders when actuals change
  useEffect(() => {
    // If actuals are uploaded and predictions exist, force a re-render
    // This is just to ensure the dashboard updates
  }, [actuals, predictions]);
  // Remove handleUploadActualData, replaced by handleParseAndUpdateDashboard

  // Handle feedback from prediction chart
  const handlePredictionFeedback = useCallback(async (feedback) => {
    setFeedbackData(prev => [...prev, feedback]);
    
    // Save to localStorage immediately
    const existingFeedback = JSON.parse(localStorage.getItem('predictionFeedback') || '[]');
    const feedbackWithId = {
      ...feedback,
      id: Date.now().toString(),
      synced: false,
    };
    existingFeedback.push(feedbackWithId);
    localStorage.setItem('predictionFeedback', JSON.stringify(existingFeedback));
    
    // Try to send to backend
    try {
      // Import the feedback service dynamically to avoid import issues
      const { feedbackService } = await import('../services/feedback.service.js');
      await feedbackService.submitFeedback(feedback);
      
      // Mark as synced if successful
      const updatedFeedback = JSON.parse(localStorage.getItem('predictionFeedback') || '[]');
      const syncedFeedback = updatedFeedback.map(f => 
        f.id === feedbackWithId.id ? { ...f, synced: true } : f
      );
      localStorage.setItem('predictionFeedback', JSON.stringify(syncedFeedback));
      
      console.log('Feedback successfully submitted to server');
    } catch (error) {
      console.warn('Failed to submit feedback to server, saved locally:', error);
    }
  }, []);

  // Function to update predictions with actual stock data
  const updatePredictionsWithActualData = useCallback((storeId, productId, date, actualStock) => {
    if (!predictions) return;
    
    setPredictions(prevPredictions => {
      return prevPredictions.map(pred => {
        if (pred.store_id.toString() === storeId.toString() && 
            pred.product_id.toString() === productId.toString() && 
            pred.date === date) {
          return { ...pred, actual_stock: actualStock };
        }
        return pred;
      });
    });
  }, [predictions, setPredictions]);
  
  // Make the function available to the ModalContext
  useEffect(() => {
    window.updatePredictionsWithActualData = updatePredictionsWithActualData;
    
    return () => {
      delete window.updatePredictionsWithActualData;
    };
  }, [updatePredictionsWithActualData]);

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
    if (isReturningSession && (file || predictions)) {
      console.log('Predict page state restored from previous session');
      
      // Check if data is stale and notify user
      if (isPredictionDataStale() && predictions) {
        console.warn('Prediction data is stale (>30 minutes old). Consider refreshing.');
      }
      if (isFileDataStale() && file) {
        console.warn('File data is stale (>30 minutes old). Consider re-uploading.');
      }
    }
  }, []); // Empty dependency array - only run on mount

  const handleFileUpload = useCallback((event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      showLoading("Processing file...");
      
      // Simulate file processing time
      setTimeout(() => {
        setFile(uploadedFile);
        hideLoading();
      }, 1000);
    }
  }, [showLoading, hideLoading, setFile]);

  // Prediction: send file to backend, get response, set predictions
  const handlePredict = async () => {
    if (!file) {
      alert("Please upload a file to generate predictions.");
      return;
    }
    setLoading(true);
    showLoading("Analyzing data with AI...");
    try {
      const responseData = await predictionService.predict(file);
      const data = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.predictions)
          ? responseData.predictions
          : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

      if (!Array.isArray(data) || data.length === 0) {
        const payloadKeys = responseData && typeof responseData === 'object'
          ? Object.keys(responseData).join(', ')
          : typeof responseData;
        throw new Error(`No prediction rows found in response. Payload keys/type: ${payloadKeys}`);
      }

      // CSV for download
      let csvContent = "";
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]);
        csvContent = headers.join(',') + '\n';
        data.forEach(row => {
          const values = headers.map(header => row[header] || '');
          csvContent += values.join(',') + '\n';
        });
      }
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      // History
      const predictionId = Date.now().toString();
      const predictionEntry = {
        id: predictionId,
        fileName: file.name,
        uploadDate: new Date().toLocaleString(),
        predictions: data,
        csvBlob: blob,
        recordCount: data.length
      };
      setPredictionHistory(prev => [predictionEntry, ...prev]);
      setActivePredictionId(predictionId);
      setPredictions(data);
      setCsvBlob(blob);
      setShowUploadSection(false);
      setFile(null);
      setCurrentPage(1);
      setSearchTerm('');
      setSortField('');
      setStoreCurrentPage(1);
    } catch (err) {
      setPredictions(null);
      setCsvBlob(null);
      alert(`Prediction failed: ${err.message}`);
      console.error('Prediction error:', err);
    }
    setLoading(false);
    hideLoading();
  };

  const handleUploadDemoData = async () => {
    // Only set demo file for upload, do not process or update predictions
    showLoading("Loading demo data...");
    try {
      const response = await fetch('/sample_sales_data.csv');
      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }
      const csvText = await response.text();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const demoFile = new File([blob], 'sample_sales_data.csv', { type: 'text/csv' });
      setFile(demoFile);
      hideLoading();
      showLoading("Demo file ready. Click 'Generate Predictions' to analyze.");
      setTimeout(() => hideLoading(), 1000);
    } catch (error) {
      hideLoading();
      alert(`Failed to load demo data: ${error.message}`);
      console.error('Demo data load error:', error);
    }
  };

  const handleDownloadCSV = () => {
    if (!csvBlob) return;
    
    showLoading("Preparing CSV download...");
    
    setTimeout(() => {
      const downloadUrl = window.URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'stock_predictions.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      hideLoading();
    }, 500);
  };

  const handleUploadMore = () => {
    setShowUploadSection(true);
  };

  const handleSelectPrediction = (predictionEntry) => {
    setActivePredictionId(predictionEntry.id);
    setPredictions(predictionEntry.predictions);
    setCsvBlob(predictionEntry.csvBlob);
    setCurrentPage(1);
    setSearchTerm('');
    setSortField('');
    setStoreCurrentPage(1);
  };

  const normalizedPredictions = useMemo(() => {
    if (!Array.isArray(predictions)) return [];

    return predictions.map(row => ({
      ...row,
      store_id: row?.store_id ?? row?.storeId ?? row?.store ?? row?.STORE_ID ?? '',
      date: row?.date ?? row?.prediction_date ?? row?.predictionDate ?? row?.DATE ?? '',
      product_id: row?.product_id ?? row?.productId ?? row?.product ?? row?.PRODUCT_ID ?? '',
      predicted_stock: Number(row?.predicted_stock ?? row?.predictedStock ?? row?.prediction ?? row?.PREDICTED_STOCK ?? 0)
    })).map(row => ({
      ...row,
      store_id: row?.store_id !== undefined && row?.store_id !== null ? String(row.store_id).trim() : '',
      date: row?.date !== undefined && row?.date !== null ? String(row.date).trim() : '',
      product_id: row?.product_id !== undefined && row?.product_id !== null ? String(row.product_id).trim() : ''
    }));
  }, [predictions]);

  const groupedStores = useMemo(() => {
    return groupPredictionsByStoreAndProduct(normalizedPredictions);
  }, [normalizedPredictions]);

  // Filtered and sorted predictions
  const filteredAndSortedData = useMemo(() => {
    if (normalizedPredictions.length === 0) return [];
    let filtered = normalizedPredictions.filter(item =>
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
  }, [normalizedPredictions, searchTerm, sortField, sortDirection]);

  const paginationData = useMemo(() => {
    const safeCurrentPage = Number.isInteger(currentPage) && currentPage > 0 ? currentPage : 1;
    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
    return { totalPages, startIndex, paginatedData, safeCurrentPage };
  }, [filteredAndSortedData, currentPage, itemsPerPage]);
  const { totalPages, startIndex, paginatedData, safeCurrentPage } = paginationData;

  // Store cards pagination (only from backend response)
  const storeData = useMemo(() => {
    const safeStoreCurrentPage = Number.isInteger(storeCurrentPage) && storeCurrentPage > 0 ? storeCurrentPage : 1;
    const storeEntries = Object.entries(groupedStores);
    const totalStorePages = Math.ceil(storeEntries.length / storesPerPage);
    const storeStartIndex = (safeStoreCurrentPage - 1) * storesPerPage;
    const paginatedStores = storeEntries.slice(storeStartIndex, storeStartIndex + storesPerPage);
    return { storeEntries, totalStorePages, paginatedStores, safeStoreCurrentPage };
  }, [groupedStores, storeCurrentPage, storesPerPage]);
  const { storeEntries, totalStorePages, paginatedStores, safeStoreCurrentPage } = storeData;

  useEffect(() => {
    if (!Number.isInteger(storeCurrentPage) || storeCurrentPage < 1) {
      setStoreCurrentPage(1);
    }
  }, [storeCurrentPage, setStoreCurrentPage]);

  useEffect(() => {
    if (!Number.isInteger(currentPage) || currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, setCurrentPage]);

  const handleSort = useMemo(() => {
    return (field) => {
      if (sortField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    };
  }, [sortField]);

  const getSortIcon = useMemo(() => {
    return (field) => {
      if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
      return sortDirection === 'asc' ? 
        <ArrowUp className="w-4 h-4 text-cyan-600" /> : 
        <ArrowDown className="w-4 h-4 text-cyan-600" />;
    };
  }, [sortField, sortDirection]);

  const tableHeaders = useMemo(() => {
    return normalizedPredictions.length > 0 ? Object.keys(normalizedPredictions[0]) : [];
  }, [normalizedPredictions]);

  const formatTableCellValue = useCallback((value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }, []);

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
      <FloatingPredictElements scrollY={scrollY} />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: NAVBAR_HEIGHT + 32, paddingBottom: 32 }}>
        {/* Enhanced Header */}
        <div className="text-center mb-12 transform transition-all duration-1000" style={{ transform: `translateY(${scrollY * -0.1}px)` }}>
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <h1 className="relative text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 bg-clip-text text-transparent mb-4 animate-slideInUp">
              AI-Powered Stock Prediction
            </h1>
          </div>
          <p className="text-lg text-sky-600 max-w-3xl mx-auto leading-relaxed animate-slideInUp animation-delay-200">
            Upload your inventory data and get intelligent predictions for optimal stock levels with
            <span className="font-semibold text-cyan-600 animate-pulse"> machine learning insights</span>
          </p>
          {/* Download CSV & Upload Actual Data Buttons */}
          {normalizedPredictions.length > 0 && csvBlob && (
            <div className="mt-8 flex flex-col items-center gap-4 animate-slideInUp animation-delay-400">
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-sky-600 hover:from-cyan-700 hover:via-blue-700 hover:to-sky-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <Download className="w-5 h-5 animate-bounce" />
                    <span>Download CSV Results</span>
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('actual-data-upload-input').click()}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-sky-600 hover:from-cyan-700 hover:via-blue-700 hover:to-sky-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <UploadCloud className="w-5 h-5 animate-bounce" />
                    <span>Upload Actual Data</span>
                  </div>
                  <input
                    id="actual-data-upload-input"
                    type="file"
                    accept=".csv,.xlsx"
                    style={{ display: 'none' }}
                    onChange={handleActualDataFileChange}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Store Cards Section */}
        {storeEntries.length > 0 && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8 animate-slideInUp animation-delay-300 mb-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-sky-700">Store Overview</h3>
                  <p className="text-sm text-sky-600">{storeEntries.length} stores with predictions</p>
                </div>
              </div>
              
              {totalStorePages > 1 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>Page {safeStoreCurrentPage} of {totalStorePages}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedStores.map(([storeId, products]) => (
                <div key={storeId} className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl shadow-lg p-8 flex flex-col items-center border border-cyan-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="text-lg font-bold mb-4 text-sky-700">Shop Owner</div>
                  <button
                    type="button"
                    className="flex flex-col items-center group focus:outline-none"
                    onClick={() => openStoreModal(storeId, products)}
                  >
                    <div className="rounded-full bg-cyan-100 p-6 mb-4 group-hover:bg-cyan-200 transition-colors duration-200">
                      <Store className="w-10 h-10 text-cyan-600 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <span className="text-cyan-700 font-semibold group-hover:underline text-center">
                      Store ID: {storeId}
                    </span>
                    <div className="flex items-center gap-2 mt-3">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{Object.keys(products).length} products</span>
                    </div>
                    <span className="text-sm text-cyan-500 group-hover:text-cyan-700 mt-2 transition-colors duration-200">
                      View Predictions →
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Store Cards Pagination */}
            {totalStorePages > 1 && (
              <div className="flex items-center justify-center mt-8 space-x-3">
                <button
                  type="button"
                  onClick={() => setStoreCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={safeStoreCurrentPage === 1}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-2">
                  {[...Array(Math.min(totalStorePages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => setStoreCurrentPage(pageNum)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          safeStoreCurrentPage === pageNum
                            ? 'bg-cyan-500 text-white'
                            : 'text-cyan-600 hover:bg-cyan-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalStorePages > 5 && (
                    <>
                      <span className="px-2 text-gray-400">...</span>
                      <button
                        type="button"
                        onClick={() => setStoreCurrentPage(totalStorePages)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          safeStoreCurrentPage === totalStorePages
                            ? 'bg-cyan-500 text-white'
                            : 'text-cyan-600 hover:bg-cyan-100'
                        }`}
                      >
                        {totalStorePages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setStoreCurrentPage(prev => Math.min((Number(prev) || 1) + 1, totalStorePages))}
                  disabled={safeStoreCurrentPage >= totalStorePages}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Main Content - Single Column Layout */}
        <div className="space-y-8">
          {/* Prediction Dashboard */}
  {normalizedPredictions.length > 0 && (
    <PredictSectionErrorBoundary>
      <PredictionDashboard 
        predictions={normalizedPredictions}
        actuals={actuals}
        feedbackData={feedbackData}
      />
    </PredictSectionErrorBoundary>
  )}


          {/* Data Restoration Notification */}
          {isReturningSession && (file || predictions || selectedStore) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 animate-slideInUp">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-green-800">Previous Session Restored</h4>
                  <p className="text-sm text-green-600">
                    Your work has been automatically saved and restored from your last visit.
                    {isPredictionDataStale() && predictions && (
                      <span className="text-amber-600 ml-1">(Data is over 30 minutes old - consider refreshing)</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetPredictState}
                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors duration-200"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* Upload Section or Upload More Section */}
          {showUploadSection ? (
            <div 
              className="group bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8 transform transition-all duration-500 hover:shadow-2xl relative overflow-hidden animate-slideInUp animation-delay-400"
              style={{ transform: `translateY(${scrollY * -0.02}px)` }}
            >
              {/* Animated background in card */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/30 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center animate-pulse">
                      <UploadCloud className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-sky-700">Data Upload & Analysis</h2>
                      <p className="text-sm text-sky-600">Upload your inventory data to get AI-powered predictions</p>
                    </div>
                  </div>
                  
                  {/* Small Demo Data Button */}
                  <button
                    type="button"
                    onClick={handleUploadDemoData}
                    disabled={loading}
                    className={`group relative px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 transform hover:scale-105 border
                      ${loading 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400' 
                        : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 hover:border-yellow-400 text-yellow-700 hover:text-yellow-800 shadow-md hover:shadow-lg'
                      }`}
                  >
                    <DatabaseIcon className="h-4 w-4" />
                    <span className="text-sm">Demo Data</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* File Upload Area - Full Width */}
                  <div className="relative text-center p-8 border-2 border-dashed border-cyan-300/60 rounded-xl bg-gradient-to-br from-cyan-50/50 to-blue-50/50 hover:from-cyan-50 hover:to-blue-50 transition-all duration-300 cursor-pointer group-hover:border-cyan-400/80">
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <UploadCloud className="relative h-12 w-12 mx-auto text-cyan-500 mb-4 animate-float1" />
                      </div>
                      <p className="text-sky-800 font-medium mb-2">
                        {file ? (
                          <span className="flex items-center justify-center space-x-2">
                            <Package className="w-5 h-5 animate-bounce text-cyan-600" />
                            <span className="text-cyan-700">{file.name}</span>
                          </span>
                        ) : (
                          "Upload your inventory data"
                        )}
                      </p>
                      <p className="text-sm text-sky-600">
                        Drag & drop your CSV or Excel file here or click to browse
                      </p>
                    </label>
                  </div>

                  {/* Generate Predictions Button - Always Below Upload */}
                  <button
                    type="button"
                    onClick={handlePredict}
                    disabled={loading}
                    className={`group relative w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 overflow-hidden
                      ${loading 
                        ? 'bg-gray-200 cursor-not-allowed text-gray-400' 
                        : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 hover:from-cyan-600 hover:via-blue-600 hover:to-sky-600 text-white shadow-xl hover:shadow-2xl'
                      }`}
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      {loading ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5 animate-pulse" />
                          <span>Generate Predictions</span>
                          <BarChart2 className="h-5 w-5 group-hover:animate-bounce" />
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload More Section */
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8 animate-slideInUp animation-delay-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <UploadCloud className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-sky-700">Analysis Complete</h3>
                    <p className="text-sm text-sky-600">Upload more data or manage your prediction history</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV</span>
                  </button>
                  {/* <button
                    type="button"
                    onClick={handleUploadActualData}
                    className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Actual Data</span>
                  </button> */}
                  <button
                    type="button"
                    onClick={handleUploadMore}
                    className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload More</span>
                  </button>
                </div>
              </div>

              {/* Prediction History */}
              {predictionHistory.length > 0 && (
                <div className="mt-8 pt-6 border-t border-cyan-200">
                  <h4 className="text-lg font-bold text-sky-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Prediction History
                  </h4>
                  <div className="grid gap-3">
                    {predictionHistory.map((entry) => (
                      <button
                        type="button"
                        key={entry.id}
                        onClick={() => handleSelectPrediction(entry)}
                        className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                          activePredictionId === entry.id
                            ? 'bg-cyan-50 border-cyan-300 shadow-md'
                            : 'bg-gray-50 border-gray-200 hover:bg-cyan-50 hover:border-cyan-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              activePredictionId === entry.id ? 'bg-cyan-500' : 'bg-gray-400'
                            }`}></div>
                            <div>
                              <div className="font-medium text-gray-900">{entry.fileName}</div>
                              <div className="text-sm text-gray-500">{entry.uploadDate}</div>
                            </div>
                          </div>
                          <div className="text-sm text-cyan-600 font-medium">
                            {entry.recordCount} predictions
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Display Section */}
          {normalizedPredictions.length > 0 && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 overflow-hidden animate-slideInUp animation-delay-600">
              {/* Header with Stats and Controls */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-8 py-6 border-b border-cyan-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <DatabaseIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-sky-700">Prediction Results</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-sky-600">
                          {filteredAndSortedData.length} of {normalizedPredictions.length} records 
                          {searchTerm && ` matching "${searchTerm}"`}
                        </p>
                        {normalizedPredictions.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-cyan-100 rounded-full">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-cyan-700">{normalizedPredictions.length} predictions ready</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Search and Filter Controls */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search predictions..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1); // Reset to first page when searching
                        }}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Filter className="w-4 h-4" />
                      <span>Page {safeCurrentPage} of {totalPages}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {tableHeaders.map((key, idx) => (
                        <th key={idx} className="px-6 py-4 text-left">
                          <button
                            type="button"
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
                        {Object.entries(row).map(([key, value], valueIdx) => (
                          <td key={valueIdx} className="px-6 py-4 text-sm">
                            <div className={`
                              ${key.includes('stock') || key.includes('predicted') ? 'font-semibold text-cyan-600' : 'text-gray-900'}
                              ${key.includes('date') ? 'text-blue-600' : ''}
                              ${key.includes('id') ? 'font-mono text-gray-600' : ''}
                            `}>
                              {formatTableCellValue(value)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Upload Actual Data Button Below Table */}
              {/* Removed Upload Actual Data Button from below table, now in Analysis Complete section */}

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={safeCurrentPage === 1}
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
                            type="button"
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              safeCurrentPage === pageNum
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
                            type="button"
                            onClick={() => setCurrentPage(totalPages)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              safeCurrentPage === totalPages
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
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min((Number(prev) || 1) + 1, totalPages))}
                      disabled={safeCurrentPage >= totalPages}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
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
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .animate-float1 { animation: float1 4s ease-in-out infinite; }
        .animate-float2 { animation: float2 5s ease-in-out infinite; }
        .animate-float3 { animation: float3 6s ease-in-out infinite; }
        .animate-slideInUp { animation: slideInUp 1s ease-out forwards; }
        .animate-morph-slow { animation: morph-slow 20s ease-in-out infinite; }
        .animate-morph-medium { animation: morph-medium 15s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1200 { animation-delay: 1.2s; }
        .animation-delay-1400 { animation-delay: 1.4s; }
      `}</style>
      
    </div>
  );
}

export default Predict;
