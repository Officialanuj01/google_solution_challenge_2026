import { usePersistedObject, usePersistedFileState } from './usePersistedState';
import { useMemo, useEffect } from 'react';

/**
 * Custom hook for persisting SmartDrop page state
 * Maintains user's progress including CSV uploads, call status, and responses
 */
export const useSmartDropState = () => {
  const [state, updateState, clearState] = usePersistedFileState('smartdrop-page-state', {
    // File related state
    csvFile: null,
    csvData: null,
    fileMetadata: null,
    
    // Process state
    uploaded: false,
    uploadError: null,
    callDone: false,
    callError: null,
    responses: null,
    responseError: null,
    showResponses: false,
    
    // UI state that should persist
    searchTerm: '',
    sortField: '',
    sortDirection: 'asc',
    currentPage: 1,
    
    // Session tracking
    hasLeftPage: false,
    sessionId: null,
    
    // Timestamps for data freshness
    lastUploadTime: null,
    lastCallTime: null,
    lastResponseTime: null
  });

  // Generate unique session ID if none exists
  const currentSessionId = useMemo(() => Date.now() + Math.random(), []);
  
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
  const setCsvFile = (csvFile) => updateState({ 
    csvFile,
    fileMetadata: csvFile ? {
      name: csvFile.name,
      size: csvFile.size,
      type: csvFile.type,
      lastModified: csvFile.lastModified
    } : null,
    // Reset dependent state when file changes
    csvData: null,
    uploaded: false,
    uploadError: null,
    callDone: false,
    responses: null,
    showResponses: false
  });
  
  const setCsvData = (csvData) => updateState({ csvData });
  
  const setUploaded = (uploaded) => updateState({ 
    uploaded,
    lastUploadTime: uploaded ? Date.now() : null
  });
  
  const setUploadError = (uploadError) => updateState({ uploadError });
  
  const setCallDone = (callDone) => updateState({ 
    callDone,
    lastCallTime: callDone ? Date.now() : null
  });
  
  const setCallError = (callError) => updateState({ callError });
  
  const setResponses = (responses) => updateState({ 
    responses,
    lastResponseTime: responses ? Date.now() : null
  });
  
  const setResponseError = (responseError) => updateState({ responseError });
  
  const setShowResponses = (showResponses) => updateState({ showResponses });
  
  const setSearchTerm = (searchTerm) => updateState({ searchTerm, currentPage: 1 });
  
  const setSortField = (sortField) => updateState({ sortField });
  
  const setSortDirection = (sortDirection) => updateState({ sortDirection });
  
  const setCurrentPage = (currentPage) => updateState({ currentPage });

  // Check if data is stale (older than 15 minutes for SmartDrop as it's more time-sensitive)
  const isDataStale = (timestamp) => {
    if (!timestamp) return true;
    return Date.now() - timestamp > 15 * 60 * 1000; // 15 minutes
  };

  const resetSmartDropState = () => clearState();

  // Reset specific workflow states
  const resetUploadState = () => updateState({
    csvFile: null,
    csvData: null,
    fileMetadata: null,
    uploaded: false,
    uploadError: null,
    callDone: false,
    callError: null,
    responses: null,
    responseError: null,
    showResponses: false,
    lastUploadTime: null,
    lastCallTime: null,
    lastResponseTime: null
  });

  const resetCallState = () => updateState({
    callDone: false,
    callError: null,
    responses: null,
    responseError: null,
    showResponses: false,
    lastCallTime: null,
    lastResponseTime: null
  });

  return {
    // State values
    csvFile: state.csvFile,
    csvData: state.csvData,
    fileMetadata: state.fileMetadata,
    uploaded: state.uploaded,
    uploadError: state.uploadError,
    callDone: state.callDone,
    callError: state.callError,
    responses: state.responses,
    responseError: state.responseError,
    showResponses: state.showResponses,
    searchTerm: state.searchTerm,
    sortField: state.sortField,
    sortDirection: state.sortDirection,
    currentPage: state.currentPage,
    
    // Setters
    setCsvFile,
    setCsvData,
    setUploaded,
    setUploadError,
    setCallDone,
    setCallError,
    setResponses,
    setResponseError,
    setShowResponses,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setCurrentPage,
    
    // Utilities
    isDataStale,
    isUploadDataStale: () => isDataStale(state.lastUploadTime),
    isCallDataStale: () => isDataStale(state.lastCallTime),
    isResponseDataStale: () => isDataStale(state.lastResponseTime),
    isReturningSession,
    resetSmartDropState,
    resetUploadState,
    resetCallState,
    
    // Raw state for debugging
    rawState: state
  };
};
