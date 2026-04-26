import React, { useEffect, useState } from 'react';
import { Truck, Package, Zap, BarChart2, Globe, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

const LogisticsStoryAnimation = ({ isVisible = true, size = 'large' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = [
    {
      id: 'problem',
      title: 'The Challenge',
      description: 'Chaotic parcel management & inefficient delivery routes',
      icon: AlertCircle,
      color: 'red',
      duration: 2000
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis',
      description: 'Smart algorithms analyze patterns & optimize routes',
      icon: BarChart2,
      color: 'blue',
      duration: 2500
    },
    {
      id: 'organization',
      title: 'Smart Organization',
      description: 'Parcels automatically sorted by AI intelligence',
      icon: Package,
      color: 'green',
      duration: 2000
    },
    {
      id: 'optimization',
      title: 'Route Optimization',
      description: 'Delivery routes optimized for maximum efficiency',
      icon: Truck,
      color: 'cyan',
      duration: 2000
    },
    {
      id: 'success',
      title: 'Perfect Delivery',
      description: 'Fast, efficient, and cost-effective logistics',
      icon: CheckCircle,
      color: 'emerald',
      duration: 2000
    }
  ];

  useEffect(() => {
    if (isVisible) {
      setIsPlaying(true);
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % steps.length);
      }, steps[currentStep]?.duration || 2000);

      return () => clearInterval(interval);
    }
  }, [currentStep, isVisible]);

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-32 h-32',
      icon: 'w-8 h-8',
      text: 'text-xs',
      title: 'text-sm font-semibold',
      description: 'text-xs'
    },
    medium: {
      container: 'w-48 h-48',
      icon: 'w-12 h-12',
      text: 'text-sm',
      title: 'text-base font-semibold',
      description: 'text-sm'
    },
    large: {
      container: 'w-64 h-64',
      icon: 'w-16 h-16',
      text: 'text-base',
      title: 'text-lg font-bold',
      description: 'text-base'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`relative ${config.container} mx-auto`}>
      {/* Animated Background Circle */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-${currentStepData.color}-100 to-${currentStepData.color}-200 animate-pulse opacity-30`}></div>
      
      {/* Floating Elements Animation */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {/* Problem State - Chaotic Parcels */}
        {currentStep === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Chaotic floating parcels */}
              <div className="absolute -top-6 -left-6 w-4 h-4 bg-red-300 rounded-sm animate-bounce opacity-70">
                <Package className="w-3 h-3 text-red-600" />
              </div>
              <div className="absolute -top-4 right-8 w-3 h-3 bg-red-300 rounded-sm animate-ping opacity-70">
                <Package className="w-2 h-2 text-red-600" />
              </div>
              <div className="absolute bottom-6 -right-6 w-4 h-4 bg-red-300 rounded-sm animate-bounce delay-300 opacity-70">
                <Package className="w-3 h-3 text-red-600" />
              </div>
              <div className="absolute bottom-4 -left-8 w-3 h-3 bg-red-300 rounded-sm animate-ping delay-500 opacity-70">
                <Package className="w-2 h-2 text-red-600" />
              </div>
              <div className="absolute top-8 right-4 w-3 h-3 bg-red-300 rounded-sm animate-bounce delay-700 opacity-70">
                <Package className="w-2 h-2 text-red-600" />
              </div>
              {/* Confused truck */}
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center animate-spin-slow">
                <Truck className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis State */}
        {currentStep === 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* AI Analysis Waves */}
              <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
              <div className="absolute inset-2 rounded-full border-2 border-blue-500 animate-ping delay-300"></div>
              <div className="absolute inset-4 rounded-full border-2 border-blue-600 animate-ping delay-500"></div>
              {/* Central AI Brain */}
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <BarChart2 className="w-4 h-4 text-white" />
              </div>
              {/* Data points */}
              <div className="absolute -top-4 -left-4 w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="absolute -top-2 right-6 w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-200"></div>
              <div className="absolute bottom-6 -right-4 w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-400"></div>
              <div className="absolute bottom-2 -left-6 w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-600"></div>
            </div>
          </div>
        )}

        {/* Organization State */}
        {currentStep === 2 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Organized parcels in formation */}
              <div className="grid grid-cols-3 gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-sm animate-fadeIn delay-100">
                  <Package className="w-2 h-2 text-green-700" />
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-sm animate-fadeIn delay-200">
                  <Package className="w-2 h-2 text-green-700" />
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-sm animate-fadeIn delay-300">
                  <Package className="w-2 h-2 text-green-700" />
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-sm animate-fadeIn delay-400">
                  <Package className="w-2 h-2 text-green-700" />
                </div>
                <div className="w-4 h-4 bg-green-500 rounded-lg animate-pulse">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-sm animate-fadeIn delay-500">
                  <Package className="w-2 h-2 text-green-700" />
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-sm animate-fadeIn delay-600">
                  <Package className="w-2 h-2 text-green-700" />
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-sm animate-fadeIn delay-700">
                  <Package className="w-2 h-2 text-green-700" />
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-sm animate-fadeIn delay-800">
                  <Package className="w-2 h-2 text-green-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optimization State */}
        {currentStep === 3 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Optimized route path */}
              <svg className="w-16 h-16 absolute -top-8 -left-8" viewBox="0 0 64 64">
                <path
                  d="M8 32 Q32 8 56 32 Q32 56 8 32"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-cyan-500 animate-dash"
                />
              </svg>
              {/* Moving truck */}
              <div className="w-6 h-6 bg-cyan-500 rounded-lg flex items-center justify-center animate-moveInCircle">
                <Truck className="w-3 h-3 text-white" />
              </div>
              {/* Destination points */}
              <div className="absolute -top-6 -left-6 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="absolute -top-4 right-8 w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-200"></div>
              <div className="absolute bottom-6 -right-6 w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-400"></div>
              <div className="absolute bottom-4 -left-8 w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-600"></div>
            </div>
          </div>
        )}

        {/* Success State */}
        {currentStep === 4 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Success checkmark with celebration */}
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              {/* Celebration particles */}
              <div className="absolute -top-2 -left-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute -top-4 right-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-200"></div>
              <div className="absolute top-2 -right-4 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-400"></div>
              <div className="absolute bottom-2 -left-4 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-600"></div>
              <div className="absolute -bottom-2 right-4 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-800"></div>
              <div className="absolute bottom-4 left-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-1000"></div>
            </div>
          </div>
        )}
      </div>

      {/* Central Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${config.icon} flex items-center justify-center rounded-full bg-white shadow-lg animate-pulse`}>
          <IconComponent className={`${config.icon} text-${currentStepData.color}-500`} />
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-1">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Text Content */}
      <div className={`absolute -bottom-12 left-0 right-0 text-center ${config.text}`}>
        <h3 className={`${config.title} text-gray-800 mb-1`}>
          {currentStepData.title}
        </h3>
        <p className={`${config.description} text-gray-600`}>
          {currentStepData.description}
        </p>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes dash {
          0% { stroke-dasharray: 0 100; }
          100% { stroke-dasharray: 100 0; }
        }
        @keyframes moveInCircle {
          0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
        }
        
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
        .animate-dash { animation: dash 2s ease-in-out infinite; }
        .animate-moveInCircle { animation: moveInCircle 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default LogisticsStoryAnimation;
