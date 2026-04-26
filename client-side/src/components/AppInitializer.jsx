import React, { useState, useEffect } from 'react';
import LoadingAnimation from './LoadingAnimation';

const AppInitializer = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simple timeout to show loading for a brief moment
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000); // 2 seconds total

    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return <LoadingAnimation message="Loading Predelix..." />;
  }

  return children;
};

export default AppInitializer;
