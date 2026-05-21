import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LogOut, Search, Trash2, Download, Package, DollarSign, Users, CheckCircle, Clock, Banknote } from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (error.response && error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        } else {
          const errMsg = error.response?.data?.error ||
                         error.response?.data?.message || 
                         error.message || 
                         'Server is unreachable. Please verify backend is running.';
          toast.error(`Failed to fetch orders: ${errMsg}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`${API_URL}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(orders.filter(order => order._id !== id));
        toast.success('Order deleted successfully');
      } catch (error) {
        console.error('Order deletion failure for URL:', `${API_URL}/api/orders/${id}`, error);
        const errMsg = error.response?.data?.error ||
                       error.response?.data?.message || 
                       error.message || 
                       'Server is unreachable.';
        toast.error(`Error deleting order: ${errMsg}`);
      }
    }
  };

  const exportToExcel = () => {
    if (orders.length === 0) {
      toast.warning('No orders to export');
      return;
    }
    
    const dataToExport = orders.map(order => ({
      'Order ID': order._id,
      'Name': order.name,
      'Phone': order.phone,
      'Place': order.place,
      'Packs': order.packs,
      'Total Amount': order.total,
      'Payment Method': 'Cash on Delivery',
      'Note': order.note || '-',
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Time': new Date(order.createdAt).toLocaleTimeString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Biriyani_Challenge_Orders.xlsx");
  };

  const filteredOrders = orders.filter(order => 
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone.includes(searchTerm) ||
    order.place.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalOrders = orders.length;
  const totalPacks = orders.reduce((acc, order) => acc + order.packs, 0);
  const totalCollection = orders.reduce((acc, order) => acc + order.total, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark bg-pattern text-slate-800 p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 glass-panel p-6 rounded-2xl gap-4 bg-white shadow-sm border border-green-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">Manage your Biriyani Challenge orders</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl transition-all border border-slate-200 shadow-sm font-bold text-sm cursor-pointer"
          >
            <Download size={18} /> Export Excel
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl transition-all border border-red-100 shadow-sm font-bold text-sm cursor-pointer"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl border border-green-100 bg-white shadow-sm flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Users size={28} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold">Total Orders</p>
            <h3 className="text-3xl font-black text-slate-900">{totalOrders}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-2xl border border-green-100 bg-white shadow-sm flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <Package size={28} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-semibold">Total Packs Sold</p>
            <h3 className="text-3xl font-black text-slate-900">{totalPacks}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-2xl border border-brand-lime/20 bg-white shadow-md flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-lime rounded-full mix-blend-multiply filter blur-[30px] opacity-10"></div>
          <div className="w-14 h-14 rounded-xl bg-brand-lime/10 flex items-center justify-center text-brand-lime border border-brand-lime/20 relative z-10">
            <DollarSign size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-brand-lime font-extrabold text-sm">Total Collection</p>
            <h3 className="text-3xl font-black text-slate-950">₹{totalCollection}</h3>
          </div>
        </motion.div>
      </div>

      {/* Orders Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-panel rounded-2xl border border-green-100 bg-white overflow-hidden shadow-md"
      >
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-extrabold text-slate-900">Recent Orders</h2>
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime text-sm shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/60 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Phone</th>
                <th className="px-6 py-4 font-bold">Place</th>
                <th className="px-6 py-4 font-bold">Packs</th>
                <th className="px-6 py-4 font-bold">Total Amount</th>
                <th className="px-6 py-4 font-bold">Payment</th>
                <th className="px-6 py-4 font-bold">Date & Time</th>
                <th className="px-6 py-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-green-50/20 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{order.name}</div>
                      {order.note && <div className="text-xs text-slate-500 mt-1 max-w-[150px] truncate" title={order.note}>Note: {order.note}</div>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{order.phone}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{order.place}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-extrabold">
                          {order.packs}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                          order.packType === 'family' ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20' : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          {order.packType === 'family' ? 'Family' : 'One Pack'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-brand-lime text-base">₹{order.total}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-150">
                        <Banknote size={12} /> COD
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="font-semibold text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs">{new Date(order.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDelete(order._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Order"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400 font-medium">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
