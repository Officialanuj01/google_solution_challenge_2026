import { useState, useEffect } from 'react';

function Profile({ onClose }) {
  const [user, setUser] = useState({ name: '', email: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '' });

  useEffect(() => {
    // Get user data from cookies
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [name, value] = cookie.split('=');
      acc[name] = decodeURIComponent(value);
      return acc;
    }, {});

    setUser({
      name: cookies.predelix_name || 'Guest User',
      email: cookies.predelix_email || 'guest@example.com'
    });
    setEditData({
      name: cookies.predelix_name || 'Guest User',
      email: cookies.predelix_email || 'guest@example.com'
    });
  }, []);

  const handleSave = () => {
    // Update cookies
    document.cookie = `predelix_name=${encodeURIComponent(editData.name)}; path=/; max-age=${60 * 60 * 24 * 7}`;
    document.cookie = `predelix_email=${encodeURIComponent(editData.email)}; path=/; max-age=${60 * 60 * 24 * 7}`;
    
    setUser(editData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    // Clear cookies
    document.cookie = 'predelix_name=; path=/; max-age=0';
    document.cookie = 'predelix_email=; path=/; max-age=0';
    document.cookie = 'predelix_password=; path=/; max-age=0';
    
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Profile Icon */}
          <div className="absolute -top-6 -right-6 w-16 h-16 text-purple-100 animate-float1">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>

          {/* Floating Settings Icon */}
          <div className="absolute -bottom-8 -left-8 w-14 h-14 text-blue-100 animate-float2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.61L12.75,4H11.25Z"/>
            </svg>
          </div>

          {/* Floating Data Icon */}
          <div className="absolute top-1/2 -right-8 w-12 h-12 text-green-100 animate-float3">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
          </div>

          {/* Morphing Background Shapes */}
          <div className="absolute top-8 left-8 w-24 h-24 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full opacity-20 animate-morph-slow"></div>
          <div className="absolute bottom-8 right-8 w-20 h-20 bg-gradient-to-br from-blue-200 to-green-200 rounded-full opacity-20 animate-morph-medium"></div>
        </div>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Profile</h2>
              <p className="text-white/80">Manage your account</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6">
          {!isEditing ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-base text-gray-900">{user.name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-base text-gray-900">{user.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Account Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">5</div>
                    <div className="text-sm text-gray-600">Predictions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Days Active</div>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0-1.1.9-2 2-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                  </svg>
                  Saved Data Management
                </h3>
                <p className="text-xs text-orange-700 mb-3">
                  Your work is automatically saved. Clear saved data if you want to start fresh.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem('predict-page-state');
                      alert('Predict page data cleared successfully!');
                    }}
                    className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                  >
                    Clear Predict Data
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('smartdrop-page-state');
                      alert('SmartDrop page data cleared successfully!');
                    }}
                    className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                  >
                    Clear SmartDrop Data
                  </button>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('predict-page-state');
                    localStorage.removeItem('smartdrop-page-state');
                    alert('All saved data cleared successfully!');
                  }}
                  className="w-full mt-2 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                >
                  Clear All Saved Data
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(user);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
