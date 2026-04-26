import { usePersistedObject, usePersistedFileState } from './usePersistedState';
import { useMemo, useEffect } from 'react';

/**
 * Custom hook for persisting Predict page state
 * Maintains user's progress including file uploads, predictions, and UI state
 */
export const usePredictState = () => {
  const [state, updateState, clearState] = usePersistedFileState('predict-page-state', {
    // File related state
    file: null,
    fileMetadata: null,
    predictions: null,
    csvBlob: null,
    
    // UI state that should persist
    searchTerm: '',
    sortField: '',
    sortDirection: 'asc',
    currentPage: 1,
    storeCurrentPage: 1,
    showUploadSection: true,
    predictionHistory: [],
    activePredictionId: null,
    
    // Session tracking
    hasLeftPage: false,
    sessionId: null,
    
    // Timestamps for data freshness
    lastPredictionTime: null,
    lastFileUploadTime: null
  });

  // Generate unique session ID if none exists
  const currentSessionId = useMemo(() => Date.now() + Math.random(), []);
  
  // Ensure predictionHistory is always an array
  const safePredictionHistory = Array.isArray(state.predictionHistory) ? state.predictionHistory : [];
  
  // Check if this is a returning session (user has navigated away and come back)
  const isReturningSession = state.sessionId && state.sessionId !== currentSessionId && state.hasLeftPage;

  // Mark that user has left the page when component unmounts
  useEffect(() => {
    // Update session ID on mount
    updateState({ sessionId: currentSessionId });
    
    return () => {
      // Mark that user has left the page
      updateState({ hasLeftPage: true });
    };
  }, [currentSessionId, updateState]);

  // Helper functions for common operations
  const setFile = (file) => updateState({ 
    file, 
    lastFileUploadTime: file ? Date.now() : null 
  });
  
  const setPredictions = (predictions) => updateState({ 
    predictions,
    lastPredictionTime: predictions ? Date.now() : null
  });
  
  const setCsvBlob = (csvBlob) => updateState({ csvBlob });
  
  const setSearchTerm = (searchTerm) => updateState({ searchTerm, currentPage: 1 });
  
  const setSortField = (sortField) => updateState({ sortField });
  
  const setSortDirection = (sortDirection) => updateState({ sortDirection });
  
  const setCurrentPage = (currentPage) => updateState({ currentPage });
  
  const setStoreCurrentPage = (storeCurrentPage) => updateState({ storeCurrentPage });
  
  const setShowUploadSection = (showUploadSection) => updateState({ showUploadSection });
  
  const setPredictionHistory = (predictionHistory) => updateState({ predictionHistory });
  
  const setActivePredictionId = (activePredictionId) => updateState({ activePredictionId });

  // Check if data is stale (older than 30 minutes)
  const isDataStale = (timestamp) => {
    if (!timestamp) return true;
    return Date.now() - timestamp > 30 * 60 * 1000; // 30 minutes
  };

  const resetPredictState = () => clearState();

  return {
    // State values
    file: state.file,
    fileMetadata: state.fileMetadata,
    predictions: state.predictions,
    csvBlob: state.csvBlob,
    searchTerm: state.searchTerm,
    sortField: state.sortField,
    sortDirection: state.sortDirection,
    currentPage: state.currentPage,
    storeCurrentPage: state.storeCurrentPage,
    showUploadSection: state.showUploadSection,
    predictionHistory: safePredictionHistory,
    activePredictionId: state.activePredictionId,
    
    // Setters
    setFile,
    setPredictions,
    setCsvBlob,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setCurrentPage,
    setStoreCurrentPage,
    setShowUploadSection,
    setPredictionHistory,
    setActivePredictionId,
    
    // Utilities
    isDataStale,
    isPredictionDataStale: () => isDataStale(state.lastPredictionTime),
    isFileDataStale: () => isDataStale(state.lastFileUploadTime),
    isReturningSession,
    resetPredictState,
    
    // Raw state for debugging
    rawState: state
  };
};
