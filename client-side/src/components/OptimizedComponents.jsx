import React, { memo, Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { useIntersectionObserver } from '../hooks/usePerformance';

// Lazy loading wrapper with intersection observer
const LazyComponent = memo(({ 
  children, 
  fallback = null, 
  threshold = 0.1, 
  rootMargin = '50px',
  once = true 
}) => {
  const { ref, isIntersecting, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin
  });

  const shouldRender = once ? hasIntersected : isIntersecting;

  return (
    <div ref={ref} style={{ minHeight: '1px' }}>
      {shouldRender ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
});

LazyComponent.displayName = 'LazyComponent';

// Optimized image component with lazy loading
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = "", 
  placeholder,
  ...props 
}) => {
  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {hasIntersected ? (
        <motion.img
          src={src}
          alt={alt}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full h-full object-cover"
          loading="lazy"
          {...props}
        />
      ) : (
        placeholder || (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
        )
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Virtualized list component for large datasets
export const VirtualizedList = memo(({ 
  items, 
  itemHeight = 60, 
  containerHeight = 400,
  renderItem,
  className = ""
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerRef, setContainerRef] = React.useState(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={setContainerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Skeleton loader component
export const SkeletonLoader = memo(({ 
  variant = 'rectangular', 
  width = '100%', 
  height = 20,
  className = "",
  animation = 'pulse'
}) => {
  const baseClasses = "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200";
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };

  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4'
  };

  return (
    <div
      className={`
        ${baseClasses} 
        ${animationClasses[animation]} 
        ${variantClasses[variant]} 
        ${className}
      `}
      style={{ width, height }}
    />
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';

// Performance-optimized card component
export const OptimizedCard = memo(({ 
  children, 
  className = "",
  hover = true,
  delay = 0,
  ...props 
}) => {
  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
      whileHover={hover ? { 
        y: -5, 
        transition: { duration: 0.2, ease: "easeOut" }
      } : {}}
      className={`
        bg-white rounded-xl shadow-lg border border-gray-100 
        transition-shadow duration-300 hover:shadow-xl
        ${className}
      `}
      style={{
        willChange: 'transform, opacity'
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

export default LazyComponent;
