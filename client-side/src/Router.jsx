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
import { useLoading } from './context/LoadingContext';
import PageTransition from './components/PageTransition';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
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
      }
    }
  }, [user, loading, showLoading, hideLoading, navigate]);

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
      {user ? children : null}
    </>
  );
}

function AppContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const { user, logout, loading } = useAuth();
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

  // Handler for dialog open/close
  const navigate = useNavigate();

  function handleAuthOpenChange(open) {
    setAuthOpen(open);
    if (!open && !user) {
      navigate('/');
    }
  }

  // Called on successful login
  function handleLoginSuccess() {
    setAuthOpen(false);
  };

  // Called on logout
  async function handleLogout() {
    await logout();
    setAuthOpen(false);
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
                <ProtectedRoute>
                  <PageLoader minLoadTime={300}>
                    <Predict />
                  </PageLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                  <About key={location.pathname} />
              }
            />
            <Route
              path="/smartdrop"
              element={
                <ProtectedRoute>
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