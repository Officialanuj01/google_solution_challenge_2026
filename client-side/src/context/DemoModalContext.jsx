import React, { createContext, useContext, useState, useEffect } from 'react';

const DemoModalContext = createContext();

export function DemoModalProvider({ children }) {
  // Persist modal dismissal per session
  const [showDemoModal, setShowDemoModal] = useState(() => {
    const stored = sessionStorage.getItem('showDemoModal');
    return stored !== 'false';
  });

  useEffect(() => {
    sessionStorage.setItem('showDemoModal', showDemoModal ? 'true' : 'false');
  }, [showDemoModal]);

  return (
    <DemoModalContext.Provider value={{ showDemoModal, setShowDemoModal }}>
      {children}
    </DemoModalContext.Provider>
  );
}

export function useDemoModal() {
  return useContext(DemoModalContext);
}
