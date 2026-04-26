import React, { useEffect, useState } from 'react';

const CartoonishLogisticsStory = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'chaos', duration: 3000, title: 'Messy Orders' },
    { id: 'ai-analysis', duration: 3000, title: 'AI Sorting...' },
    { id: 'organization', duration: 3000, title: 'Smart Routing' },
    { id: 'delivery', duration: 3000, title: 'Efficient Delivery' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, steps[currentStep]?.duration || 3000);

    return () => clearInterval(interval);
  }, [currentStep]);

  // Cartoonish Truck SVG Component
  const DeliveryTruck = ({ x, y, moving = false }) => (
    <g transform={`translate(${x}, ${y})`}>
      {/* Truck body */}
      <rect x="0" y="8" width="20" height="8" fill="#3B82F6" rx="2" className={moving ? 'animate-truck-move' : ''} />
      {/* Cab */}
      <rect x="0" y="4" width="8" height="8" fill="#1E40AF" rx="2" className={moving ? 'animate-truck-move' : ''} />
      {/* Windows */}
      <rect x="1" y="5" width="6" height="3" fill="#BFDBFE" rx="1" />
      {/* Wheels */}
      <circle cx="5" cy="18" r="2.5" fill="#374151" className={moving ? 'animate-spin' : ''} />
      <circle cx="15" cy="18" r="2.5" fill="#374151" className={moving ? 'animate-spin' : ''} />
      <circle cx="5" cy="18" r="1.5" fill="#6B7280" />
      <circle cx="15" cy="18" r="1.5" fill="#6B7280" />
      {/* Packages in truck */}
      <rect x="10" y="10" width="2" height="2" fill="#F59E0B" />
      <rect x="13" y="9" width="2" height="3" fill="#EF4444" />
      <rect x="16" y="11" width="2" height="2" fill="#10B981" />
    </g>
  );

  // Warehouse/Sorting Center Component
  const SortingCenter = ({ x, y }) => (
    <g transform={`translate(${x}, ${y})`}>
      {/* Building */}
      <rect x="0" y="6" width="25" height="12" fill="#E5E7EB" rx="1" />
      <rect x="0" y="6" width="25" height="3" fill="#9CA3AF" rx="1" />
      {/* Doors */}
      <rect x="3" y="12" width="4" height="6" fill="#374151" />
      <rect x="8" y="12" width="4" height="6" fill="#374151" />
      <rect x="13" y="12" width="4" height="6" fill="#374151" />
      <rect x="18" y="12" width="4" height="6" fill="#374151" />
      {/* Roof */}
      <polygon points="0,6 12.5,2 25,6" fill="#6B7280" />
      {/* Sign */}
      <rect x="8" y="8" width="9" height="2" fill="#3B82F6" />
      <text x="12.5" y="9.5" textAnchor="middle" fontSize="1.2" fill="white">SORTING</text>
    </g>
  );

  // Smart Routing Network Component
  const SmartRoutingNetwork = () => (
    <g>
      {/* Network nodes */}
      <circle cx="15" cy="8" r="2" fill="#10B981" className="animate-pulse" />
      <circle cx="35" cy="6" r="2" fill="#10B981" className="animate-pulse" style={{animationDelay: '0.5s'}} />
      <circle cx="55" cy="10" r="2" fill="#10B981" className="animate-pulse" style={{animationDelay: '1s'}} />
      <circle cx="25" cy="15" r="2" fill="#10B981" className="animate-pulse" style={{animationDelay: '1.5s'}} />
      <circle cx="45" cy="18" r="2" fill="#10B981" className="animate-pulse" style={{animationDelay: '2s'}} />
      
      {/* Network connections */}
      <path d="M 15 8 L 35 6 M 35 6 L 55 10 M 15 8 L 25 15 M 25 15 L 45 18 M 35 6 L 45 18" 
            stroke="#10B981" strokeWidth="0.5" className="animate-pulse" />
      
      {/* Data packets moving along paths */}
      <circle cx="25" cy="7" r="0.5" fill="#3B82F6" className="animate-data-flow" />
      <circle cx="40" cy="12" r="0.5" fill="#3B82F6" className="animate-data-flow-2" />
      <circle cx="35" cy="16" r="0.5" fill="#3B82F6" className="animate-data-flow-3" />
    </g>
  );

  // Scattered Packages Component
  const ScatteredPackages = () => (
    <g>
      <rect x="10" y="15" width="3" height="3" fill="#F59E0B" className="animate-float-chaos" />
      <rect x="25" y="8" width="2" height="2" fill="#EF4444" className="animate-float-chaos-2" />
      <rect x="35" y="18" width="2.5" height="2.5" fill="#10B981" className="animate-float-chaos-3" />
      <rect x="45" y="12" width="2" height="2" fill="#8B5CF6" className="animate-float-chaos" />
      <rect x="55" y="20" width="3" height="2" fill="#F97316" className="animate-float-chaos-2" />
    </g>
  );

  // AI Brain Component (Enhanced)
  const AIBrain = ({ x, y }) => (
    <g transform={`translate(${x}, ${y})`}>
      {/* Brain outline */}
      <path d="M 8 2 Q 12 0 16 2 Q 18 4 18 8 Q 18 12 16 14 Q 12 16 8 14 Q 6 12 6 8 Q 6 4 8 2" 
            fill="#A855F7" className="animate-pulse" />
      {/* Neural network pattern */}
      <circle cx="8" cy="6" r="0.8" fill="#FDE68A" className="animate-ping" />
      <circle cx="12" cy="8" r="0.8" fill="#FDE68A" className="animate-ping" style={{animationDelay: '0.3s'}} />
      <circle cx="16" cy="6" r="0.8" fill="#FDE68A" className="animate-ping" style={{animationDelay: '0.6s'}} />
      <circle cx="10" cy="12" r="0.8" fill="#FDE68A" className="animate-ping" style={{animationDelay: '0.9s'}} />
      <circle cx="14" cy="10" r="0.8" fill="#FDE68A" className="animate-ping" style={{animationDelay: '1.2s'}} />
      {/* Advanced connection lines */}
      <path d="M 8 6 L 12 8 L 16 6 M 12 8 L 10 12 M 12 8 L 14 10 M 8 6 L 10 12 M 16 6 L 14 10" 
            stroke="#FDE68A" strokeWidth="0.4" className="animate-pulse" />
      {/* AI processing indicators */}
      <rect x="5" y="15" width="14" height="1" fill="#10B981" className="animate-pulse" />
      <rect x="6" y="16" width="12" height="0.5" fill="#3B82F6" className="animate-pulse" style={{animationDelay: '0.5s'}} />
      <text x="12" y="18" textAnchor="middle" fontSize="1.5" fill="#A855F7" className="animate-pulse">AI</text>
    </g>
  );

  // Organized Packages Component
  const OrganizedPackages = () => (
    <g>
      {/* Conveyor belt */}
      <rect x="5" y="18" width="50" height="3" fill="#6B7280" />
      <rect x="5" y="18" width="50" height="1" fill="#9CA3AF" />
      {/* Organized packages on belt */}
      <rect x="10" y="15" width="3" height="3" fill="#F59E0B" className="animate-slide-right" />
      <rect x="16" y="15" width="3" height="3" fill="#EF4444" className="animate-slide-right" style={{animationDelay: '0.5s'}} />
      <rect x="22" y="15" width="3" height="3" fill="#10B981" className="animate-slide-right" style={{animationDelay: '1s'}} />
      <rect x="28" y="15" width="3" height="3" fill="#8B5CF6" className="animate-slide-right" style={{animationDelay: '1.5s'}} />
      <rect x="34" y="15" width="3" height="3" fill="#F97316" className="animate-slide-right" style={{animationDelay: '2s'}} />
      {/* Belt movement indicators */}
      <circle cx="8" cy="19.5" r="1" fill="#374151" className="animate-spin" />
      <circle cx="52" cy="19.5" r="1" fill="#374151" className="animate-spin" />
    </g>
  );

  return (
    <div className="max-w-48 h-16 relative overflow-hidden bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 shadow-sm">
      {/* Story Label */}
      <div className="absolute top-1 left-1 text-xs text-gray-500 font-medium z-20">
        {steps[currentStep].title}
      </div>
      
      <svg width="100%" height="100%" viewBox="0 0 70 25" className="absolute inset-0">
        {/* Step 1: Messy Orders */}
        {currentStep === 0 && (
          <>
            <ScatteredPackages />
            <SortingCenter x={40} y={0} />
          </>
        )}

        {/* Step 2: AI Analysis */}
        {currentStep === 1 && (
          <>
            <AIBrain x={25} y={2} />
            <ScatteredPackages />
            {/* Data streams flowing to AI */}
            <circle cx="15" cy="8" r="0.5" fill="#3B82F6" className="animate-float" />
            <circle cx="45" cy="12" r="0.5" fill="#3B82F6" className="animate-float" style={{animationDelay: '0.3s'}} />
            <circle cx="20" cy="18" r="0.5" fill="#3B82F6" className="animate-float" style={{animationDelay: '0.6s'}} />
            <circle cx="50" cy="8" r="0.5" fill="#3B82F6" className="animate-float" style={{animationDelay: '0.9s'}} />
          </>
        )}

        {/* Step 3: Smart Routing */}
        {currentStep === 2 && (
          <>
            <SmartRoutingNetwork />
            <OrganizedPackages />
          </>
        )}

        {/* Step 4: Efficient Delivery */}
        {currentStep === 3 && (
          <>
            <DeliveryTruck x={10} y={2} moving={true} />
            <DeliveryTruck x={40} y={2} moving={true} />
            {/* Optimized route lines */}
            <path d="M 0 20 Q 20 15 40 20 Q 50 22 70 20" stroke="#10B981" strokeWidth="0.8" 
                  fill="none" className="animate-draw-line" />
            <path d="M 0 22 Q 15 18 35 22 Q 55 24 70 22" stroke="#10B981" strokeWidth="0.8" 
                  fill="none" className="animate-draw-line" style={{animationDelay: '0.5s'}} />
            {/* Delivery success indicators */}
            <circle cx="65" cy="18" r="1" fill="#10B981" className="animate-ping" />
            <circle cx="65" cy="22" r="1" fill="#10B981" className="animate-ping" style={{animationDelay: '0.5s'}} />
          </>
        )}

        {/* Progress dots */}
        <g transform="translate(2, 22)">
          {steps.map((_, index) => (
            <circle 
              key={index}
              cx={index * 4} 
              cy={0} 
              r="0.5" 
              fill={index === currentStep ? "#3B82F6" : "#CBD5E1"}
              className="transition-all duration-300"
            />
          ))}
        </g>
      </svg>

      {/* Custom animations */}
      <style>{`
        @keyframes float-chaos {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(5deg); }
        }
        @keyframes float-chaos-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(-3deg); }
        }
        @keyframes float-chaos-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(8deg); }
        }
        @keyframes truck-move {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(1px); }
        }
        @keyframes slide-right {
          0% { transform: translateX(-5px); opacity: 0; }
          100% { transform: translateX(0px); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes draw-line {
          0% { stroke-dasharray: 0 100; }
          100% { stroke-dasharray: 100 0; }
        }
        @keyframes data-flow {
          0% { transform: translateX(0px); opacity: 1; }
          100% { transform: translateX(20px); opacity: 0; }
        }
        @keyframes data-flow-2 {
          0% { transform: translateX(0px); opacity: 1; }
          100% { transform: translateX(-15px); opacity: 0; }
        }
        @keyframes data-flow-3 {
          0% { transform: translateY(0px); opacity: 1; }
          100% { transform: translateY(-10px); opacity: 0; }
        }
        
        .animate-float-chaos { animation: float-chaos 2s ease-in-out infinite; }
        .animate-float-chaos-2 { animation: float-chaos-2 2.5s ease-in-out infinite; }
        .animate-float-chaos-3 { animation: float-chaos-3 1.8s ease-in-out infinite; }
        .animate-truck-move { animation: truck-move 0.5s ease-in-out infinite; }
        .animate-slide-right { animation: slide-right 1s ease-out forwards; }
        .animate-float { animation: float 2s ease-in-out infinite; }
        .animate-draw-line { animation: draw-line 2s ease-in-out infinite; }
        .animate-data-flow { animation: data-flow 3s ease-in-out infinite; }
        .animate-data-flow-2 { animation: data-flow-2 3s ease-in-out infinite; }
        .animate-data-flow-3 { animation: data-flow-3 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default CartoonishLogisticsStory;
