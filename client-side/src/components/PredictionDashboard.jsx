import React, { useMemo } from 'react';
import { BarChart3, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const PredictionDashboard = ({ predictions = [], actuals = [] }) => {
  // Deep robust matching of predictions and actuals by store_id, product_id, date
  const matchedPairs = useMemo(() => {
    if (!Array.isArray(predictions) || !Array.isArray(actuals)) return [];
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
    const allKeys = new Set([...actualsMap.keys(), ...predictionsMap.keys()]);
    return Array.from(allKeys).map(key => {
      const pred = predictionsMap.get(key);
      const actual = actualsMap.get(key);
      return {
        store_id: pred?.store_id ?? actual?.store_id,
        product_id: pred?.product_id ?? actual?.product_id,
        date: pred?.date ?? actual?.date,
        predicted_stock: pred?.predicted_stock ?? null,
        actual_sales: actual?.sales ?? null,
        hasPrediction: !!pred,
        hasActual: !!actual
      };
    });
  }, [predictions, actuals]);

  // Chart Data (group by date — Predicted vs Actual Sales)
  const chartData = useMemo(() => {
    if (!matchedPairs.length) return [];
    const byDate = {};
    matchedPairs.forEach(({ date, predicted_stock, actual_sales, hasPrediction, hasActual }) => {
      if (!byDate[date]) byDate[date] = { date, predicted: 0, actual: 0, predCount: 0, actCount: 0 };
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
    });
    return Object.values(byDate)
      .map(d => ({
        date: d.date,
        'Predicted Stock': d.predCount ? Math.round(d.predicted / d.predCount) : 0,
        'Actual Sales': d.actCount ? Math.round(d.actual / d.actCount) : null
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [matchedPairs]);

  // Summary metrics
  const metrics = useMemo(() => {
    let accuracySum = 0, validCount = 0;
    matchedPairs.forEach(({ predicted_stock, actual_sales, hasPrediction, hasActual }) => {
      const predicted = parseFloat(predicted_stock ?? 0);
      const actual = parseFloat(actual_sales ?? 0);
      if (hasPrediction && hasActual && predicted > 0 && actual > 0) {
        const diff = Math.abs(predicted - actual);
        const avg = (predicted + actual) / 2;
        const acc = Math.max(0, 100 - (diff / avg) * 100);
        accuracySum += acc;
        validCount++;
      }
    });
    return {
      averageAccuracy: validCount ? Math.round(accuracySum / validCount) : 0,
      matchedCount: validCount,
      totalPredictions: predictions.length,
      totalActuals: actuals.length
    };
  }, [matchedPairs, predictions.length, actuals.length]);

  const hasActualData = actuals.length > 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl">
          <p className="font-semibold text-gray-800 mb-2">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            entry.value !== null && (
              <p key={index} className="text-sm mb-1" style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value}`}
              </p>
            )
          ))}
          {payload.length >= 2 && payload[0].value && payload[1].value && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Accuracy: {Math.round(Math.max(0, 100 - (Math.abs(payload[0].value - payload[1].value) / ((payload[0].value + payload[1].value) / 2)) * 100))}%
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-sky-700">Prediction vs Actual Sales</h2>
            <p className="text-sm text-sky-600">
              {hasActualData 
                ? `${metrics.matchedCount} matched comparisons • ${metrics.averageAccuracy}% accuracy`
                : 'Upload actual sales data to compare predictions'
              }
            </p>
          </div>
        </div>
        {hasActualData && metrics.averageAccuracy > 0 && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            metrics.averageAccuracy >= 90 ? 'bg-green-100 text-green-800' :
            metrics.averageAccuracy >= 75 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            <Target className="w-4 h-4" />
            {metrics.averageAccuracy >= 90 ? '🎯 Excellent' :
             metrics.averageAccuracy >= 75 ? '👍 Good' :
             '⚠️ Needs Improvement'}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-[400px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Predicted Stock" 
              stroke="#06b6d4" 
              strokeWidth={3}
              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, fill: '#0891b2' }}
              connectNulls={false}
            />
            {hasActualData && (
              <Line 
                type="monotone" 
                dataKey="Actual Sales" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#059669' }}
                strokeDasharray="5 5"
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* No actual data notice */}
      {!hasActualData && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            💡 Upload actual sales data (CSV with <code className="bg-blue-100 px-1 rounded">store_id, product_id, date, sales</code> columns) to see a comparison overlay.
          </p>
        </div>
      )}
    </div>
  );
};

export default PredictionDashboard;
