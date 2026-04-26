import React, { useMemo } from 'react';
// import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { BarChart3, Target, Store, Package, Brain, TrendingUp, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import {PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const PredictionDashboard = ({ predictions = [], actuals = [], feedbackData = [] }) => {
  // Deep robust matching of predictions and actuals by store_id, product_id, date
  const matchedPairs = useMemo(() => {
    if (!Array.isArray(predictions) || !Array.isArray(actuals)) return [];
    // Build maps for fast lookup
    const actualsMap = new Map();
    actuals.forEach(a => {
      const key = `${a.store_id}|${a.product_id}|${a.date}`;
      actualsMap.set(key, a);
    });
    const predictionsMap = new Map();
    predictions.forEach(p => {
      const key = `${p.store_id}|${p.product_id}|${p.date}`;
      predictionsMap.set(key, p);
    });
    // Find all keys present in either actuals or predictions
    const allKeys = new Set([...actualsMap.keys(), ...predictionsMap.keys()]);
    // Build matched pairs, including missing/extra records
    return Array.from(allKeys).map(key => {
      const pred = predictionsMap.get(key);
      const actual = actualsMap.get(key);
      return {
        store_id: pred?.store_id ?? actual?.store_id,
        product_id: pred?.product_id ?? actual?.product_id,
        date: pred?.date ?? actual?.date,
        predicted_stock: pred?.predicted_stock ?? null,
        actual_sales: actual?.sales ?? null,
        predictionRecord: pred ?? null,
        actualRecord: actual ?? null,
        hasPrediction: !!pred,
        hasActual: !!actual
      };
    });
  }, [predictions, actuals]);

  // Metrics
  const metrics = useMemo(() => {
    if (!matchedPairs.length) return {
      totalComparisons: 0,
      matchedCount: 0,
      unmatchedPredictions: 0,
      unmatchedActuals: 0,
      averageAccuracy: 0,
      totalStores: 0,
      totalProducts: 0,
      predictedSum: 0,
      actualSum: 0
    };
    let accuracySum = 0, validCount = 0, predictedSum = 0, actualSum = 0;
    let matchedCount = 0, unmatchedPredictions = 0, unmatchedActuals = 0;
    const stores = new Set();
    const products = new Set();
    matchedPairs.forEach(({ store_id, product_id, predicted_stock, actual_sales, hasPrediction, hasActual }) => {
      stores.add(store_id);
      products.add(product_id);
      const predicted = parseFloat(predicted_stock ?? 0);
      const actual = parseFloat(actual_sales ?? 0);
      if (hasPrediction) predictedSum += predicted;
      if (hasActual) actualSum += actual;
      if (hasPrediction && hasActual) {
        matchedCount++;
        if (predicted > 0 && actual > 0) {
          const diff = Math.abs(predicted - actual);
          const avg = (predicted + actual) / 2;
          const acc = Math.max(0, 100 - (diff / avg) * 100);
          accuracySum += acc;
          validCount++;
        }
      } else if (hasPrediction && !hasActual) {
        unmatchedPredictions++;
      } else if (!hasPrediction && hasActual) {
        unmatchedActuals++;
      }
    });
    return {
      totalComparisons: matchedPairs.length,
      matchedCount,
      unmatchedPredictions,
      unmatchedActuals,
      averageAccuracy: validCount ? Math.round(accuracySum / validCount) : 0,
      totalStores: stores.size,
      totalProducts: products.size,
      predictedSum: Math.round(predictedSum),
      actualSum: Math.round(actualSum)
    };
  }, [matchedPairs]);

  // Chart Data (group by date)
  const chartData = useMemo(() => {
    if (!matchedPairs.length) return [];
    const byDate = {};
    matchedPairs.forEach(({ date, predicted_stock, actual_sales, hasPrediction, hasActual }) => {
      if (!byDate[date]) byDate[date] = { date, predicted: 0, actual: 0, predCount: 0, actCount: 0, accuracySum: 0, validCount: 0 };
      const predicted = parseFloat(predicted_stock ?? 0);
      const actual = parseFloat(actual_sales ?? 0);
      if (hasPrediction) {
        byDate[date].predicted += predicted;
        byDate[date].predCount++;
      }
      if (hasActual) {
        byDate[date].actual += actual;
        byDate[date].actCount++;
      }
      if (hasPrediction && hasActual && predicted > 0 && actual > 0) {
        const diff = Math.abs(predicted - actual);
        const avg = (predicted + actual) / 2;
        const acc = Math.max(0, 100 - (diff / avg) * 100);
        byDate[date].accuracySum += acc;
        byDate[date].validCount++;
      }
    });
    return Object.values(byDate)
      .map(d => ({
        ...d,
        predicted: d.predCount ? Math.round(d.predicted / d.predCount) : 0,
        actual: d.actCount ? Math.round(d.actual / d.actCount) : 0,
        accuracy: d.validCount ? Math.round(d.accuracySum / d.validCount) : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [matchedPairs]);

  // Accuracy Distribution
  const accuracyDistribution = useMemo(() => {
    if (!matchedPairs.length) return [];
    const buckets = {
      'Excellent (90-100%)': 0,
      'Good (75-89%)': 0,
      'Fair (60-74%)': 0,
      'Poor (<60%)': 0
    };
    let validCount = 0;
    matchedPairs.forEach(({ predicted_stock, actual_sales, hasPrediction, hasActual }) => {
      const predicted = parseFloat(predicted_stock ?? 0);
      const actual = parseFloat(actual_sales ?? 0);
      if (hasPrediction && hasActual && predicted > 0 && actual > 0) {
        validCount++;
        const diff = Math.abs(predicted - actual);
        const avg = (predicted + actual) / 2;
        const acc = Math.max(0, 100 - (diff / avg) * 100);
        if (acc >= 90) buckets['Excellent (90-100%)']++;
        else if (acc >= 75) buckets['Good (75-89%)']++;
        else if (acc >= 60) buckets['Fair (60-74%)']++;
        else buckets['Poor (<60%)']++;
      }
    });
    return Object.entries(buckets).map(([name, value]) => ({
      name,
      value,
      percentage: validCount ? Math.round((value / validCount) * 100) : 0
    }));
  }, [matchedPairs]);

  // Top Stores by accuracy
  const topStores = useMemo(() => {
    if (!matchedPairs.length) return [];
    const storeStats = {};
    matchedPairs.forEach(({ store_id, predicted_stock, actual_sales, hasPrediction, hasActual }) => {
      if (!storeStats[store_id]) storeStats[store_id] = { store_id, count: 0, accuracySum: 0, validCount: 0 };
      const predicted = parseFloat(predicted_stock ?? 0);
      const actual = parseFloat(actual_sales ?? 0);
      if (hasPrediction && hasActual) {
        storeStats[store_id].count++;
        if (predicted > 0 && actual > 0) {
          const diff = Math.abs(predicted - actual);
          const avg = (predicted + actual) / 2;
          const acc = Math.max(0, 100 - (diff / avg) * 100);
          storeStats[store_id].accuracySum += acc;
          storeStats[store_id].validCount++;
        }
      }
    });
    return Object.values(storeStats)
      .map(s => ({
        ...s,
        accuracy: s.validCount ? Math.round(s.accuracySum / s.validCount) : 0
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);
  }, [matchedPairs]);

  // Feedback summary (unchanged)
  const feedbackSummary = useMemo(() => {
    const total = feedbackData.length;
    const accurate = feedbackData.filter(f => f.feedback === 'accurate').length;
    const inaccurate = feedbackData.filter(f => f.feedback === 'inaccurate').length;
    return {
      total,
      accurate,
      inaccurate,
      accuratePercentage: total > 0 ? Math.round((accurate / total) * 100) : 0
    };
  }, [feedbackData]);

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-sky-700">Prediction Dashboard</h2>
              <p className="text-sm text-sky-600">Compare backend predictions with uploaded actuals</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-green-600" />
              <span className="text-lg font-bold text-gray-800">{metrics.averageAccuracy}%</span>
            </div>
            <div className="text-sm text-gray-600">Average Accuracy (matched records)</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-800">{metrics.matchedCount}</span>
            </div>
            <div className="text-sm text-gray-600">Matched Records</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-red-600" />
              <span className="text-lg font-bold text-gray-800">{metrics.unmatchedPredictions}</span>
            </div>
            <div className="text-sm text-gray-600">Predictions with no actuals</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
              <span className="text-lg font-bold text-gray-800">{metrics.unmatchedActuals}</span>
            </div>
            <div className="text-sm text-gray-600">Actuals with no prediction</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend Chart */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-6">
          <h3 className="text-xl font-bold text-sky-700 mb-4">Accuracy Trend</h3>
          <div className="w-full h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Predicted vs Actual Chart - Line Graph */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-6">
          <h3 className="text-xl font-bold text-sky-700 mb-4">Predicted vs Actual (Sales)</h3>
          <div className="w-full h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="predicted" name="Predicted Stock" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accuracy Distribution */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-6">
          <h3 className="text-xl font-bold text-sky-700 mb-6">Accuracy Distribution</h3>
          <div style={{ width: 250, height: 250, margin: '0 auto' }}>
            <PieChart width={250} height={250}>
              <Pie
                data={accuracyDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${percentage}%`}
              >
                {accuracyDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
          <div className="mt-4 space-y-2">
            {accuracyDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Stores */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-6">
          <h3 className="text-xl font-bold text-sky-700 mb-6">Top Performing Stores</h3>
          <div className="space-y-4">
            {topStores.map((store, index) => (
              <div key={store.store_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">Store {store.store_id}</div>
                    <div className="text-sm text-gray-600">{store.count} comparisons</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{store.accuracy}%</div>
                  <div className="text-xs text-gray-500">accuracy</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Feedback Summary */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-6">
          <h3 className="text-xl font-bold text-sky-700 mb-6">User Feedback</h3>
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {feedbackSummary.accuratePercentage}%
              </div>
              <div className="text-sm text-green-700">User Satisfaction</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-bold text-green-800">{feedbackSummary.accurate}</div>
                  <div className="text-xs text-green-600">Accurate</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-bold text-red-800">{feedbackSummary.inaccurate}</div>
                  <div className="text-xs text-red-600">Inaccurate</div>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              Total feedback: {feedbackSummary.total} responses
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
        <h3 className="text-xl font-bold text-sky-700 mb-6">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-blue-800">Model Performance</span>
            </div>
            <div className="text-2xl font-bold text-blue-800 mb-2">
              {metrics.averageAccuracy >= 85 ? 'Excellent' :
               metrics.averageAccuracy >= 70 ? 'Good' :
               metrics.averageAccuracy >= 55 ? 'Fair' : 'Needs Improvement'}
            </div>
            <div className="text-sm text-blue-600">
              Current model accuracy is {metrics.averageAccuracy}%
            </div>
          </div>
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-green-800">Trend Analysis</span>
            </div>
            <div className="text-2xl font-bold text-green-800 mb-2">
              Stable
            </div>
            <div className="text-sm text-green-600">
              No trend calculation in this view
            </div>
          </div>
          <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-purple-600" />
              <span className="font-semibold text-purple-800">Quality Score</span>
            </div>
            <div className="text-2xl font-bold text-purple-800 mb-2">
              {Math.round((metrics.averageAccuracy + feedbackSummary.accuratePercentage) / 2)}%
            </div>
            <div className="text-sm text-purple-600">
              Combined accuracy and user satisfaction
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionDashboard;
