import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Send,
  MapPin,
  Phone,
  User,
  Package,
  MessageSquare,
  Search,
  X,
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';



const LandingPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    place: '',
    packType: 'single', // 'single' or 'family'
    packs: 1,
    note: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tracking States
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(trackPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsTrackLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/orders/track/${trackPhone}`);
      if (res.data.success) {
        setTrackResult(res.data.data);
        if (res.data.data.length === 0) {
          toast.info('No orders found for this phone number');
        }
      }
    } catch (error) {
      toast.error('Failed to track orders. Please try again.');
    } finally {
      setIsTrackLoading(false);
    }
  };

  const pricePerPack = formData.packType === 'family' ? 500 : 100;
  const totalAmount = formData.packs * pricePerPack;

  // =========================
  // Handle Input Change
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'packs'
          ? Math.max(1, parseInt(value) || 1)
          : value,
    }));
  };

  // =========================
  // Reset Form
  // =========================
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      place: '',
      packType: 'single',
      packs: 1,
      note: '',
    });
  };

  // =========================
  // WhatsApp Message
  // =========================
  const sendWhatsApp = () => {
    const message = `
*New Biriyani Order!* 🍛

*Name:* ${formData.name}
*Phone:* ${formData.phone}
*Place:* ${formData.place}
*Pack Type:* ${formData.packType === 'family' ? 'Family Pack (₹500)' : 'Single Pack (₹100)'}
*Quantity:* ${formData.packs} Pack(s)
*Total Amount:* ₹${totalAmount}
*Note:* ${formData.note || 'None'}
`;

    const encodedMessage = encodeURIComponent(message);

    const whatsappNumber = '9744623768';

    window.open(
      `https://wa.me/91${whatsappNumber}?text=${encodedMessage}`,
      '_blank'
    );
  };

  // =========================
  // Validation
  // =========================
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error('Enter a valid 10 digit phone number');
      return false;
    }

    if (!formData.place.trim()) {
      toast.error('Please enter your location');
      return false;
    }

    if (formData.packs < 1) {
      toast.error('Minimum 1 pack required');
      return false;
    }

    return true;
  };

  // =========================
  // Submit Handler
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/orders`,
        formData
      );

      if (res.data.success) {
        toast.success('Order placed successfully! 🍛');
        sendWhatsApp();
        resetForm();
      } else {
        toast.error('Failed to place order');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-dark bg-pattern">
      <Navbar onTrackClick={() => setIsTrackOpen(true)} />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section
          id="home"
          className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden"
        >
          <div className="absolute inset-0 z-0">
            <img
              src="/biriyani-bg.png"
              alt="Delicious Biriyani"
              className="w-full h-full object-cover opacity-75"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-[#dcfce7]/70 via-[#f0fdf4]/85 to-brand-dark"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex flex-col items-center justify-center mb-6">
                <span className="text-brand-lime font-cooper text-3xl sm:text-4xl tracking-normal normal-case mb-1 leading-none">
                  SSF
                </span>
                <span className="text-brand-lime font-extrabold tracking-[0.2em] uppercase text-xs sm:text-sm">
                  Tirur Division Presents
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-4">
                Biriyani Challenge
              </h1>

              <div className="inline-block bg-white border border-green-100 backdrop-blur-sm rounded-full px-5 py-2 mb-6">
                <span className="text-xs sm:text-sm text-slate-700 font-medium">
                  In aid of <strong className="text-brand-lime font-extrabold">Sahithyolsav 2026</strong> | June 20, 21 @ Paravanna
                </span>
              </div>

              <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto mb-4 font-medium">
                Enjoy delicious, authentic biriyani and support our cultural festival.
              </p>

              <div className="flex flex-col items-center justify-center mb-10">
                <div className="bg-brand-lime/10 border border-brand-lime/30 text-brand-lime font-extrabold px-6 py-2.5 rounded-2xl text-sm sm:text-base flex items-center gap-2 mb-8 shadow-lg shadow-brand-lime/5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-lime animate-ping"></span>
                  Challenge Date: 2026 June 11 (Thursday)
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="bg-white backdrop-blur-md rounded-2xl px-8 py-4 border border-green-100 min-w-[150px] transition-all hover:border-green-200 shadow-sm">
                    <span className="block text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">One Pack</span>
                    <span className="text-3xl font-extrabold text-slate-900">₹100</span>
                  </div>

                  <div className="bg-white backdrop-blur-md rounded-2xl px-8 py-4 border border-brand-lime/20 min-w-[150px] transition-all hover:border-brand-lime/40 shadow-sm">
                    <span className="block text-brand-lime text-xs mb-1 uppercase tracking-wider font-bold">Family Pack</span>
                    <span className="text-3xl font-extrabold text-brand-lime">₹500</span>
                  </div>

                  <a
                    href="#order"
                    className="bg-brand-lime hover:bg-brand-yellow text-white px-10 py-5 rounded-2xl font-extrabold text-lg transition-all shadow-lg shadow-brand-lime/20 w-full sm:w-auto text-center"
                  >
                    Order Now
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ORDER SECTION */}
        <section id="order" className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="glass-panel rounded-3xl p-8 md:p-12 shadow-2xl bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4 border-b border-green-100/50 pb-6 text-center sm:text-left">
                <div>
                  <h3 className="text-3xl font-extrabold text-slate-900 mb-1">
                    Place Your Order
                  </h3>
                  <p className="text-slate-500 font-medium text-sm">
                    Fill the simple form below to order
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTrackOpen(true)}
                  className="inline-flex items-center gap-2 bg-green-50/50 hover:bg-green-100 text-brand-lime font-extrabold text-sm px-5 py-2.5 rounded-xl border border-green-100/80 transition-all cursor-pointer shadow-sm"
                >
                  <Search size={16} />
                  Already Ordered? Track Here
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NAME */}
                  <div>
                    <label className="text-sm text-slate-600 font-semibold flex items-center gap-2 mb-2">
                      <User size={16} />
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none"
                    />
                  </div>

                  {/* PHONE */}
                  <div>
                    <label className="text-sm text-slate-600 font-semibold flex items-center gap-2 mb-2">
                      <Phone size={16} />
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none"
                    />
                  </div>

                  {/* PLACE */}
                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600 font-semibold flex items-center gap-2 mb-2">
                      <MapPin size={16} />
                      Delivery Address
                    </label>

                    <input
                      type="text"
                      name="place"
                      required
                      value={formData.place}
                      onChange={handleChange}
                      placeholder="Your Location"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none"
                    />
                  </div>

                  {/* PACKAGE TYPE SELECTOR */}
                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600 font-semibold flex items-center gap-2 mb-3">
                      <Package size={16} />
                      Choose Package
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Single Pack Option */}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, packType: 'single' }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.packType === 'single'
                            ? 'border-brand-lime bg-green-50/50 shadow-md shadow-brand-lime/5'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-850 text-base">One Pack</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            formData.packType === 'single' ? 'bg-brand-lime text-white' : 'bg-slate-100 text-slate-500'
                          }`}>₹100</span>
                        </div>
                        <p className="text-xs text-slate-500">Delicious hot single serving pack</p>
                      </button>

                      {/* Family Pack Option */}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, packType: 'family' }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.packType === 'family'
                            ? 'border-brand-lime bg-green-50/50 shadow-md shadow-brand-lime/5'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-850 text-base">Family Pack</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            formData.packType === 'family' ? 'bg-brand-lime text-white' : 'bg-slate-100 text-slate-500'
                          }`}>₹500</span>
                        </div>
                        <p className="text-xs text-slate-500">Great value for family & friends</p>
                      </button>
                    </div>
                  </div>

                  {/* PACKS */}
                  <div>
                    <label className="text-sm text-slate-600 font-semibold flex items-center gap-2 mb-2">
                      <Package size={16} />
                      Packs
                    </label>

                    <input
                      type="number"
                      name="packs"
                      min="1"
                      required
                      value={formData.packs}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none"
                    />
                  </div>

                  {/* TOTAL */}
                  <div className="bg-brand-lime/10 border border-brand-lime/20 rounded-xl p-4 flex flex-col justify-center items-center shadow-inner">
                    <span className="text-sm text-brand-lime font-bold mb-1">
                      Total Amount
                    </span>

                    <span className="text-3xl font-extrabold text-brand-lime">
                      ₹{totalAmount}
                    </span>
                  </div>

                  {/* NOTE */}
                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-600 font-semibold flex items-center gap-2 mb-2">
                      <MessageSquare size={16} />
                      Additional Note
                    </label>

                    <textarea
                      name="note"
                      rows="3"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Any special request?"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none"
                    />
                  </div>

                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-lime hover:bg-brand-yellow text-white font-extrabold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-70 shadow-lg shadow-brand-lime/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={20} />
                      Order Now (Cash on Delivery)
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* TRACK ORDER MODAL */}
      {isTrackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-green-100 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setIsTrackOpen(false);
                setTrackPhone('');
                setTrackResult(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-extrabold text-slate-950 flex items-center gap-2">
                <Search size={22} className="text-brand-lime" />
                Track Your Orders
              </h3>
              <p className="text-slate-500 text-sm mt-1 font-medium">Enter your phone number to check your order history</p>
            </div>

            <form onSubmit={handleTrack} className="space-y-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit Phone Number"
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime font-semibold"
                />
                <button
                  type="submit"
                  disabled={isTrackLoading}
                  className="bg-brand-lime hover:bg-brand-yellow text-white font-extrabold px-6 rounded-xl transition-all shadow-md shadow-brand-lime/10 flex items-center justify-center min-w-[100px] cursor-pointer"
                >
                  {isTrackLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </form>

            {/* RESULTS */}
            {trackResult !== null && (
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">
                  Order History ({trackResult.length})
                </h4>

                {trackResult.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-400 font-medium">No orders found for this number.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-1">
                    {trackResult.map((order) => (
                      <div key={order._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-start transition-all hover:border-green-200">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {order.packs} x {order.packType === 'family' ? 'Family Pack' : 'One Pack'}
                            </span>
                            <span className="text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-full font-extrabold uppercase">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <span>Placed at:</span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                          {order.note && (
                            <p className="text-xs text-slate-400 italic mt-1 max-w-[200px] truncate">
                              Note: "{order.note}"
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="block font-black text-brand-lime text-base">
                            ₹{order.total}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold capitalize">
                            Cash on Delivery
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default LandingPage;