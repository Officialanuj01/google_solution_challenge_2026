import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import { Auth } from "./pages/authentication/Auth";
import { Navbar } from "./pages/common/Navbar";
import { Footer } from "./pages/common/Footer";
import Predict from "./pages/Predict";
import SmartDrop from "./pages/SmartDrop";
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import { useDemoModal } from './context/DemoModalContext';
import DemoAccountModal from './components/DemoAccountModal';
import LoadingAnimation from './components/LoadingAnimation';
import PageLoader from './components/PageLoader';
import RoleSelectionDialog from './components/RoleSelectionDialog';
import { useLoading } from './context/LoadingContext';
import PageTransition from './components/PageTransition';

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
      {/* Global Demo Account Modal - on /smartdrop */}
      {(location.pathname === '/smartdrop') && showDemoModal && (
        <DemoAccountModal onClose={() => setShowDemoModal(false)} />
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
        <PageTransition>
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
                  <About key={location.pathname} />
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
        </PageTransition>
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