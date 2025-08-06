import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DocumentView from './pages/DocumentView';
import ErrorDetector from './components/ErrorDetector';
import Toast from './components/Toast';
import './styles/tailwind.css';


function App() {
  const [toast, setToast] = React.useState(null);

  // Listen for errors in localStorage and show toast
  React.useEffect(() => {
    const interval = setInterval(() => {
      const logs = JSON.parse(localStorage.getItem('frontend-errors') || '[]');
      if (logs.length > 0) {
        const last = logs[logs.length - 1];
        if (last && last.error && toast !== last.error) {
          setToast(last.error);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [toast]);

  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/document/:id" element={<DocumentView />} />
          </Routes>
          {process.env.REACT_APP_ENABLE_ERROR_DETECTION === 'true' && <ErrorDetector />}
          <Toast message={toast} onClose={() => setToast(null)} />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
