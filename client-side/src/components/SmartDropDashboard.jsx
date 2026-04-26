import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { 
  Phone, Clock, Users, TrendingUp, Activity, Target, Zap, Award, 
  CheckCircle, XCircle, AlertTriangle, Calendar, RefreshCw, Download,
  ArrowUp, ArrowDown, BarChart3, PhoneCall, UserCheck, Timer,
  Truck, MapPin, Star, ThumbsUp, ThumbsDown, Bell, AlertCircle
} from 'lucide-react';

const SmartDropDashboard = ({ responses = [], csvData = null, callDone = false, callHistory = [] }) => {
  // Top-level robust guards for all incoming props
  const safeResponses = Array.isArray(responses) ? responses : [];
  const safeCsvData = (csvData && typeof csvData === 'object' && Array.isArray(csvData?.rows)) ? csvData : { rows: [] };
  const safeCallHistory = Array.isArray(callHistory) ? callHistory : [];

  // If all data is missing or malformed, show a friendly message and avoid rendering dashboard
  const noData = safeResponses.length === 0 && safeCsvData.rows.length === 0;
  if (noData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-cyan-100">
          <AlertCircle className="w-10 h-10 text-cyan-600" />
        </div>
        <h2 className="text-2xl font-bold text-cyan-700 mb-2">No Delivery Data Available</h2>
        <p className="text-gray-600 mb-4">Please upload a CSV or start delivery calls to view analytics.</p>
        <div className="text-sm text-gray-400">If you believe this is an error, please refresh or contact support.</div>
      </div>
    );
  }
  const [selectedTimeRange, setSelectedTimeRange] = useState('today'); // today, week, month, all
  const [refreshing, setRefreshing] = useState(false);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const totalCalls = safeResponses.length;
    
    // More flexible success detection - check for positive delivery confirmations
    const successfulCalls = safeResponses.filter(r => {
      const status = (r.delivery_status || r.status || '').toLowerCase();
      const transcription = (r.transcription || '').toLowerCase();
      
      // Check for explicit success statuses
      if (status.includes('confirmed') || status.includes('delivered') || 
          status.includes('successful') || status.includes('yes') ||
          status.includes('received') || status.includes('home')) {
        return true;
      }
      
      // Check transcription for positive responses
      if (transcription.includes('yes') || transcription.includes('received') ||
          transcription.includes('delivered') || transcription.includes('home') ||
          transcription.includes('here') || transcription.includes('got it')) {
        return true;
      }
      
      return false;
    }).length;
    
    const failedCalls = safeResponses.filter(r => {
      const status = (r.delivery_status || r.status || '').toLowerCase();
      const transcription = (r.transcription || '').toLowerCase();
      
      // Check for explicit failure statuses
      if (status.includes('failed') || status.includes('no_answer') || 
          status.includes('unsuccessful') || status.includes('no') ||
          status.includes('not_home') || status.includes('rejected')) {
        return true;
      }
      
      // Check transcription for negative responses
      if (transcription.includes('no') || transcription.includes('not home') ||
          transcription.includes('not received') || transcription.includes('wrong') ||
          transcription.includes('incorrect')) {
        return true;
      }
      
      return false;
    }).length;
    
    const pendingCalls = totalCalls - successfulCalls - failedCalls;
    const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;
    // Time calculations
    const averageManualCallTime = 4; // minutes per call
    const totalTimeSaved = totalCalls * averageManualCallTime;
    // Calculate average call duration
    const callsWithDuration = safeResponses.filter(r => r.call_duration && r.call_duration > 0);
    const averageCallTime = callsWithDuration.length > 0 
      ? Math.round(callsWithDuration.reduce((sum, r) => sum + parseFloat(r.call_duration || 0), 0) / callsWithDuration.length)
      : 45;
    
    // Customer satisfaction (based on successful deliveries)
    const customerSatisfaction = successRate;
    // Efficiency metrics
    const totalCustomers = safeCsvData?.rows?.length || totalCalls;
    const completionRate = totalCustomers > 0 ? Math.round((totalCalls / totalCustomers) * 100) : 0;
    // Calculate hourly call volume
    const callsByHour = safeResponses.reduce((acc, response) => {
      const hour = new Date().getHours(); // In real app, use response timestamp
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.entries(callsByHour).reduce((max, [hour, count]) => 
      count > max.count ? { hour, count } : max, { hour: '0', count: 0 }
    );
    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      pendingCalls,
      successRate,
      totalTimeSaved,
      averageCallTime,
      customerSatisfaction,
      completionRate,
      totalCustomers,
      peakHour: parseInt(peakHour.hour),
      peakHourCalls: peakHour.count
    };
  }, [safeResponses, safeCsvData]);

  // Prepare time-series data for charts
  const timeSeriesData = useMemo(() => {
    if (!safeResponses || safeResponses.length === 0) return [];
    // Group calls by hour/day depending on time range
    const groupBy = selectedTimeRange === 'today' ? 'hour' : 'day';
    const groups = {};
    safeResponses.forEach(response => {
      // In a real app, you'd use the actual timestamp from the response
      const now = new Date();
      const key = groupBy === 'hour' 
        ? `${now.getHours()}:00`
        : now.toISOString().split('T')[0];
      if (!groups[key]) {
        groups[key] = {
          time: key,
          total: 0,
          successful: 0,
          failed: 0,
          pending: 0
        };
      }
      groups[key].total++;
      if (response.delivery_status === 'confirmed' || response.delivery_status === 'delivered') {
        groups[key].successful++;
      } else if (response.delivery_status === 'failed' || response.delivery_status === 'no_answer') {
        groups[key].failed++;
      } else {
        groups[key].pending++;
      }
    });
    return Object.values(groups).sort((a, b) => a.time.localeCompare(b.time));
  }, [safeResponses, selectedTimeRange]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const statuses = {
      'Successful': { count: 0, color: '#10b981' },
      'Failed': { count: 0, color: '#ef4444' },
      'Pending': { count: 0, color: '#f59e0b' },
      'No Answer': { count: 0, color: '#6b7280' }
    };
    safeResponses.forEach(response => {
      switch (response.delivery_status) {
        case 'confirmed':
        case 'delivered':
        case 'successful':
          statuses['Successful'].count++;
          break;
        case 'failed':
        case 'unsuccessful':
          statuses['Failed'].count++;
          break;
        case 'no_answer':
          statuses['No Answer'].count++;
          break;
        default:
          statuses['Pending'].count++;
      }
    });
    return Object.entries(statuses).map(([name, data]) => ({
      name,
      value: data.count,
      color: data.color,
      percentage: safeResponses.length > 0 ? Math.round((data.count / safeResponses.length) * 100) : 0
    }));
  }, [safeResponses]);

  // Performance insights
  const performanceInsights = useMemo(() => {
    const insights = [];
    // Success rate insight
    if (metrics.successRate >= 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Performance',
        message: `${metrics.successRate}% success rate exceeds industry standards`,
        icon: CheckCircle
      });
    } else if (metrics.successRate >= 60) {
      insights.push({
        type: 'warning',
        title: 'Good Performance',
        message: `${metrics.successRate}% success rate is above average`,
        icon: AlertTriangle
      });
    } else {
      insights.push({
        type: 'error',
        title: 'Improvement Needed',
        message: `${metrics.successRate}% success rate needs attention`,
        icon: XCircle
      });
    }
    // Time efficiency insight
    if (metrics.totalTimeSaved > 60) {
      insights.push({
        type: 'success',
        title: 'Significant Time Savings',
        message: `Saved ${Math.round(metrics.totalTimeSaved / 60)} hours of manual work`,
        icon: Clock
      });
    }
    // Cost efficiency insight
    if (metrics.estimatedCostSavings > 50) {
      insights.push({
        type: 'success',
        title: 'Cost Effective',
        message: `Estimated savings of $${Math.round(metrics.estimatedCostSavings)}`,
        icon: Award
      });
    }
    return insights;
  }, [metrics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue" }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend > 0 ? 'bg-green-100 text-green-700' : 
            trend < 0 ? 'bg-red-100 text-red-700' : 
            'bg-gray-100 text-gray-700'
          }`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : 
             trend < 0 ? <ArrowDown className="w-3 h-3" /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
      {subtitle && (
        <div className="text-xs text-gray-500">{subtitle}</div>
      )}
    </div>
  );

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

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
              <h2 className="text-3xl font-bold text-sky-700">SmartDrop Dashboard</h2>
              <p className="text-sm text-sky-600">Real-time delivery automation analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={Phone}
            title="Total Calls Made"
            value={metrics.totalCalls.toLocaleString()}
            subtitle="Automated delivery confirmations"
            color="cyan"
          />
          
          <MetricCard
            icon={Target}
            title="Success Rate"
            value={`${metrics.successRate}%`}
            subtitle="Successful confirmations"
            color="green"
          />
          
          <MetricCard
            icon={Clock}
            title="Time Saved"
            value={formatTime(metrics.totalTimeSaved)}
            subtitle="Manual work eliminated"
            color="blue"
          />
        </div>
      </div>

      {/* Real-time Status Overview */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
        <h3 className="text-xl font-bold text-sky-700 mb-6">Real-time Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-green-700">{metrics.successfulCalls}</div>
            <div className="text-sm text-green-600">Successful Deliveries</div>
          </div>
          <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-red-700">{metrics.failedCalls}</div>
            <div className="text-sm text-red-600">Failed Attempts</div>
          </div>
          <div className="text-center p-6 bg-yellow-50 rounded-xl border border-yellow-200">
            <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-yellow-700">{metrics.pendingCalls}</div>
            <div className="text-sm text-yellow-600">Pending/Unknown</div>
          </div>
        </div>
      </div>
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
        <h3 className="text-xl font-bold text-sky-700 mb-6">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performanceInsights.map((insight, index) => (
            <div 
              key={index}
              className={`p-6 rounded-xl border-2 ${
                insight.type === 'success' ? 'bg-green-50 border-green-200' :
                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <insight.icon className={`w-6 h-6 ${
                  insight.type === 'success' ? 'text-green-600' :
                  insight.type === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
                <span className={`font-semibold ${
                  insight.type === 'success' ? 'text-green-800' :
                  insight.type === 'warning' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {insight.title}
                </span>
              </div>
              <p className={`text-sm ${
                insight.type === 'success' ? 'text-green-700' :
                insight.type === 'warning' ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                {insight.message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Time Savings Analysis */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-8">
        <h3 className="text-2xl font-bold text-sky-700 mb-8 flex items-center gap-3">
          <Clock className="w-7 h-7 text-cyan-600" />
          Time Savings Analysis
        </h3>
        
        {/* Time Savings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-blue-800">Total Time Saved</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">{formatTime(metrics.totalTimeSaved)}</div>
            <div className="text-sm text-blue-600">vs Manual Calling</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-green-800">Efficiency Gain</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">{Math.round((metrics.totalTimeSaved / Math.max(1, metrics.totalCalls * 0.75)) * 100)}%</div>
            <div className="text-sm text-green-600">Time Reduction</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-purple-800">Cost Savings</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">${Math.round(metrics.estimatedCostSavings)}</div>
            <div className="text-sm text-purple-600">Labor Cost Saved</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-orange-800">Productivity</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">{Math.round(metrics.totalCalls / Math.max(1, metrics.totalTimeSaved / 60))}x</div>
            <div className="text-sm text-orange-600">Calls per Hour</div>
          </div>
        </div>

        {/* Time Savings Comparison Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Manual vs Automated Time Comparison */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Manual vs Automated Comparison</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { 
                  method: 'Manual Calls', 
                  timeMinutes: metrics.totalCalls * 4, // 4 minutes per manual call
                  calls: metrics.totalCalls,
                  color: '#ef4444'
                },
                { 
                  method: 'SmartDrop AI', 
                  timeMinutes: metrics.totalCalls * 0.75, // 45 seconds per automated call
                  calls: metrics.totalCalls,
                  color: '#06b6d4'
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="method" stroke="#64748b" />
                <YAxis stroke="#64748b" label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e7ff', 
                    borderRadius: '8px' 
                  }}
                  formatter={(value, name) => [`${value} minutes`, 'Total Time']}
                />
                <Bar dataKey="timeMinutes" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative Time Savings Over Calls */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Cumulative Time Savings</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={Array.from({ length: Math.min(metrics.totalCalls, 20) }, (_, i) => ({
                callNumber: i + 1,
                timeSaved: (i + 1) * 3.25, // 3.25 minutes saved per call
                manualTime: (i + 1) * 4,
                automatedTime: (i + 1) * 0.75
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="callNumber" stroke="#64748b" />
                <YAxis stroke="#64748b" label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e7ff', 
                    borderRadius: '8px' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="timeSaved" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Time Saved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Breakdown Analysis */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-6 rounded-xl">
            <h5 className="font-semibold text-gray-800 mb-3">Manual Process</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Dialing & Setup</span>
                <span className="text-sm font-medium">1.5 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversation</span>
                <span className="text-sm font-medium">2.0 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Documentation</span>
                <span className="text-sm font-medium">0.5 min</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-gray-800">Total per Call</span>
                  <span className="text-red-600">4.0 min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-blue-100 p-6 rounded-xl">
            <h5 className="font-semibold text-gray-800 mb-3">SmartDrop AI</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Auto Dialing</span>
                <span className="text-sm font-medium">0.1 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">AI Conversation</span>
                <span className="text-sm font-medium">0.5 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Auto Recording</span>
                <span className="text-sm font-medium">0.15 min</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-gray-800">Total per Call</span>
                  <span className="text-cyan-600">0.75 min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl">
            <h5 className="font-semibold text-gray-800 mb-3">Savings Summary</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Time per Call</span>
                <span className="text-sm font-medium text-green-600">+3.25 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Calls</span>
                <span className="text-sm font-medium">{metrics.totalCalls}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Efficiency</span>
                <span className="text-sm font-medium text-green-600">81% faster</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-gray-800">Total Saved</span>
                  <span className="text-green-600">{formatTime(metrics.totalTimeSaved)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency Metrics */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-6">
          <h3 className="text-xl font-bold text-sky-700 mb-6">Efficiency Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Average Call Duration</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{metrics.averageCallTime}s</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Completion Rate</span>
              </div>
              <span className="text-xl font-bold text-green-600">{metrics.completionRate}%</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">Customers Reached</span>
              </div>
              <span className="text-xl font-bold text-purple-600">{metrics.totalCalls}/{metrics.totalCustomers}</span>
            </div>
          </div>
        </div>

        {/* Real-time Status */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 p-6">
          <h3 className="text-xl font-bold text-sky-700 mb-6">Real-time Status</h3>
          <div className="space-y-4">
            {callDone ? (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="font-semibold text-green-800">All Calls Completed</span>
                </div>
                <p className="text-sm text-green-700">
                  Successfully processed {metrics.totalCalls} delivery confirmations
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
                  <span className="font-semibold text-blue-800">System Active</span>
                </div>
                <p className="text-sm text-blue-700">
                  Ready to process delivery confirmations
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{metrics.successfulCalls}</div>
                <div className="text-xs text-green-700">Successful</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">{metrics.failedCalls}</div>
                <div className="text-xs text-red-700">Failed</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{metrics.pendingCalls}</div>
                <div className="text-xs text-yellow-700">Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      {/* <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 rounded-2xl p-8 text-white">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">🎉 SmartDrop Impact Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold mb-2">{metrics.totalCalls}</div>
              <div className="text-sm opacity-90">Automated Calls</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">{formatTime(metrics.totalTimeSaved)}</div>
              <div className="text-sm opacity-90">Time Saved</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">${Math.round(metrics.estimatedCostSavings)}</div>
              <div className="text-sm opacity-90">Cost Savings</div>
            </div>
          </div>
          <p className="mt-6 text-sm opacity-90">
            Your SmartDrop automation has transformed delivery confirmations, saving valuable time and resources 
            while maintaining excellent customer service standards.
          </p>
        </div>
      </div> */}
    </div>
  );
};

export default SmartDropDashboard;
