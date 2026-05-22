import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [view, setView] = useState(() => {
    const hash = window.location.hash;
    return hash.includes('admin') ? 'admin' : 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setView(hash.includes('admin') ? 'admin' : 'landing');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-brand-dark">
      {view === 'admin' ? <AdminDashboard /> : <LandingPage />}
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
