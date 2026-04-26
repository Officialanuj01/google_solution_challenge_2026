import React from 'react';
import { AlertCircle, DatabaseIcon, Users } from 'lucide-react';

export default function DemoAccountModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideInUp">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Demo Account Notice</h3>
              <p className="text-sm text-gray-600">Important information about demo limitations</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <DatabaseIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Demo Account Limitations</h4>
                <p className="text-sm text-gray-600">
                  This is a demo account that only works with pre-verified phone numbers. 
                  Please use the demo CSV data to test the SmartDrop functionality.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Need Full Access?</h4>
                <p className="text-sm text-gray-600">
                  For production use with your own customer data, please contact our team 
                  to set up a full account with unrestricted phone number access.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Got it, continue with demo
          </button>
        </div>
      </div>
    </div>
  );
}
