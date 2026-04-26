import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const PerformanceContext = createContext();

export const usePerformanceContext = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
};

export const PerformanceProvider = ({ children }) => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    isSlowDevice: false,
    reducedMotion: false
  });

  // Detect slow devices
  const detectSlowDevice = useCallback(() => {
    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 2;
    
    // Check memory (if available)
    const memory = navigator.deviceMemory || 4;
    
    // Check connection speed
    const connection = navigator.connection;
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.effectiveType === '3g'
    );
    
    return cores < 4 || memory < 4 || isSlowConnection;
  }, []);

  // Check for reduced motion preference
  const checkReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Measure render performance
  const measureRenderTime = useCallback((componentName, startTime) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Slow render detected for ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
    
    return renderTime;
  }, []);

  // Memory usage monitoring
  const getMemoryUsage = useCallback(() => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }, []);

  // Optimize based on device capabilities
  const getOptimizationSettings = useCallback(() => {
    const isSlowDevice = detectSlowDevice();
    const reducedMotion = checkReducedMotion();
    
    return {
      // Reduce animations on slow devices or if user prefers reduced motion
      enableAnimations: !isSlowDevice && !reducedMotion,
      
      // Reduce particle effects on slow devices
      enableParticles: !isSlowDevice,
      
      // Limit concurrent animations
      maxConcurrentAnimations: isSlowDevice ? 2 : 6,
      
      // Adjust animation duration
      animationDuration: isSlowDevice ? 0.2 : 0.4,
      
      // Enable/disable heavy effects
      enableHeavyEffects: !isSlowDevice,
      
      // Image loading strategy
      imageLoadingStrategy: isSlowDevice ? 'lazy' : 'eager'
    };
  }, [detectSlowDevice, checkReducedMotion]);

  // Frame rate monitoring
  const [frameRate, setFrameRate] = useState(60);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFrameRate(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    const animationId = requestAnimationFrame(measureFrameRate);
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Initialize performance metrics
  useEffect(() => {
    setPerformanceMetrics({
      renderTime: 0,
      memoryUsage: getMemoryUsage(),
      isSlowDevice: detectSlowDevice(),
      reducedMotion: checkReducedMotion(),
      frameRate
    });
  }, [detectSlowDevice, checkReducedMotion, getMemoryUsage, frameRate]);

  // Performance warning system
  const performanceWarning = useCallback((message, metric) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Performance Warning: ${message}`, metric);
    }
  }, []);

  // Adaptive quality based on performance
  const getAdaptiveQuality = useCallback(() => {
    const memory = getMemoryUsage();
    const isLowMemory = memory && memory.used > memory.total * 0.8;
    const isLowFrameRate = frameRate < 30;
    
    if (isLowMemory || isLowFrameRate) {
      return 'low';
    } else if (frameRate < 50) {
      return 'medium';
    }
    return 'high';
  }, [frameRate, getMemoryUsage]);

  const value = {
    performanceMetrics,
    measureRenderTime,
    getMemoryUsage,
    getOptimizationSettings,
    performanceWarning,
    getAdaptiveQuality,
    frameRate
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};
