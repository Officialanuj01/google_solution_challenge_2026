import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Area, AreaChart } from 'recharts';
import { ThumbsUp, ThumbsDown, Eye, EyeOff, TrendingUp, TrendingDown, CheckCircle, XCircle, BarChart2, Activity, Calendar, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PredictionChart = memo(({ predictions, actuals = [], onFeedback }) => {
  const [chartType, setChartType] = useState('line');
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [feedbackData, setFeedbackData] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'store', 'product'
  const [isLoading, setIsLoading] = useState(false);

  // Memoized handlers for better performance
  const handleFeedback = useCallback((dataPoint, isAccurate) => {
    const feedbackKey = `${dataPoint.store_id || 'all'}_${dataPoint.product_id || 'all'}_${dataPoint.date}`;
    
    setFeedbackData(prev => ({
      ...prev,
      [feedbackKey]: {
        isAccurate,
        timestamp: new Date().toISOString(),
        dataPoint
      }
    }));

    // Call parent callback if provided
    if (onFeedback) {
      onFeedback({
        ...dataPoint,
        feedback: isAccurate ? 'accurate' : 'inaccurate',
        timestamp: new Date().toISOString()
      });
    }
  }, [onFeedback]);

  const handleChartTypeChange = useCallback((type) => {
    setIsLoading(true);
    setChartType(type);
    // Smooth transition with reduced timeout
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  const handleViewModeChange = useCallback((mode, storeValue = null, productValue = null) => {
    setIsLoading(true);
    setViewMode(mode);
    setSelectedStore(storeValue);
    setSelectedProduct(productValue);
    // Smooth transition with reduced timeout
    setTimeout(() => setIsLoading(false), 100);
  }, []);

    // Merge actuals into predictions for robust comparison
    const chartData = useMemo(() => {
        if (!predictions || predictions.length === 0) return [];

        // Build a lookup for actuals by store_id, product_id, date
        const actualsMap = {};
        actuals.forEach(row => {
            const key = `${row.date}|${row.store_id}|${row.product_id}`;
            actualsMap[key] = Number(row.sales);
        });

        // Group by date, store, product for robust comparison
        const grouped = {};
        predictions.forEach(pred => {
            const key = `${pred.date}|${pred.store_id}|${pred.product_id}`;
            if (!grouped[key]) {
                grouped[key] = {
                    date: pred.date,
                    store_id: pred.store_id,
                    product_id: pred.product_id,
                    predicted: parseFloat(pred.predicted_stock || 0),
                    actual: actualsMap[key] !== undefined ? actualsMap[key] : (pred.actual_stock !== undefined ? parseFloat(pred.actual_stock) : (pred.actual_sales !== undefined ? parseFloat(pred.actual_sales) : null))
                };
            } else {
                grouped[key].predicted += parseFloat(pred.predicted_stock || 0);
                if (actualsMap[key] !== undefined) grouped[key].actual += actualsMap[key];
                else if (pred.actual_stock !== undefined) grouped[key].actual += parseFloat(pred.actual_stock);
                else if (pred.actual_sales !== undefined) grouped[key].actual += parseFloat(pred.actual_sales);
            }
        });

        // For chart, group by date and average across products/stores
        const dateGroups = {};
        Object.values(grouped).forEach(item => {
            if (!dateGroups[item.date]) {
                dateGroups[item.date] = {
                    date: item.date,
                    predicted: 0,
                    actual: 0,
                    count: 0,
                    hasActual: false
                };
            }
            dateGroups[item.date].predicted += item.predicted;
            if (item.actual !== null && !isNaN(item.actual)) {
                dateGroups[item.date].actual += item.actual;
                dateGroups[item.date].hasActual = true;
            }
            dateGroups[item.date].count += 1;
        });

        return Object.values(dateGroups)
            .map(group => ({
                date: group.date,
                predicted: Math.round(group.predicted / group.count),
                actual: group.hasActual ? Math.round(group.actual / group.count) : null
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [predictions, actuals]);

    // Get store-specific data (compare predicted and actual)
    const storeData = useMemo(() => {
        if (!predictions || !selectedStore) return [];
        // Group by date, product for selected store
        const filtered = predictions.filter(pred => pred.store_id === selectedStore);
        const grouped = {};
        filtered.forEach(pred => {
            const key = `${pred.date}|${pred.product_id}`;
            if (!grouped[key]) {
                grouped[key] = {
                    date: pred.date,
                    product_id: pred.product_id,
                    predicted: parseFloat(pred.predicted_stock || 0),
                    actual: pred.actual_stock !== undefined ? parseFloat(pred.actual_stock) : (pred.actual_sales !== undefined ? parseFloat(pred.actual_sales) : null)
                };
            } else {
                grouped[key].predicted += parseFloat(pred.predicted_stock || 0);
                if (pred.actual_stock !== undefined) grouped[key].actual += parseFloat(pred.actual_stock);
                else if (pred.actual_sales !== undefined) grouped[key].actual += parseFloat(pred.actual_sales);
            }
        });
        return Object.values(grouped)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [predictions, selectedStore]);

    // Get product-specific data across all stores (compare predicted and actual)
    const productData = useMemo(() => {
        if (!predictions || !selectedProduct) return [];
        // Group by date, store for selected product
        const filtered = predictions.filter(pred => pred.product_id === selectedProduct);
        const grouped = {};
        filtered.forEach(pred => {
            const key = `${pred.date}|${pred.store_id}`;
            if (!grouped[key]) {
                grouped[key] = {
                    date: pred.date,
                    store_id: pred.store_id,
                    predicted: parseFloat(pred.predicted_stock || 0),
                    actual: pred.actual_stock !== undefined ? parseFloat(pred.actual_stock) : (pred.actual_sales !== undefined ? parseFloat(pred.actual_sales) : null)
                };
            } else {
                grouped[key].predicted += parseFloat(pred.predicted_stock || 0);
                if (pred.actual_stock !== undefined) grouped[key].actual += parseFloat(pred.actual_stock);
                else if (pred.actual_sales !== undefined) grouped[key].actual += parseFloat(pred.actual_sales);
            }
        });
        return Object.values(grouped)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [predictions, selectedProduct]);

  // Get unique stores and products
  const { stores, products } = useMemo(() => {
    if (!predictions || predictions.length === 0) return { stores: [], products: [] };
    
    const storeSet = new Set();
    const productSet = new Set();
    
    predictions.forEach(pred => {
      if (pred.store_id) storeSet.add(pred.store_id);
      if (pred.product_id) productSet.add(pred.product_id);
    });
    
    return {
      stores: Array.from(storeSet).sort(),
      products: Array.from(productSet).sort()
    };
  }, [predictions]);

  // Get current data based on view mode
  const getCurrentData = () => {
    switch (viewMode) {
      case 'store':
        return storeData;
      case 'product':
        return productData;
      default:
        return chartData;
    }
  };

    // Calculate prediction accuracy (compare predicted and actual)
    const accuracy = useMemo(() => {
        const currentData = getCurrentData();
        if (!currentData || currentData.length === 0) return null;

        let validComparisons = 0;
        let totalAccuracy = 0;

        currentData.forEach(dataPoint => {
            const predicted = dataPoint.predicted;
            const actual = dataPoint.actual;
            if (predicted > 0 && actual > 0) {
                const difference = Math.abs(predicted - actual);
                const average = (predicted + actual) / 2;
                const accuracy = Math.max(0, 100 - (difference / average) * 100);
                totalAccuracy += accuracy;
                validComparisons++;
            }
        });

        if (validComparisons === 0) return null;
        return {
            percentage: Math.round(totalAccuracy / validComparisons),
            comparisons: validComparisons,
            total: currentData.length
        };
    }, [getCurrentData, viewMode]);

    // Check if current data has actual values
    const hasActualData = useMemo(() => {
        const currentData = getCurrentData();
        if (!currentData || currentData.length === 0) return false;
        return currentData.some(dataPoint => dataPoint.actual !== null && !isNaN(dataPoint.actual));
    }, [getCurrentData, viewMode]);

  // Custom tooltip for feedback
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const feedbackKey = `${data.store_id || 'all'}_${data.product_id || 'all'}_${data.date || label}`;
      const feedback = feedbackData[feedbackKey];

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{`Date: ${label}`}</p>
          
          {payload.map((entry, index) => (
            <p key={index} className="text-sm mb-1" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
          
          {/* Show accuracy for this data point if both values exist */}
          {payload.length >= 2 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Point Accuracy: {Math.round(Math.max(0, 100 - (Math.abs(payload[0].value - payload[1].value) / ((payload[0].value + payload[1].value) / 2)) * 100))}%
              </p>
            </div>
          )}
          
          {data.store_id && <p className="text-sm text-gray-600">Store: {data.store_id}</p>}
          {data.product_id && <p className="text-sm text-gray-600">Product: {data.product_id}</p>}
          
          {feedback && (
            <div className="mt-2 flex items-center gap-2">
              {feedback.isAccurate ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-600">
                {feedback.isAccurate ? 'Marked as accurate' : 'Marked as inaccurate'}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const data = getCurrentData();
    
    if (!data || data.length === 0) {
      let message = 'No prediction data available';
      if (viewMode === 'store' && selectedStore) {
        message = `No prediction data available for Store ${selectedStore}`;
      } else if (viewMode === 'product' && selectedProduct) {
        message = `No prediction data available for Product ${selectedProduct}`;
      }
      
      return (
        <motion.div 
          className="h-64 flex items-center justify-center text-gray-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium">{message}</p>
            <p className="text-sm mt-1">
              {viewMode !== 'all' && (
                <button
                  onClick={() => handleViewModeChange('all')}
                  className="text-cyan-600 hover:text-cyan-800 underline transition-colors duration-200"
                >
                  View all data
                </button>
              )}
            </p>
          </div>
        </motion.div>
      );
    }

    if (isLoading) {
      return (
        <motion.div 
          className="h-64 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3 text-cyan-600">
            <motion.div 
              className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-sm font-medium">Loading chart...</span>
          </div>
        </motion.div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const renderChartComponent = () => {
      switch (chartType) {
        case 'bar':
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="predicted" 
                fill="#06b6d4" 
                name="Predicted Stock"
                radius={[2, 2, 0, 0]}
              />
              {hasActualData && (
                <Bar 
                  dataKey="actual" 
                  fill="#10b981" 
                  name="Actual Stock"
                  radius={[2, 2, 0, 0]}
                />
              )}
            </BarChart>
          );
        case 'area':
          return (
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stroke="#06b6d4" 
                fill="#06b6d4" 
                fillOpacity={0.3}
                name="Predicted Stock"
              />
              {hasActualData && (
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  name="Actual Stock"
                />
              )}
            </AreaChart>
          );
        default:
          return (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#06b6d4" 
                strokeWidth={3}
                dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#0891b2' }}
                name="Predicted Stock"
                connectNulls={false}
              />
              {hasActualData && (
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#059669' }}
                  name="Actual Stock"
                  strokeDasharray="5 5"
                  connectNulls={false}
                />
              )}
            </LineChart>
          );
      }
    };

    return (
      <motion.div 
        className="transition-opacity duration-300 ease-in-out w-full min-w-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        key={`${chartType}-${viewMode}-${selectedStore}-${selectedProduct}`}
      >
        <div className="w-full h-[400px] min-h-[320px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            {renderChartComponent()}
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-6">          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-sky-700">Prediction Visualization</h3>
              <p className="text-sm text-sky-600">
                Interactive chart with feedback system 
                {predictions && (
                  <span className="ml-2 text-cyan-600">
                    ({predictions.length} predictions, {stores.length} stores, {products.length} products)
                  </span>
                )}
                {hasActualData && (
                  <span className="ml-2 text-green-600 font-medium">
                    • Actual data available
                  </span>
                )}
              </p>
            </div>
          </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              showFeedback 
                ? 'bg-cyan-100 text-cyan-700 border border-cyan-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {showFeedback ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Feedback Mode
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Chart Type Controls */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Chart Type:</label>
          <div className="flex gap-2">
            {[
              { value: 'line', label: 'Line', icon: TrendingUp },
              { value: 'bar', label: 'Bar', icon: BarChart2 },
              { value: 'area', label: 'Area', icon: Activity }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleChartTypeChange(value)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  chartType === value
                    ? 'bg-cyan-100 text-cyan-700 border border-cyan-300 shadow-md'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 hover:shadow-sm'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">View Mode:</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewModeChange('all')}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                viewMode === 'all'
                  ? 'bg-cyan-100 text-cyan-700 border border-cyan-300 shadow-md'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 hover:shadow-sm'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Target className="w-4 h-4" />
              All Data
            </button>
            
            <select
              value={selectedStore || ''}
              onChange={(e) => {
                const storeValue = e.target.value || null;
                handleViewModeChange(storeValue ? 'store' : 'all', storeValue, null);
              }}
              disabled={isLoading}
              className={`px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
              }`}
            >
              <option value="">Select Store</option>
              {stores.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
            
            <select
              value={selectedProduct || ''}
              onChange={(e) => {
                const productValue = e.target.value || null;
                handleViewModeChange(productValue ? 'product' : 'all', null, productValue);
              }}
              disabled={isLoading}
              className={`px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
              }`}
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product} value={product}>Product {product}</option>
              ))}
            </select>
          </div>
          
          {/* Data count indicator */}
          <div className="text-xs text-gray-500 ml-auto">
            Showing {getCurrentData().length} data points
            {viewMode === 'store' && selectedStore && ` for ${selectedStore}`}
            {viewMode === 'product' && selectedProduct && ` for Product ${selectedProduct}`}
          </div>
        </div>
      </div>

      {/* Accuracy Display */}
      {accuracy && hasActualData && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">
                  Prediction Accuracy: {accuracy.percentage}%
                </h4>
                <p className="text-sm text-green-600">
                  Based on {accuracy.comparisons} data points with actual values
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                accuracy.percentage >= 90 ? 'bg-green-100 text-green-800' :
                accuracy.percentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {accuracy.percentage >= 90 ? '🎯 Excellent' :
                 accuracy.percentage >= 75 ? '👍 Good' :
                 '⚠️ Needs Improvement'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No actual data warning */}
      {!hasActualData && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Prediction Only View</h4>
              <p className="text-sm text-blue-600">
                No actual sales data available for comparison. Upload data with actual sales to see accuracy metrics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mb-6">
        {renderChart()}
      </div>

      {/* Feedback Section */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            className="border-t border-gray-200 pt-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Prediction Feedback</h4>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Accurate: {Object.values(feedbackData).filter(f => f.isAccurate).length}</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>Inaccurate: {Object.values(feedbackData).filter(f => !f.isAccurate).length}</span>
              </div>
            </div>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {getCurrentData().slice(0, 6).map((dataPoint, index) => {
              const feedbackKey = `${dataPoint.store_id || 'all'}_${dataPoint.product_id || 'all'}_${dataPoint.date}`;
              const feedback = feedbackData[feedbackKey];
              
              return (
                <motion.div 
                  key={index} 
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {dataPoint.date}
                    </span>
                    <span className="text-lg font-bold text-cyan-600">
                      Predicted: {dataPoint.predicted}
                    </span>
                    {dataPoint.actual !== null && !isNaN(dataPoint.actual) && (
                      <span className="text-lg font-bold text-green-600 ml-2">
                        Actual: {dataPoint.actual}
                      </span>
                    )}
                  </div>
                  
                  {dataPoint.store_id && (
                    <p className="text-xs text-gray-600 mb-1">Store: {dataPoint.store_id}</p>
                  )}
                  {dataPoint.product_id && (
                    <p className="text-xs text-gray-600 mb-3">Product: {dataPoint.product_id}</p>
                  )}
                  
                  {feedback ? (
                    <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${
                      feedback.isAccurate 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {feedback.isAccurate ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {feedback.isAccurate ? 'Accurate' : 'Inaccurate'}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeedback(dataPoint, true)}
                        className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors duration-200 transform hover:scale-105"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        Accurate
                      </button>
                      <button
                        onClick={() => handleFeedback(dataPoint, false)}
                        className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors duration-200 transform hover:scale-105"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        Inaccurate
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Help us improve our predictions by providing feedback on the accuracy of our stock predictions.
            </p>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// Display name for debugging
PredictionChart.displayName = 'PredictionChart';

export default PredictionChart;
