import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Zap, Award, DollarSign, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const TimeSavingsTracker = ({ responses = [], csvData = null, callDone = false }) => {
  const [animatedValues, setAnimatedValues] = useState({
    timeSaved: 0,
    efficiencyGain: 0
  });

  // Calculate time savings metrics
  const metrics = React.useMemo(() => {
    const safeResponses = Array.isArray(responses) ? responses : [];
    const totalCalls = safeResponses.length;
    
    // Time calculations
    const manualTimePerCall = 4; // minutes
    const automatedTimePerCall = 0.75; // minutes
    const timeSavedPerCall = manualTimePerCall - automatedTimePerCall; // 3.25 minutes
    
    const totalTimeSaved = totalCalls * timeSavedPerCall;
    const totalManualTime = totalCalls * manualTimePerCall;
    const totalAutomatedTime = totalCalls * automatedTimePerCall;
    
    // Cost calculations removed - focusing on time savings only
    
    // Efficiency calculations
    const efficiencyGain = totalManualTime > 0 ? Math.round((totalTimeSaved / totalManualTime) * 100) : 0;
    
    return {
      totalCalls,
      timeSavedMinutes: totalTimeSaved,
      timeSavedHours: totalTimeSaved / 60,
      efficiencyGain,
      callsPerHour: totalAutomatedTime > 0 ? Math.round((totalCalls * 60) / totalAutomatedTime) : 0,
      manualCallsPerHour: 15 // Standard estimate for manual calls
    };
  }, [responses]);

  // Animate values when metrics change
  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      setAnimatedValues({
        timeSaved: Math.round(metrics.timeSavedMinutes * easeProgress),
        efficiencyGain: Math.round(metrics.efficiencyGain * easeProgress)
      });
      
      if (step >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [metrics]);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Don't render if no data and calls haven't been made
  if (!callDone && metrics.totalCalls === 0) {
    return null;
  }

  // Show preview message if calls are done but no responses yet
  const showPreview = callDone && metrics.totalCalls === 0;

  return (
    <motion.div 
      className="bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 rounded-2xl shadow-xl border border-cyan-200/50 p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">⚡ Time Savings Analysis</h3>
          <p className="text-sm text-gray-600">
            {showPreview ? "Waiting for customer responses..." : "Real-time efficiency analysis"}
          </p>
        </div>
      </div>

      {showPreview ? (
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
            <span className="text-lg font-medium text-gray-700">Processing Time Savings...</span>
          </div>
          <p className="text-gray-600 mb-4">
            Once customer responses are collected, you'll see detailed time savings analysis here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
            {/* Preview placeholders */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Time Saved</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">--:--</div>
              <div className="text-xs text-gray-500">vs manual process</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-1">--%</div>
              <div className="text-xs text-gray-500">Time reduction</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Speed</span>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-1">-.-x</div>
              <div className="text-xs text-gray-500">vs manual calls</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time Saved */}
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-cyan-200"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Time Saved</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatTime(animatedValues.timeSaved)}
            </div>
            <div className="text-xs text-gray-500">
              vs {formatTime(metrics.totalCalls * 4)} manual
            </div>
          </motion.div>

          {/* Efficiency Gain */}
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Efficiency</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {animatedValues.efficiencyGain}%
            </div>
            <div className="text-xs text-gray-500">
              Time reduction
            </div>
          </motion.div>

          {/* Productivity */}
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Speed</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {Math.round(metrics.callsPerHour / Math.max(1, metrics.manualCallsPerHour) * 10) / 10}x
            </div>
            <div className="text-xs text-gray-500">
              {metrics.callsPerHour} vs {metrics.manualCallsPerHour} calls/hr
            </div>
          </motion.div>
        </div>
      )}

      {/* Progress indicator */}
      {metrics.totalCalls > 0 && (
        <div className="mt-4 pt-4 border-t border-cyan-200">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Automation Progress</span>
            <span>{metrics.totalCalls} calls completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (metrics.totalCalls / Math.max(1, csvData?.totalRows || 10)) * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TimeSavingsTracker;
