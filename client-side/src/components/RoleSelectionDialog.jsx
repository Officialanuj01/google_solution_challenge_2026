import React, { useState } from 'react';
import { Truck, Package, Store, ArrowRight } from 'lucide-react';

const RoleSelectionDialog = ({ open, onRoleSelect, onClose }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    try {
      await onRoleSelect(selectedRole);
    } catch (error) {
      console.error('Error selecting role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* Dialog */}
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-slideInUp">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-sky-800 mb-2">Welcome to Predelix!</h2>
          <p className="text-sky-600">How do you plan to use Predelix? This helps us customize your experience.</p>
        </div>

        {/* Role Options */}
        <div className="space-y-4 mb-8">
          {/* Shopkeeper Option */}
          <button
            onClick={() => setSelectedRole('shopkeeper')}
            className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
              selectedRole === 'shopkeeper'
                ? 'border-cyan-400 bg-cyan-50 shadow-lg scale-[1.02]'
                : 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/50'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl ${
                selectedRole === 'shopkeeper' ? 'bg-cyan-500' : 'bg-gray-200'
              } transition-colors duration-300`}>
                <Package className={`w-6 h-6 ${
                  selectedRole === 'shopkeeper' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Shopkeeper</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Manage inventory and predict stock requirements using AI-powered analytics.
                </p>
                <div className="flex items-center text-xs text-cyan-600 font-medium">
                  <span>Access to AI Stock Predictor</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </div>
          </button>

          {/* Delivery Person Option */}
          <button
            onClick={() => setSelectedRole('delivery_person')}
            className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
              selectedRole === 'delivery_person'
                ? 'border-sky-400 bg-sky-50 shadow-lg scale-[1.02]'
                : 'border-gray-200 hover:border-sky-300 hover:bg-sky-50/50'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl ${
                selectedRole === 'delivery_person' ? 'bg-sky-500' : 'bg-gray-200'
              } transition-colors duration-300`}>
                <Truck className={`w-6 h-6 ${
                  selectedRole === 'delivery_person' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Delivery Person</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Automate delivery confirmation calls and manage customer communications.
                </p>
                <div className="flex items-center text-xs text-sky-600 font-medium">
                  <span>Access to SmartDrop System</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-300"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
              selectedRole && !isSubmitting
                ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 hover:from-cyan-600 hover:via-blue-600 hover:to-sky-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Setting up...
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionDialog;
