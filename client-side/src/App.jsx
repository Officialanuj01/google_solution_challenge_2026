import { GoogleOAuthProvider } from '@react-oauth/google';
import config from './config';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { DemoModalProvider } from './context/DemoModalContext';
import { ModalProvider } from './context/ModalContext';
import LoadingAnimation from './components/LoadingAnimation';
import './styles/themes.css';
import AppRouter from './router';
import React from 'react';

// Error Boundary to prevent white screen crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2 style={{ color: '#e53e3e' }}>Something went wrong</h2>
          <p style={{ color: '#718096', marginTop: '8px' }}>{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
            style={{ marginTop: '16px', padding: '8px 24px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main App Content Component
const AppContent = () => {
  const { isLoading, loadingMessage } = useLoading();

  return (
    <>
      <AppRouter />
      {isLoading && <LoadingAnimation message={loadingMessage} />}
    </>
  );
};

// Wrapper that conditionally applies GoogleOAuthProvider only when client ID exists
function OAuthWrapper({ children }) {
  // Always render GoogleOAuthProvider so useGoogleLogin hook doesn't crash,
  // using a dummy ID if none is configured.
  return (
    <GoogleOAuthProvider clientId={config.googleClientId || "dummy-id"}>
      {children}
    </GoogleOAuthProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <OAuthWrapper>
        <ThemeProvider>
          <LoadingProvider>
            <DemoModalProvider>
              <ModalProvider>
                <AppContent />
              </ModalProvider>
            </DemoModalProvider>
          </LoadingProvider>
        </ThemeProvider>
      </OAuthWrapper>
    </ErrorBoundary>
  );
}

export default App;