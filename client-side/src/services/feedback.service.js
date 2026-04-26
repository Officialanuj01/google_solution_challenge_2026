// Service for handling prediction feedback
const API_BASE_URL = 'https://predelix.onrender.com/api';

export const feedbackService = {
  // Submit feedback for a prediction
  submitFeedback: async (feedbackData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id: feedbackData.store_id,
          product_id: feedbackData.product_id,
          date: feedbackData.date,
          predicted_stock: feedbackData.predicted_stock,
          feedback: feedbackData.feedback, // 'accurate' or 'inaccurate'
          timestamp: feedbackData.timestamp,
          user_id: feedbackData.user_id || 'anonymous', // You might want to add user authentication
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  // Get feedback statistics
  getFeedbackStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      throw error;
    }
  },

  // Get all feedback for a specific prediction
  getFeedbackForPrediction: async (storeId, productId, date) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/prediction/${storeId}/${productId}/${date}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching prediction feedback:', error);
      throw error;
    }
  },
};

// Local storage helper for offline feedback storage
export const localFeedbackStorage = {
  // Save feedback to local storage
  saveFeedback: (feedback) => {
    try {
      const existingFeedback = JSON.parse(localStorage.getItem('predictionFeedback') || '[]');
      existingFeedback.push({
        ...feedback,
        id: Date.now().toString(),
        synced: false,
      });
      localStorage.setItem('predictionFeedback', JSON.stringify(existingFeedback));
      return true;
    } catch (error) {
      console.error('Error saving feedback to local storage:', error);
      return false;
    }
  },

  // Get all stored feedback
  getAllFeedback: () => {
    try {
      return JSON.parse(localStorage.getItem('predictionFeedback') || '[]');
    } catch (error) {
      console.error('Error retrieving feedback from local storage:', error);
      return [];
    }
  },

  // Mark feedback as synced
  markAsSynced: (feedbackId) => {
    try {
      const existingFeedback = JSON.parse(localStorage.getItem('predictionFeedback') || '[]');
      const updatedFeedback = existingFeedback.map(feedback => 
        feedback.id === feedbackId ? { ...feedback, synced: true } : feedback
      );
      localStorage.setItem('predictionFeedback', JSON.stringify(updatedFeedback));
      return true;
    } catch (error) {
      console.error('Error marking feedback as synced:', error);
      return false;
    }
  },

  // Get unsynced feedback
  getUnsyncedFeedback: () => {
    try {
      const allFeedback = JSON.parse(localStorage.getItem('predictionFeedback') || '[]');
      return allFeedback.filter(feedback => !feedback.synced);
    } catch (error) {
      console.error('Error retrieving unsynced feedback:', error);
      return [];
    }
  },

  // Clear all feedback
  clearAllFeedback: () => {
    try {
      localStorage.removeItem('predictionFeedback');
      return true;
    } catch (error) {
      console.error('Error clearing feedback:', error);
      return false;
    }
  },
};

// Sync service to periodically sync local feedback with server
export const feedbackSyncService = {
  // Sync all unsynced feedback
  syncAllFeedback: async () => {
    const unsyncedFeedback = localFeedbackStorage.getUnsyncedFeedback();
    
    if (unsyncedFeedback.length === 0) {
      return { success: true, synced: 0 };
    }

    let syncedCount = 0;
    const errors = [];

    for (const feedback of unsyncedFeedback) {
      try {
        await feedbackService.submitFeedback(feedback);
        localFeedbackStorage.markAsSynced(feedback.id);
        syncedCount++;
      } catch (error) {
        errors.push({ feedback, error });
      }
    }

    return {
      success: errors.length === 0,
      synced: syncedCount,
      errors,
    };
  },

  // Start periodic sync (call this when app starts)
  startPeriodicSync: (intervalMs = 5 * 60 * 1000) => { // Default: 5 minutes
    return setInterval(async () => {
      try {
        const result = await feedbackSyncService.syncAllFeedback();
        if (result.synced > 0) {
          console.log(`Synced ${result.synced} feedback items`);
        }
      } catch (error) {
        console.error('Error during periodic sync:', error);
      }
    }, intervalMs);
  },
};
