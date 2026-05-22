import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/admin/login`, {
        email,
        password
      });

      if (res.data.success) {
        localStorage.setItem('adminToken', res.data.token);
        toast.success('Login successful');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Admin login failure for URL:', `${API_URL}/api/admin/login`, error);
      const rawError = error.response?.data?.error;
      const errMsg = (typeof rawError === 'string' ? rawError : rawError?.message) ||
                     error.response?.data?.message || 
                     error.message || 
                     'Server is unreachable. Please verify backend is running.';
      toast.error(`Login failed: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark bg-pattern px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl shadow-2xl border border-gray-800 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-lime rounded-full mix-blend-multiply filter blur-[60px] opacity-10"></div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-lime/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-lime/20 shadow-md">
            <Lock className="text-brand-lime" size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950">Admin Portal</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Sign in to manage orders</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="text-slate-400" size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all placeholder-slate-400 shadow-inner"
                placeholder="admin@ssf.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-slate-400" size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-all placeholder-slate-400 shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-lime hover:bg-brand-yellow text-white font-extrabold py-3 rounded-xl transition-all mt-4 flex items-center justify-center shadow-lg shadow-brand-lime/20 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/" className="text-sm font-semibold text-slate-500 hover:text-brand-lime transition-all">
            &larr; Back to Home
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
