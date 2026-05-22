import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-dark">
      <LandingPage />
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
