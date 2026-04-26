import React, { createContext, useState, useContext } from 'react';
import StoreModal from '../components/StoreModal';

// Create the context
const ModalContext = createContext();

// Create a provider component
export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    storeModal: {
      isOpen: false,
      storeId: null,
      products: null
    }
  });

  // Function to open the store modal
  const openStoreModal = (storeId, products) => {
    setModalState(prev => ({
      ...prev,
      storeModal: {
        isOpen: true,
        storeId,
        products
      }
    }));
  };

  // Function to close the store modal
  const closeStoreModal = () => {
    setModalState(prev => ({
      ...prev,
      storeModal: {
        isOpen: false,
        storeId: null,
        products: null
      }
    }));
  };
  
  // Function to update actual stock data in the modal
  const updateActualStockData = (storeId, productId, date, actualStock) => {
    setModalState(prev => {
      // Create deep copy of products to avoid direct state mutation
      const updatedProducts = JSON.parse(JSON.stringify(prev.storeModal.products));
      
      // Find and update the specific product and date entry
      if (updatedProducts && updatedProducts[productId]) {
        const productRows = updatedProducts[productId];
        const rowToUpdate = productRows.find(row => row.date === date);
        
        if (rowToUpdate) {
          rowToUpdate.actual_stock = actualStock;
        }
      }
      
      return {
        ...prev,
        storeModal: {
          ...prev.storeModal,
          products: updatedProducts
        }
      };
    });
    
    // Also notify any external handlers if they exist
    if (window.updatePredictionsWithActualData) {
      window.updatePredictionsWithActualData(storeId, productId, date, actualStock);
    }
  };

  // Value object to be provided to consumers
  const value = {
    modalState,
    openStoreModal,
    closeStoreModal,
    updateActualStockData
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      
      {/* Global Modals */}
      {modalState.storeModal.isOpen && (
        <StoreModal
          storeId={modalState.storeModal.storeId}
          products={modalState.storeModal.products}
          onClose={closeStoreModal}
        />
      )}
    </ModalContext.Provider>
  );
};

// Custom hook to use the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
