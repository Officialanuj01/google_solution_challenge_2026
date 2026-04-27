import React from 'react';
import { X, Brain, TrendingUp, AlertTriangle, Lightbulb, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GeminiInsightsModal = ({ isOpen, onClose, insights, type = 'prediction' }) => {
  if (!isOpen) return null;

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': case 'critical': return 'text-red-600 bg-red-50 border-red-100';
      case 'medium': case 'important': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'low': case 'nice_to_have': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-sky-900/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-cyan-100 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Gemini AI {type === 'prediction' ? 'Prediction' : 'Delivery'} Analysis
                  <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
                </h2>
                <p className="text-cyan-100 text-sm opacity-90">Intelligent insights powered by Google Gemini</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {insights?.summary && (
              <section className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-2xl border border-cyan-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-12 h-12 text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold text-sky-800 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                  Executive Summary
                </h3>
                <p className="text-sky-700 leading-relaxed italic">"{insights.summary}"</p>
              </section>
            )}

            {type === 'prediction' ? (
              <>
                {/* Trends */}
                {insights?.trends?.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Key Trends
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.trends.map((trend, i) => (
                        <div key={i} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-700">{trend.title}</h4>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.direction === 'up' ? 'text-green-600 bg-green-50' : trend.direction === 'down' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>
                              {trend.metric} {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{trend.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Anomalies */}
                {insights?.anomalies?.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Detected Anomalies
                    </h3>
                    <div className="space-y-4">
                      {insights.anomalies.map((anomaly, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${getSeverityColor(anomaly.severity)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold">{anomaly.title}</h4>
                            <span className="text-xs uppercase tracking-wider font-bold">{anomaly.severity} Priority</span>
                          </div>
                          <p className="text-sm mb-3 opacity-90">{anomaly.description}</p>
                          {anomaly.recommendation && (
                            <div className="text-sm font-medium pt-2 border-t border-current border-opacity-10">
                              💡 Recommendation: {anomaly.recommendation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Recommendations */}
                {insights?.recommendations?.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Actionable Recommendations
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {insights.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                            {i + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 mb-1">{rec.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{rec.category}</span>
                              <span className="text-xs text-blue-600 font-medium">Impact: {rec.expectedImpact}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <>
                {/* Delivery Patterns */}
                {insights?.deliveryPatterns?.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Customer Response Patterns
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.deliveryPatterns.map((pattern, i) => (
                        <div key={i} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-700">{pattern.title}</h4>
                            <span className="text-xs font-bold px-2 py-1 rounded-full text-blue-600 bg-blue-50">
                              {pattern.percentage}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{pattern.description}</p>
                          <p className="text-xs text-cyan-600 font-medium italic">💡 {pattern.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Failure Analysis */}
                {insights?.failureAnalysis && (
                  <section className="bg-red-50/50 border border-red-100 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      Efficiency & Optimization
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div className="bg-white p-4 rounded-xl border border-red-100">
                        <span className="text-xs text-gray-500 block mb-1">Success Rate</span>
                        <span className="text-2xl font-bold text-red-600">{insights.failureAnalysis.successRate}</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-red-100">
                        <span className="text-xs text-gray-500 block mb-1">Total Calls Analyzed</span>
                        <span className="text-2xl font-bold text-gray-800">{insights.failureAnalysis.totalCalls}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-red-700 mb-2">Common Challenges:</h4>
                        <div className="flex flex-wrap gap-2">
                          {insights.failureAnalysis.commonFailureReasons?.map((reason, i) => (
                            <span key={i} className="px-3 py-1 rounded-lg bg-white border border-red-100 text-xs text-red-600">{reason}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-red-800 font-medium pt-3 border-t border-red-100">
                        🎯 Strategy: {insights.failureAnalysis.recommendation}
                      </p>
                    </div>
                  </section>
                )}

                {/* Time Slot Optimization */}
                {insights?.timeSlotOptimization?.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      Time Slot Recommendations
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-600">Time Slot</th>
                            <th className="px-4 py-2 text-left text-gray-600">Success Rate</th>
                            <th className="px-4 py-2 text-left text-gray-600">Preference</th>
                            <th className="px-4 py-2 text-left text-gray-600">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {insights.timeSlotOptimization.map((slot, i) => (
                            <tr key={i}>
                              <td className="px-4 py-3 font-medium text-gray-700">{slot.timeSlot}</td>
                              <td className="px-4 py-3 text-green-600 font-bold">{slot.successRate}</td>
                              <td className="px-4 py-3 text-blue-600">{slot.customerPreference}</td>
                              <td className="px-4 py-3 text-gray-600">{slot.recommendation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Risks (if prediction) */}
            {type === 'prediction' && insights?.risks?.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Supply Chain Risks
                </h3>
                <div className="space-y-4">
                  {insights.risks.map((risk, i) => (
                    <div key={i} className="p-4 rounded-xl border border-red-50 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-red-800">{risk.title}</h4>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 uppercase">Impact: {risk.impact}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                      <div className="text-xs font-medium text-red-700 bg-red-50 p-2 rounded-lg">
                         🛡️ Mitigation: {risk.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Close Insights
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GeminiInsightsModal;
