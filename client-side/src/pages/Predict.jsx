import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { UploadCloud, BarChart2, DatabaseIcon, RefreshCw, Package, Brain, Download, Store, Calendar, FileSpreadsheet, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, Eye, Trash2, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLoading } from '../context/LoadingContext';
import { useModal } from '../context/ModalContext';
import { usePredictState } from '../hooks/usePredictState';
import { predictionService } from '../services/prediction.service';
import { insightsService } from '../services/insights.service';
import GeminiInsightsModal from '../components/GeminiInsightsModal';

function Predict() {
  const NAVBAR_HEIGHT = 66;
  
  const {
    file, setFile,
    predictions, setPredictions,
    csvBlob, setCsvBlob,
    currentPage, setCurrentPage,
    searchTerm, setSearchTerm,
    sortField, setSortField,
    sortDirection, setSortDirection,
    storeCurrentPage, setStoreCurrentPage,
    showUploadSection, setShowUploadSection,
    predictionHistory, setPredictionHistory,
    activePredictionId, setActivePredictionId,
    resetPredictState
  } = usePredictState();
  
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [predictionInsights, setPredictionInsights] = useState(null);
  const [itemsPerPage] = useState(8);
  const [storesPerPage] = useState(6);
  
  const { showLoading, hideLoading } = useLoading();
  const { openStoreModal } = useModal();

  // On mount: clear non-serializable file objects
  useEffect(() => {
    if (file && !(file instanceof File)) setFile(null);
  }, []);

  const handleFileUpload = useCallback((event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      showLoading("Processing file...");
      setTimeout(() => { setFile(uploadedFile); hideLoading(); }, 500);
    }
  }, [showLoading, hideLoading, setFile]);

  const handlePredict = async () => {
    if (!file) {
      alert('⚠️ Please upload a CSV file first.');
      return;
    }
    setLoading(true);
    showLoading("Analyzing data with AI...");
    try {
      const responseData = await predictionService.predict(file);
      const data = Array.isArray(responseData) ? responseData
        : Array.isArray(responseData?.predictions) ? responseData.predictions
        : Array.isArray(responseData?.data) ? responseData.data : [];

      if (!data.length) throw new Error('No prediction rows in response.');

      // Build CSV blob
      const headers = Object.keys(data[0]);
      const csvContent = headers.join(',') + '\n' + data.map(row => headers.map(h => row[h] || '').join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Save to history
      const predictionId = Date.now().toString();
      setPredictionHistory(prev => [{ id: predictionId, fileName: file.name, uploadDate: new Date().toLocaleString(), predictions: data, csvBlob: blob, recordCount: data.length }, ...prev]);
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
    }
    setLoading(false);
    hideLoading();
  };

  const handleUploadDemoData = async () => {
    showLoading("Loading demo data...");
    try {
      const response = await fetch('/sample_sales_data.csv');
      if (!response.ok) throw new Error('Failed to load demo data');
      const csvText = await response.text();
      const blob = new Blob([csvText], { type: 'text/csv' });
      setFile(new File([blob], 'sample_sales_data.csv', { type: 'text/csv' }));
      hideLoading();
    } catch (error) {
      hideLoading();
      alert(`Failed to load demo data: ${error.message}`);
    }
  };

  const handleDownloadCSV = () => {
    if (!csvBlob) return;
    const url = window.URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stock_predictions.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleAnalyzePredictions = async () => {
    if (!predictions || predictions.length === 0) return;
    
    setAnalyzing(true);
    showLoading("Gemini is analyzing your predictions...");
    try {
      const data = await insightsService.generateSalesInsights(null, {}, [], predictions);
      setPredictionInsights(data);
      setShowInsightsModal(true);
    } catch (err) {
      alert(`Analysis failed: ${err.message}`);
    }
    setAnalyzing(false);
    hideLoading();
  };

  const handleSelectPrediction = (entry) => {
    setActivePredictionId(entry.id);
    setPredictions(entry.predictions);
    setCsvBlob(entry.csvBlob);
    setCurrentPage(1);
    setSearchTerm('');
    setSortField('');
    setStoreCurrentPage(1);
  };

  // Normalized predictions
  const normalizedPredictions = useMemo(() => {
    if (!Array.isArray(predictions)) return [];
    return predictions.map(row => ({
      store_id: String(row?.store_id ?? row?.storeId ?? '').trim(),
      date: String(row?.date ?? row?.prediction_date ?? '').trim(),
      product_id: String(row?.product_id ?? row?.productId ?? '').trim(),
      predicted_stock: Number(row?.predicted_stock ?? row?.predictedStock ?? row?.prediction ?? 0)
    }));
  }, [predictions]);

  // Store grouping
  const groupedStores = useMemo(() => {
    const stores = {};
    normalizedPredictions.forEach(pred => {
      if (!stores[pred.store_id]) stores[pred.store_id] = {};
      if (!stores[pred.store_id][pred.product_id]) stores[pred.store_id][pred.product_id] = [];
      stores[pred.store_id][pred.product_id].push({ date: pred.date, predicted_stock: pred.predicted_stock });
    });
    return stores;
  }, [normalizedPredictions]);

  // Search + sort
  const filteredAndSortedData = useMemo(() => {
    let filtered = normalizedPredictions.filter(item =>
      Object.values(item).some(v => v?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (sortField) {
      filtered.sort((a, b) => {
        if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [normalizedPredictions, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage || 1), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Store pagination
  const storeEntries = Object.entries(groupedStores);
  const totalStorePages = Math.max(1, Math.ceil(storeEntries.length / storesPerPage));
  const safeStorePage = Math.min(Math.max(1, storeCurrentPage || 1), totalStorePages);
  const paginatedStores = storeEntries.slice((safeStorePage - 1) * storesPerPage, safeStorePage * storesPerPage);

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 text-cyan-600" /> : <ArrowDown className="w-4 h-4 text-cyan-600" />;
  };

  const tableHeaders = normalizedPredictions.length > 0 ? Object.keys(normalizedPredictions[0]) : [];

  return (
    <div className="min-h-screen theme-gradient-bg flex flex-col overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_60%,rgba(6,182,212,0.08),rgba(255,255,255,0.9))]"></div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: NAVBAR_HEIGHT + 32, paddingBottom: 32 }}>
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 bg-clip-text text-transparent mb-4">
            AI-Powered Stock Prediction
          </h1>
          <p className="text-lg text-sky-600 max-w-2xl mx-auto">
            Upload your inventory data and get intelligent predictions for optimal stock levels
          </p>

          {/* Download button when predictions exist */}
          {normalizedPredictions.length > 0 && csvBlob && (
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button type="button" onClick={handleDownloadCSV}
                className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <Download className="w-5 h-5" /> Download CSV Results <FileSpreadsheet className="w-5 h-5" />
              </button>
              <button type="button" onClick={handleAnalyzePredictions} disabled={analyzing}
                className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50">
                <Brain className={`w-5 h-5 ${analyzing ? 'animate-pulse' : ''}`} /> Analyze with Gemini <Sparkles className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Store Cards */}
          {storeEntries.length > 0 && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
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
                  <span className="text-sm text-gray-600">Page {safeStorePage} of {totalStorePages}</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedStores.map(([storeId, products]) => (
                  <div key={storeId} className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl shadow-lg p-6 flex flex-col items-center border border-cyan-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <button type="button" className="flex flex-col items-center group" onClick={() => openStoreModal(storeId, products)}>
                      <div className="rounded-full bg-cyan-100 p-5 mb-3 group-hover:bg-cyan-200 transition-colors">
                        <Store className="w-8 h-8 text-cyan-600" />
                      </div>
                      <span className="text-cyan-700 font-semibold group-hover:underline">Store {storeId}</span>
                      <span className="text-sm text-gray-500 mt-1">{Object.keys(products).length} products</span>
                      <span className="text-sm text-cyan-500 group-hover:text-cyan-700 mt-2">View Predictions →</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Store pagination */}
              {totalStorePages > 1 && (
                <div className="flex items-center justify-center mt-6 space-x-3">
                  <button type="button" onClick={() => setStoreCurrentPage(Math.max(safeStorePage - 1, 1))} disabled={safeStorePage === 1}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </button>
                  <span className="text-sm text-gray-600">{safeStorePage} / {totalStorePages}</span>
                  <button type="button" onClick={() => setStoreCurrentPage(Math.min(safeStorePage + 1, totalStorePages))} disabled={safeStorePage === totalStorePages}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upload Section */}
          {showUploadSection ? (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <UploadCloud className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-sky-700">Upload & Predict</h2>
                    <p className="text-sm text-sky-600">Upload CSV with store_id, product_id, date, sales columns</p>
                  </div>
                </div>
                <button type="button" onClick={handleUploadDemoData} disabled={loading}
                  className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 text-yellow-700 hover:text-yellow-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                  <DatabaseIcon className="h-4 w-4" /> <span className="text-sm">Demo Data</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* File upload area */}
                <div className="relative text-center p-8 border-2 border-dashed border-cyan-300/60 rounded-xl bg-gradient-to-br from-cyan-50/50 to-blue-50/50 hover:from-cyan-50 hover:to-blue-50 transition-all cursor-pointer">
                  <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <UploadCloud className="h-12 w-12 mx-auto text-cyan-500 mb-4" />
                    <p className="text-sky-800 font-medium mb-2">
                      {file ? (
                        <span className="flex items-center justify-center space-x-2">
                          <Package className="w-5 h-5 text-cyan-600" />
                          <span className="text-cyan-700">{file.name}</span>
                        </span>
                      ) : "Click to upload your inventory CSV"}
                    </p>
                    <p className="text-sm text-sky-600">CSV file with store_id, product_id, date, sales</p>
                  </label>
                </div>

                {/* Predict button */}
                <button type="button" onClick={handlePredict} disabled={!file || loading}
                  className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] ${
                    !file || loading ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 hover:from-cyan-600 hover:via-blue-600 hover:to-sky-600 text-white shadow-xl hover:shadow-2xl'
                  }`}>
                  {loading ? (<><RefreshCw className="h-5 w-5 animate-spin" /> Processing...</>) : (<><Brain className="h-5 w-5" /> Generate Predictions <BarChart2 className="h-5 w-5" /></>)}
                </button>
              </div>
            </div>
          ) : (
            /* Post-prediction actions */
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <UploadCloud className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-sky-700">Analysis Complete</h3>
                    <p className="text-sm text-sky-600">Upload more data or view history</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button type="button" onClick={handleDownloadCSV}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                    <Download className="w-4 h-4" /> Download CSV
                  </button>
                  <button type="button" onClick={() => setShowUploadSection(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                    <UploadCloud className="w-4 h-4" /> Upload More
                  </button>
                </div>
              </div>

              {/* Prediction History */}
              {predictionHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t border-cyan-200">
                  <h4 className="text-lg font-bold text-sky-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Previous Predictions
                  </h4>
                  <div className="grid gap-2">
                    {predictionHistory.map((entry) => (
                      <button type="button" key={entry.id} onClick={() => handleSelectPrediction(entry)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          activePredictionId === entry.id ? 'bg-cyan-50 border-cyan-300 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-cyan-50 hover:border-cyan-200'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${activePredictionId === entry.id ? 'bg-cyan-500' : 'bg-gray-400'}`}></div>
                            <div>
                              <div className="font-medium text-gray-900">{entry.fileName}</div>
                              <div className="text-sm text-gray-500">{entry.uploadDate}</div>
                            </div>
                          </div>
                          <span className="text-sm text-cyan-600 font-medium">{entry.recordCount} predictions</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Table */}
          {normalizedPredictions.length > 0 && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 overflow-hidden">
              {/* Table header */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-cyan-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <DatabaseIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-sky-700">Prediction Results</h3>
                      <p className="text-sm text-sky-600">{filteredAndSortedData.length} of {normalizedPredictions.length} records</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search..." value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white w-full sm:w-auto" />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {tableHeaders.map((key) => (
                        <th key={key} className="px-6 py-3 text-left">
                          <button type="button" onClick={() => handleSort(key)}
                            className="flex items-center space-x-2 font-semibold text-gray-700 hover:text-cyan-600 transition-colors">
                            <span>{key.replace(/_/g, ' ').toUpperCase()}</span>
                            <SortIcon field={key} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-cyan-50/50 transition-colors">
                        {Object.entries(row).map(([key, value], vIdx) => (
                          <td key={vIdx} className="px-6 py-3 text-sm">
                            <span className={`${key.includes('stock') || key.includes('predicted') ? 'font-semibold text-cyan-600' : key.includes('date') ? 'text-blue-600' : key.includes('id') ? 'font-mono text-gray-600' : 'text-gray-900'}`}>
                              {value?.toString() ?? ''}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length}
                </span>
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => setCurrentPage(Math.max(safePage - 1, 1))} disabled={safePage === 1}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-700">{safePage} / {totalPages}</span>
                  <button type="button" onClick={() => setCurrentPage(Math.min(safePage + 1, totalPages))} disabled={safePage === totalPages}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <GeminiInsightsModal 
        isOpen={showInsightsModal} 
        onClose={() => setShowInsightsModal(false)} 
        insights={predictionInsights}
        type="prediction"
      />
    </div>
  );
}

export default Predict;
