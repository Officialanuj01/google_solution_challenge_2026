import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PredictionDashboard = ({ predictions = [], actuals = [] }) => {
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
        hasPrediction: !!pred,
        hasActual: !!actual
      };
    });
  }, [predictions, actuals]);

  // Chart Data (group by date)
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
        ...d,
        predicted: d.predCount ? Math.round(d.predicted / d.predCount) : null,
        actual: d.actCount ? Math.round(d.actual / d.actCount) : null,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [matchedPairs]);

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-sky-700">Prediction Analysis</h2>
              <p className="text-sm text-sky-600">Compare backend predictions with uploaded actuals over time</p>
            </div>
          </div>
        </div>

        {/* Predicted vs Actual Chart - Line Graph */}
        <div className="w-full h-[400px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                name="Predicted Stock" 
                stroke="#06b6d4" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2 }} 
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                name="Actual Sales" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }} 
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            No valid data points found for visualization.
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionDashboard;
