import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Send,
  MapPin,
  Phone,
  User,
  Package,
  MessageSquare,
  Search,
  X,
  CheckCircle,
  Calendar,
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Resilient phone number cleaning utility
const cleanPhoneNumber = (phone) => {
  const digits = phone.replace(/\D/g, ''); // strip all non-digits
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
};

const AREAS = [
  'Paravanna',
  'Paravanna Town',
  'Puthangadi',
  'Pariyapuram',
  'Rahmathabad',
  'Pachatiri',
  'Vettom',
  'Murivazhikal',
];

const LandingPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    place: '',
    packType: 'single', // 'single' or 'family'
    packs: 1,
    note: '',
    area: '',
    latitude: null,
    longitude: null,
    googleMapsLink: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tracking States
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // New Dropdown and Geolocation States
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    const finalTrackPhone = cleanPhoneNumber(trackPhone);
    if (!/^[0-9]{10}$/.test(finalTrackPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsTrackLoading(true);
    // Simulate short network request delay for high fidelity UX
    setTimeout(() => {
      try {
        const localOrders = JSON.parse(localStorage.getItem('biriyani_orders') || '[]');
        const filtered = localOrders.filter(
          (order) => cleanPhoneNumber(order.phone) === finalTrackPhone
        );
        setTrackResult(filtered);
        if (filtered.length === 0) {
          toast.info('No orders found for this phone number');
        }
      } catch (error) {
        console.error('Tracking query failure:', error);
        toast.error('Failed to retrieve order history.');
      } finally {
        setIsTrackLoading(false);
      }
    }, 450);
  };

  const pricePerPack = formData.packType === 'family' ? 500 : 100;
  const totalAmount = formData.packs * pricePerPack;

  // =========================
  // Geolocation Handlers
  // =========================
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
          googleMapsLink
        }));
        setIsLocating(false);
        toast.success('Location fetched successfully! 📍');
      },
      (error) => {
        setIsLocating(false);
        console.error('Error fetching geolocation:', error);
        let message = 'Failed to fetch location. Please enable location permissions.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please allow location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out.';
        }
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRemoveLocation = () => {
    setFormData((prev) => ({
      ...prev,
      latitude: null,
      longitude: null,
      googleMapsLink: ''
    }));
    toast.info('Location coordinates removed.');
  };

  // =========================
  // Handle Input Change
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      let val = value;
      if (name === 'packs') {
        val = Math.max(1, parseInt(value) || 1);
      } else if (name === 'phone') {
        // Allow numbers, spaces, plus, hyphens, and parentheses for flexible typing
        val = value.replace(/[^0-9+\s()-]/g, '');
      }
      return {
        ...prev,
        [name]: val
      };
    });
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
      area: '',
      latitude: null,
      longitude: null,
      googleMapsLink: '',
    });
    setAreaSearchTerm('');
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
${formData.area ? `*Area:* ${formData.area}` : ''}
*Pack Type:* ${formData.packType === 'family' ? 'Family Pack (₹500)' : 'Single Pack (₹100)'}
*Quantity:* ${formData.packs} Pack(s)
*Total Amount:* ₹${totalAmount}
${formData.googleMapsLink ? `*Location Link:* ${formData.googleMapsLink}` : ''}
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
  const validateForm = (data) => {
    if (!data.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }

    if (!/^[0-9]{10}$/.test(data.phone)) {
      toast.error('Enter a valid 10 digit phone number');
      return false;
    }

    if (!data.place.trim()) {
      toast.error('Please enter your location');
      return false;
    }

    if (data.packs < 1) {
      toast.error('Minimum 1 pack required');
      return false;
    }

    return true;
  };

  // =========================
  // Submit Handler
  // =========================
  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Clean phone number before validation & storage
    const cleanedPhone = cleanPhoneNumber(formData.phone);
    const updatedFormData = {
      ...formData,
      phone: cleanedPhone
    };

    if (!validateForm(updatedFormData)) return;

    setIsSubmitting(true);

    // Simulate submission delay for realistic feel
    setTimeout(() => {
      try {
        const orderId = `BC-${Math.floor(100000 + Math.random() * 900000)}`;
        const newOrder = {
          _id: orderId,
          name: updatedFormData.name,
          phone: updatedFormData.phone,
          place: updatedFormData.place,
          area: updatedFormData.area || '',
          packType: updatedFormData.packType,
          packs: updatedFormData.packs,
          total: totalAmount,
          note: updatedFormData.note || '',
          googleMapsLink: updatedFormData.googleMapsLink || '',
          createdAt: new Date().toISOString()
        };

        // Save order in localStorage
        const localOrders = JSON.parse(localStorage.getItem('biriyani_orders') || '[]');
        localOrders.push(newOrder);
        localStorage.setItem('biriyani_orders', JSON.stringify(localOrders));

        // Format WhatsApp Message
        const message = `*🍛 BIRIYANI CHALLENGE ORDER*
----------------------------------
*Order ID:* ${orderId}
*Customer Name:* ${newOrder.name}
*Phone Number:* ${newOrder.phone}
*Location/Place:* ${newOrder.place}
${newOrder.area ? `*Area:* ${newOrder.area}\n` : ''}*Quantity:* ${newOrder.packs} x ${newOrder.packType === 'family' ? 'Family Pack (₹500)' : 'One Pack (₹100)'}
*Challenge Date:* 2026 June 11 (Thursday)
*Total Amount:* ₹${newOrder.total}
*Special Notes:* ${newOrder.note || 'None'}
----------------------------------
${newOrder.googleMapsLink ? `📍 *Delivery Location:* \n${newOrder.googleMapsLink}\n----------------------------------\n` : ''}*Sahithyolsav 2026 Cultural Event*`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappNumber = '9744623768';

        // Direct WhatsApp redirection
        window.open(
          `https://wa.me/91${whatsappNumber}?text=${encodedMessage}`,
          '_blank'
        );

        toast.success('Redirecting to WhatsApp to complete your order! 🍛');
        setOrderSuccessData(newOrder);
        resetForm();
      } catch (error) {
        console.error('Order creation error:', error);
        toast.error('Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }, 600);
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
                  Tirur Division Event crow
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-keraleeyam text-slate-900 mb-4">
                ബിരിയാണി ചലഞ്ച്
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
                <div className="bg-brand-lime/10 border-2 border-brand-lime/40 text-slate-800 font-extrabold px-8 py-3.5 rounded-2xl text-lg sm:text-xl flex items-center gap-3 mb-8 shadow-xl shadow-brand-lime/10 hover:shadow-brand-lime/20 hover:scale-[1.03] transition-all duration-300">
                  <div className="relative flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-brand-lime animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-lime animate-ping"></span>
                  </div>
                  <span>
                    Challenge Date: <strong className="text-brand-lime font-black underline decoration-2 decoration-brand-yellow/60 underline-offset-4">2026 June 11 (Thursday)</strong>
                  </span>
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
                      maxLength={15}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none"
                    />
                  </div>

                  {/* PLACE (Delivery Address) & Geolocation */}
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-slate-600 font-semibold flex items-center gap-2">
                        <MapPin size={16} />
                        Delivery Address
                      </label>
                      
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          formData.latitude && formData.longitude
                            ? 'bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20'
                            : isLocating
                            ? 'bg-slate-550/10 text-slate-400 border-slate-200 animate-pulse'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <MapPin size={12} className={isLocating ? 'animate-bounce' : ''} />
                        {isLocating ? 'Locating...' : formData.latitude ? 'Location Selected 📍' : 'Use Current Location'}
                      </button>
                    </div>

                    <input
                      type="text"
                      name="place"
                      required
                      value={formData.place}
                      onChange={handleChange}
                      placeholder="Your Location / Landmark"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none"
                    />

                    {/* Coordinates confirmation and remove button */}
                    {formData.latitude && formData.longitude && (
                      <div className="mt-2 flex items-center justify-between bg-green-50/50 border border-green-100 rounded-xl px-3 py-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span className="font-semibold text-slate-750">
                            Coordinates: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                          </span>
                          <a
                            href={formData.googleMapsLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-lime hover:underline font-extrabold flex items-center gap-0.5 ml-1"
                          >
                            View on Google Maps
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveLocation}
                          className="text-red-500 hover:text-red-700 font-extrabold cursor-pointer transition-all"
                        >
                          Remove Location
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AREA (Searchable Dropdown Field) */}
                  <div className="md:col-span-2 relative">
                    <label className="text-sm text-slate-600 font-semibold flex items-center gap-2 mb-2">
                      <MapPin size={16} />
                      Area (Optional)
                    </label>
                    
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-left text-slate-800 focus:border-brand-lime focus:outline-none flex justify-between items-center shadow-sm transition-all hover:border-slate-350"
                      >
                        <span className={formData.area ? 'font-bold text-slate-900' : 'text-slate-400 font-medium'}>
                          {formData.area || 'Select Your Area (Optional)'}
                        </span>
                        <span className="text-slate-400 pointer-events-none">
                          <svg className={`w-5 h-5 transition-transform ${isAreaDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>

                      {/* Dropdown list with background click-outside handler */}
                      {isAreaDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-20" 
                            onClick={() => setIsAreaDropdownOpen(false)}
                          />
                          <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                              <Search size={14} className="text-slate-400 ml-1" />
                              <input
                                type="text"
                                value={areaSearchTerm}
                                onChange={(e) => setAreaSearchTerm(e.target.value)}
                                placeholder="Search area..."
                                className="w-full bg-transparent border-none text-xs text-slate-800 focus:outline-none py-1 font-bold"
                              />
                              {areaSearchTerm && (
                                <button
                                  type="button"
                                  onClick={() => setAreaSearchTerm('')}
                                  className="text-slate-400 hover:text-slate-650 cursor-pointer"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>

                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                              {AREAS.filter(area => area.toLowerCase().includes(areaSearchTerm.toLowerCase())).length > 0 ? (
                                AREAS.filter(area => area.toLowerCase().includes(areaSearchTerm.toLowerCase())).map((area) => (
                                  <button
                                    key={area}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, area }));
                                      setIsAreaDropdownOpen(false);
                                      setAreaSearchTerm('');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-all flex items-center justify-between ${
                                      formData.area === area
                                        ? 'bg-brand-lime/10 text-brand-lime font-black'
                                        : 'text-slate-750 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>{area}</span>
                                    {formData.area === area && <span className="w-1.5 h-1.5 rounded-full bg-brand-lime"></span>}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                                  No areas found
                                </div>
                              )}
                              
                              {formData.area && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, area: '' }));
                                    setIsAreaDropdownOpen(false);
                                    setAreaSearchTerm('');
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs text-red-500 font-extrabold hover:bg-red-50 transition-all border-t border-slate-100"
                                >
                                  Clear Selection
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
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
                  maxLength={15}
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value.replace(/[^0-9+\s()-]/g, ''))}
                  placeholder="Enter Phone Number"
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
                            {(() => {
                              const status = order.status || 'Pending';
                              let pillClass = 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
                              if (status === 'Confirmed') pillClass = 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
                              if (status === 'Cooking') pillClass = 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
                              if (status === 'Out for Delivery') pillClass = 'bg-teal-500/10 text-teal-600 border border-teal-500/20';
                              if (status === 'Delivered') pillClass = 'bg-green-500/10 text-green-650 border border-green-500/20';
                              if (status === 'Cancelled') pillClass = 'bg-red-500/10 text-red-600 border border-red-500/20';

                              return (
                                <span className={`text-[10px] ${pillClass} px-2 py-0.5 rounded-full font-extrabold uppercase`}>
                                  {status}
                                </span>
                              );
                            })()}
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

      {/* ORDER SUCCESSFUL MODAL */}
      {orderSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-green-100 text-center relative"
          >
            <button
              onClick={() => setOrderSuccessData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-brand-lime mx-auto mb-5 border border-green-100/50 shadow-sm">
              <CheckCircle size={36} className="text-brand-lime animate-bounce" />
            </div>

            <h3 className="text-2xl font-black text-slate-950 mb-1">
              Order Confirmed! 🍛
            </h3>
            <p className="text-slate-500 font-medium text-xs mb-5">
              Your order has been recorded successfully. Complete confirmation via WhatsApp below.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Name:</span>
                <span className="text-slate-800 font-extrabold">{orderSuccessData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Packs:</span>
                <span className="text-slate-800 font-extrabold">
                  {orderSuccessData.packs} x {orderSuccessData.packType === 'family' ? 'Family Pack' : 'One Pack'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Total Cost:</span>
                <span className="text-brand-lime font-black">₹{orderSuccessData.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Location:</span>
                <span className="text-slate-800 font-extrabold">{orderSuccessData.place}</span>
              </div>
              {orderSuccessData.area && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Area:</span>
                  <span className="text-slate-800 font-extrabold">{orderSuccessData.area}</span>
                </div>
              )}
              {orderSuccessData.googleMapsLink && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Location Coords:</span>
                  <span className="text-slate-800 font-extrabold flex items-center gap-1">
                    <span>Shared 📍</span>
                    <a href={orderSuccessData.googleMapsLink} target="_blank" rel="noreferrer" className="text-brand-lime hover:underline font-extrabold">View Map</a>
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const message = `*🍛 BIRIYANI CHALLENGE ORDER*
----------------------------------
*Order ID:* ${orderSuccessData._id}
*Customer Name:* ${orderSuccessData.name}
*Phone Number:* ${orderSuccessData.phone}
*Location/Place:* ${orderSuccessData.place}
${orderSuccessData.area ? `*Area:* ${orderSuccessData.area}\n` : ''}*Quantity:* ${orderSuccessData.packs} x ${orderSuccessData.packType === 'family' ? 'Family Pack (₹500)' : 'One Pack (₹100)'}
*Challenge Date:* 2026 June 11 (Thursday)
*Total Amount:* ₹${orderSuccessData.total}
*Special Notes:* ${orderSuccessData.note || 'None'}
----------------------------------
${orderSuccessData.googleMapsLink ? `📍 *Delivery Location:* \n${orderSuccessData.googleMapsLink}\n----------------------------------\n` : ''}*Sahithyolsav 2026 Cultural Event*`;

                const encodedMessage = encodeURIComponent(message);
                const whatsappNumber = '9744623768';
                window.open(`https://wa.me/91${whatsappNumber}?text=${encodedMessage}`, '_blank');
                setOrderSuccessData(null);
              }}
              className="w-full bg-brand-lime hover:bg-brand-yellow text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-brand-lime/10 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <MessageSquare size={18} />
              Complete Order on WhatsApp
            </button>

            <button
              onClick={() => setOrderSuccessData(null)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              Close Window
            </button>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default LandingPage;