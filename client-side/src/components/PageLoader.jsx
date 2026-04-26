import React, { useState, useEffect } from 'react';

const PageLoader = ({ children, minLoadTime = 500 }) => {
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    // Set minimum loading time for better UX
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, minLoadTime);

    return () => {
      clearTimeout(timer);
    };
  }, [minLoadTime]);

  // Don't render children until loading is complete
  if (isPageLoading) {
    return null;
  }

  return children;
};

export default PageLoader;
