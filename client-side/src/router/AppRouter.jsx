import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import Home from "../pages/Home";
import About from "../pages/About";
import { Auth } from "../pages/authentication/Auth";
import { Navbar } from "../pages/common/Navbar";
import { Footer } from "../pages/common/Footer";
import Predict from "../pages/Predict";
import SmartDrop from "../pages/SmartDrop";
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import LoadingAnimation from '../components/LoadingAnimation';
import PageLoader from '../components/PageLoader';
import RoleSelectionDialog from '../components/RoleSelectionDialog';
import { useLoading } from '../context/LoadingContext';
import { useDemoModal } from '../context/DemoModalContext';
import { AlertCircle, DatabaseIcon, Users } from 'lucide-react';

function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading, updateRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    if (loading) {
      showLoading("Authenticating...");
    } else {
      hideLoading();
      if (!user) {
        setAuthOpen(true);
      } else if (user.role === null && requiredRole) {
        // User exists but has no role selected and trying to access a protected page
        // Redirect to home and let AppContent handle the role selection dialog
        console.log(`User has no role selected, redirecting to home from '${requiredRole}' page`);
        navigate('/', { replace: true, state: { needsRoleSelection: true } });
      } else if (requiredRole && !hasAccess(user.role, requiredRole)) {
        // User doesn't have access to this page - redirect to home
        console.log(`Access denied: User role '${user.role}' cannot access '${requiredRole}' page`);
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, showLoading, hideLoading, requiredRole, navigate]);

  // Check if user has access based on role
  const hasAccess = (userRole, requiredRole) => {
    if (userRole === 'demo') return true; // Demo users have access to everything
    if (requiredRole === 'shopkeeper') return userRole === 'shopkeeper';
    if (requiredRole === 'delivery_person') return userRole === 'delivery_person';
    return false;
  };

  // If user doesn't have required role and we're trying to redirect, don't render anything
  if (user && user.role !== null && requiredRole && !hasAccess(user.role, requiredRole)) {
    return null;
  }

  return (
    <>
      <Auth
        open={authOpen}
        onOpenChange={(open) => {
          setAuthOpen(open);
          if (!open && !user) {
            navigate('/');
          }
        }}
        onLogin={() => {
          setAuthOpen(false);
        }}
        showTrigger={false}
      />
      {user && (user.role !== null) && (!requiredRole || hasAccess(user.role, requiredRole)) ? children : null}
    </>
  );
}

function AppContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const [roleSelectionOpen, setRoleSelectionOpen] = useState(false);
  const { user, logout, loading, updateRole } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const location = useLocation();
  // Global demo modal context
  const { showDemoModal, setShowDemoModal } = useDemoModal();

  // Handle initial authentication loading
  useEffect(() => {
    if (loading) {
      showLoading("Initializing app...");
    } else {
      hideLoading();
    }
  }, [loading, showLoading, hideLoading]);

  // Check if user needs to select role after login or redirect
  useEffect(() => {
    console.log('AppContent useEffect:', { 
      user: user ? { name: user.name, role: user.role } : null, 
      authOpen, 
      roleSelectionOpen,
      currentPath: location.pathname,
      locationState: location.state
    });
    
    if (user && user.role === null && !authOpen) {
      // Show role selection dialog if:
      // 1. User needs role selection (redirected from protected route)
      // 2. User is on home page and has no role
      const needsRoleSelection = location.state?.needsRoleSelection || location.pathname === '/';
      
      console.log('User needs role selection:', { needsRoleSelection });
      
      if (needsRoleSelection) {
        console.log('Setting role selection dialog to open');
        setRoleSelectionOpen(true);
        
        // Clear the state so it doesn't trigger again
        if (location.state?.needsRoleSelection) {
          window.history.replaceState({}, '', location.pathname);
        }
      }
    }
  }, [user, authOpen, location]);

  // Handler for dialog open/close
  const navigate = useNavigate();

  function handleAuthOpenChange(open) {
    setAuthOpen(open);
    if (!open && !user) {
      navigate('/');
    }
  }

  // Called on successful login
  function handleLoginSuccess(userData) {
    setAuthOpen(false);
    // Check if user needs to select role
    if (userData && userData.role === null) {
      setRoleSelectionOpen(true);
    }
  }

  // Handle role selection
  const handleRoleSelect = async (role) => {
    try {
      await updateRole(role);
      setRoleSelectionOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // Called on logout
  async function handleLogout() {
    await logout();
    setAuthOpen(false);
    setRoleSelectionOpen(false);
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Demo Account Modal - visible on all pages */}
      {showDemoModal && (
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
                onClick={() => setShowDemoModal(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Got it, continue with demo
              </button>
            </div>
          </div>
        </div>
      )}
      <Navbar
        onLoginClick={() => setAuthOpen(true)}
        isLoggedIn={!!user}
        user={user}
        onLogout={handleLogout}
      />
      <Auth
        open={authOpen}
        onOpenChange={handleAuthOpenChange}
        onLogin={handleLoginSuccess}
        showTrigger={false}
      />
      <RoleSelectionDialog
        open={roleSelectionOpen}
        onRoleSelect={handleRoleSelect}
        onClose={() => {
          setRoleSelectionOpen(false);
          navigate('/');
        }}
      />
      <main className="flex-grow pt-[66px]">
        <Routes>
          <Route 
            path="/" 
            element={
              <PageLoader minLoadTime={300}>
                <Home />
              </PageLoader>
            } 
          />
          <Route
            path="/predict"
            element={
              <ProtectedRoute requiredRole="shopkeeper">
                <PageLoader minLoadTime={300}>
                  <Predict />
                </PageLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <PageLoader minLoadTime={300}>
                  <About />
                </PageLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="/smartdrop"
            element={
              <ProtectedRoute requiredRole="delivery_person">
                <PageLoader minLoadTime={300}>
                  <SmartDrop />
                </PageLoader>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
