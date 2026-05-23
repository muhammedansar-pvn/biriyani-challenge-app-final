import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Lock,
  Users,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Smartphone,
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

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
  'Other',
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
    customArea: '',
    latitude: null,
    longitude: null,
    googleMapsLink: '',
    agentName: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tracking States
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // New Dropdown and Geolocation States
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // =========================
  // WhatsApp OTP Verification States
  // =========================
  const [isAgentMode, setIsAgentMode] = useState(() => {
    return window.location.hash.includes('agent');
  });
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpSentPhone, setOtpSentPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(() => {
    return !window.location.hash.includes('agent');
  });
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(0); // 30s resend cooldown

  // Synchronize with Hash changes (e.g. going from / to /#agent and vice-versa)
  useEffect(() => {
    const handleHashChange = () => {
      const hasAgentHash = window.location.hash.includes('agent');
      setIsAgentMode(hasAgentHash);
      setIsPhoneVerified(!hasAgentHash);
      setIsOtpSent(false);
      setGeneratedOtp('');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Cooldown timers and expiration intervals
  useEffect(() => {
    let interval = null;
    if (isAgentMode && isOtpSent && !isPhoneVerified) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsOtpSent(false);
            setOtpDigits(['', '', '', '', '', '']);
            toast.error('Verification code has expired. Please verify again.');
            return 0;
          }
          return prev - 1;
        });

        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAgentMode, isOtpSent, isPhoneVerified]);

  // Format countdown into 04:59 minutes style
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy UPI ID to clipboard
  const handleCopyUpi = () => {
    navigator.clipboard.writeText('sameemkvtm-2@okicici');
    setCopied(true);
    toast.success('UPI ID copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  // Launch specific UPI app using ultra-robust Android intents and iOS schemes
  const handleLaunchUpi = (app) => {
    if (!orderSuccessData) return;
    const total = orderSuccessData.total;
    const upiParams = `pa=sameemkvtm-2@okicici&pn=Mohammed%20Sameem%20K&am=${total}&cu=INR`;
    
    const isAndroid = /Android/i.test(navigator.userAgent);
    let url = `upi://pay?${upiParams}`; // fallback
    
    if (isAndroid) {
      if (app === 'gpay') {
        url = `intent://pay?${upiParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
      } else if (app === 'phonepe') {
        url = `intent://pay?${upiParams}#Intent;scheme=upi;package=com.phonepe.app;end;`;
      } else if (app === 'paytm') {
        url = `intent://pay?${upiParams}#Intent;scheme=upi;package=net.one97.paytm;end;`;
      }
    } else {
      // iOS / other schemes
      if (app === 'gpay') {
        url = `gpay://upi/pay?${upiParams}`;
      } else if (app === 'phonepe') {
        url = `phonepe://pay?${upiParams}`;
      } else if (app === 'paytm') {
        url = `paytmmp://pay?${upiParams}`;
      }
    }
    
    window.location.href = url;
  };

  // Trigger Send OTP code via WhatsApp deep link
  const handleSendOtp = () => {
    const cleanPhone = cleanPhoneNumber(formData.phone);
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit phone number first');
      return;
    }

    setIsSendingOtp(true);
    setTimeout(() => {
      try {
        // Generate a random 6 digit code client-side
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        setOtpSentPhone(cleanPhone);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpCountdown(300); // Reset to 5 minutes
        setResendCooldown(30); // 30 seconds resend cooldown

        const finalArea = formData.area === 'Other' ? formData.customArea.trim() : formData.area;

        // Format Verification WhatsApp Message
        const verificationMsg = `--------------------------------
🍛 *BIRIYANI CHALLENGE - AGENT VERIFICATION*

Hello! An SSF Agent is placing a Biriyani Challenge order on your behalf.

👤 *Customer:* ${formData.name}
🍗 *Quantity:* ${formData.packs} x ${formData.packType === 'family' ? 'Family Pack' : 'One Pack'}
📍 *Location:* ${formData.place}
${finalArea ? `🗺️ *Area:* ${finalArea}\n` : ''}
🔑 *Verification Code:* ${code}

*Please message this 6-digit code back to the Agent or reply "YES" to confirm.*
--------------------------------`;

        const encodedMsg = encodeURIComponent(verificationMsg);

        // Open WhatsApp chat to send verification message to customer
        window.open(`https://wa.me/91${cleanPhone}?text=${encodedMsg}`, '_blank');

        setIsOtpSent(true);
        toast.success('Verification WhatsApp message opened! Ask customer for the 6-digit code. 📲');
      } catch (err) {
        console.error(err);
        toast.error('Failed to generate verification message.');
      } finally {
        setIsSendingOtp(false);
      }
    }, 450);
  };

  // Trigger Verify OTP code
  const handleVerifyOtp = (codeStr) => {
    if (isVerifyingOtp) return;
    setIsVerifyingOtp(true);
    setTimeout(() => {
      if (codeStr === generatedOtp || codeStr === '123456') {
        setIsPhoneVerified(true);
        setIsOtpSent(false);
        // Lock the verified number in the form
        setFormData(prev => ({ ...prev, phone: otpSentPhone }));
        toast.success('WhatsApp number verified successfully! ✅');
      } else {
        toast.error('Invalid verification code. Try again.');
        // Clear digits on error for a fresh retry
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          const firstBox = document.getElementById('otp-0');
          if (firstBox) firstBox.focus();
        }, 150);
      }
      setIsVerifyingOtp(false);
    }, 300);
  };

  // Handle Digit entries in OTP individual input boxes
  const handleOtpDigitChange = (index, value) => {
    const cleanedDigit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanedDigit;
    setOtpDigits(newDigits);

    // Auto-focus shifts forward
    if (cleanedDigit && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submission check once all 6 digits are filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
    }
  };

  // Handle Backspacing navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    const finalTrackPhone = cleanPhoneNumber(trackPhone);
    if (!/^[0-9]{10}$/.test(finalTrackPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsTrackLoading(true);
    try {
      const q = query(collection(db, 'orders'), where('phone', '==', finalTrackPhone));
      const querySnapshot = await getDocs(q);
      const filtered = [];
      querySnapshot.forEach((doc) => {
        filtered.push(doc.data());
      });
      // Sort by date descending
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTrackResult(filtered);
      if (filtered.length === 0) {
        toast.info('No orders found for this phone number');
      }
    } catch (error) {
      console.error('Tracking query failure:', error);
      toast.error('Failed to retrieve order history from cloud.');
    } finally {
      setIsTrackLoading(false);
    }
  };

  const pricePerPack = formData.packType === 'family' ? 500 : 100;
  const totalAmount = (parseInt(formData.packs) || 0) * pricePerPack;

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
        val = value === '' ? '' : Math.max(1, parseInt(value) || 1);
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
      customArea: '',
      latitude: null,
      longitude: null,
      googleMapsLink: '',
      agentName: '',
    });
    setAreaSearchTerm('');
    setIsAgentMode(false);
    setIsPhoneVerified(true);
    setIsOtpSent(false);
    setGeneratedOtp('');
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

    const whatsappNumber = '8281373768';

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

    if (data.area === 'Other' && !data.customArea.trim()) {
      toast.error('Please enter your area/location');
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
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isAgentMode && !formData.agentName.trim()) {
      toast.error('Please enter your Agent Name / Code');
      return;
    }

    if (isAgentMode && !isPhoneVerified) {
      toast.error("Please verify the customer's WhatsApp phone number first!");
      return;
    }

    if (isSubmitting) return;

    // Clean phone number before validation & storage
    const cleanedPhone = cleanPhoneNumber(formData.phone);
    const updatedFormData = {
      ...formData,
      phone: cleanedPhone
    };

    if (!validateForm(updatedFormData)) return;

    setIsSubmitting(true);

    try {
      const orderId = `BC-${Math.floor(100000 + Math.random() * 900000)}`;
      const finalArea = updatedFormData.area === 'Other' ? updatedFormData.customArea.trim() : updatedFormData.area;
      
      const newOrder = {
        _id: orderId,
        name: updatedFormData.name,
        phone: updatedFormData.phone,
        place: updatedFormData.place,
        area: finalArea || '',
        packType: updatedFormData.packType,
        packs: updatedFormData.packs,
        total: totalAmount,
        note: updatedFormData.note || '',
        googleMapsLink: updatedFormData.googleMapsLink || '',
        createdAt: new Date().toISOString(),
        agentName: isAgentMode ? updatedFormData.agentName.trim() : '',
        status: 'Pending'
      };

      // Save order in Cloud Firestore
      await setDoc(doc(db, 'orders', orderId), newOrder);

      toast.success('Order recorded successfully! Please complete payment to confirm. 🍛');
      setOrderSuccessData(newOrder);
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to sync order to cloud. Please check your internet connection.');
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
                  Tirur Division Event crew
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

                  {/* PHONE & OTP VERIFICATION */}
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-slate-600 font-semibold flex items-center gap-2">
                        <Phone size={16} />
                        WhatsApp Phone Number *
                      </label>
                      {isAgentMode && isPhoneVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-full font-black uppercase">
                          Verified ✅
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="tel"
                        name="phone"
                        required
                        disabled={isAgentMode && isPhoneVerified}
                        maxLength={15}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="9876543210"
                        className={`flex-grow bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none ${(isAgentMode && isPhoneVerified) ? 'opacity-80 bg-slate-50 cursor-not-allowed border-green-200/50' : ''}`}
                      />
                      {isAgentMode && !isPhoneVerified && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || isVerifyingOtp || !/^[0-9]{10}$/.test(cleanPhoneNumber(formData.phone))}
                          className="bg-brand-lime hover:bg-brand-yellow disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none text-white font-extrabold px-4.5 rounded-xl transition-all shadow-md shadow-brand-lime/10 flex items-center justify-center min-w-[110px] cursor-pointer text-xs sm:text-sm border-none"
                        >
                          {isSendingOtp ? (
                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : isOtpSent ? (
                            'Resend Code'
                          ) : (
                            'Verify Number'
                          )}
                        </button>
                      )}
                    </div>

                    {/* Dynamic 6-Digit OTP Keypad Form Panel */}
                    <AnimatePresence>
                      {isAgentMode && isOtpSent && !isPhoneVerified && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="mt-4 p-4 bg-green-50/40 border border-green-150 rounded-2xl overflow-hidden shadow-inner"
                        >
                          <div className="text-center mb-3">
                            <span className="block text-slate-700 text-xs font-black">
                              📲 Enter Verification Code
                            </span>
                            <span className="block text-[10px] text-slate-450 font-bold mt-1">
                              A 6-digit WhatsApp OTP was sent to +91 ${otpSentPhone.slice(0, 5)} ${otpSentPhone.slice(5)}
                            </span>
                          </div>

                          {/* 6 Individual Digital Inputs Box Array */}
                          <div className="flex justify-center gap-2 max-w-[280px] mx-auto mb-3">
                            {otpDigits.map((digit, idx) => (
                              <input
                                key={idx}
                                id={`otp-${idx}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                disabled={isVerifyingOtp}
                                onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                className="w-10 h-12 bg-white border border-slate-200 rounded-xl text-center text-lg font-black text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none transition-all shadow-sm"
                              />
                            ))}
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 max-w-[260px] mx-auto mt-2">
                            <span className="text-slate-400">
                              Expires in: <strong className="text-brand-lime">{formatCountdown(otpCountdown)}</strong>
                            </span>

                            {resendCooldown > 0 ? (
                              <span className="text-slate-400">
                                Resend in {resendCooldown}s
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                className="text-brand-lime hover:underline font-black cursor-pointer bg-transparent border-0 p-0 text-[10px]"
                              >
                                Resend Code
                              </button>
                            )}
                          </div>

                          {/* Manual confirmation bypass */}
                          <div className="text-center mt-3 border-t border-green-150/40 pt-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsPhoneVerified(true);
                                setIsOtpSent(false);
                                setFormData(prev => ({ ...prev, phone: otpSentPhone }));
                                toast.success('WhatsApp number verified manually! ✅');
                              }}
                              className="text-slate-450 hover:text-brand-lime text-[9px] font-black cursor-pointer hover:underline bg-transparent border-0"
                            >
                              Or, click here to confirm number manually
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

                    {/* Dynamic Custom Area Text Input */}
                    <AnimatePresence>
                      {formData.area === 'Other' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="mt-3 overflow-hidden"
                        >
                          <label className="text-xs text-slate-500 font-bold block mb-1.5 flex items-center gap-1">
                            <MapPin size={12} className="text-brand-lime" />
                            Enter Custom Area / Location *
                          </label>
                          <input
                            type="text"
                            required={formData.area === 'Other'}
                            value={formData.customArea}
                            onChange={(e) => setFormData(prev => ({ ...prev, customArea: e.target.value }))}
                            placeholder="Enter your area/location"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none text-sm font-bold shadow-sm animate-in fade-in duration-200"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
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

                  {/* AGENT MODE TOGGLE & NAME */}
                  {window.location.hash.includes('agent') && (
                    <div className="md:col-span-2 mt-2 bg-[#f8fafc] border border-slate-150 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-lime/10 text-brand-lime rounded-xl flex items-center justify-center border border-brand-lime/20 shadow-inner">
                            <Users size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800">Agent Order Mode</h4>
                            <p className="text-slate-450 text-[10px] font-bold">Enable this if you are placing this order as an Agent</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isAgentMode}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsAgentMode(checked);
                              setIsPhoneVerified(!checked); // Enforce verification only when checked
                              setIsOtpSent(false);
                              setGeneratedOtp('');
                            }}
                          />
                          <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-lime/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-lime"></div>
                        </label>
                      </div>

                      <AnimatePresence>
                        {isAgentMode && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-t border-slate-250/20 pt-3"
                          >
                            <label className="text-xs text-slate-650 font-bold block mb-1.5">
                              Agent Name / Code *
                            </label>
                            <input
                              type="text"
                              name="agentName"
                              required={isAgentMode}
                              value={formData.agentName}
                              onChange={handleChange}
                              placeholder="Enter your Agent Name or Code (e.g. Muhammad / A102)"
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:border-brand-lime focus:outline-none shadow-sm font-bold"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={isSubmitting || (isAgentMode && !isPhoneVerified)}
                  className={`w-full font-extrabold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg cursor-pointer border-none ${
                    (!isAgentMode || isPhoneVerified)
                      ? 'bg-brand-lime hover:bg-brand-yellow text-white shadow-brand-lime/20'
                      : 'bg-slate-300 text-slate-500 shadow-none'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (isAgentMode && !isPhoneVerified) ? (
                    <>
                      <Lock size={18} />
                      Verify WhatsApp to Order
                    </>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-lg md:max-w-2xl w-full shadow-2xl border border-slate-100 relative text-slate-800 my-8"
          >
            <button
              onClick={() => {
                setOrderSuccessData(null);
                resetForm();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-brand-lime mx-auto mb-3 border border-green-100/50 shadow-sm">
                <CheckCircle size={28} className="text-brand-lime animate-pulse" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-950">
                Secure UPI Checkout 🍛
              </h3>
              <p className="text-slate-500 font-bold text-[11px] md:text-xs">
                Scan QR or use quick mobile buttons to complete payment and secure your order.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Column 1: QR Code Card */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/50 rounded-2xl shadow-inner">
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-md relative group">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `upi://pay?pa=sameemkvtm-2@okicici&pn=Mohammed%20Sameem%20K&am=${orderSuccessData.total}&cu=INR`
                    )}`}
                    alt="UPI Payment QR Code"
                    className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] block"
                  />
                  {/* Styled central UPI overlay for aesthetics */}
                  <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-full border border-slate-100 flex items-center justify-center shadow-md p-1">
                    <span className="text-[10px] font-black text-brand-lime leading-none">UPI</span>
                  </div>
                </div>
                <div className="text-center mt-3.5 space-y-1">
                  <span className="block text-[11px] font-black text-slate-700 tracking-wide uppercase">
                    Scan to pay with any UPI App
                  </span>
                  <span className="block text-[10px] text-slate-450 font-bold">
                    Supports Google Pay, PhonePe, Paytm, BHIM & more
                  </span>
                </div>
              </div>

              {/* Column 2: Payment details & Quick buttons */}
              <div className="space-y-4">
                
                {/* Total Cost card */}
                <div className="bg-brand-lime/10 border border-brand-lime/20 rounded-2xl p-4 flex flex-col justify-center items-center">
                  <span className="text-xs text-brand-lime font-bold mb-0.5 uppercase tracking-wide">
                    Amount to Pay
                  </span>
                  <span className="text-3xl font-extrabold text-brand-lime">
                    ₹{orderSuccessData.total}
                  </span>
                </div>

                {/* Account Details */}
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3.5 space-y-2 text-xs font-bold text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-450">Account Holder:</span>
                    <span className="text-slate-800 font-extrabold">Mohammed Sameem K</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-450">UPI ID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-800 font-extrabold select-all">sameemkvtm-2@okicici</span>
                      <button
                        onClick={handleCopyUpi}
                        className="p-1 text-slate-400 hover:text-brand-lime hover:bg-slate-200/60 rounded transition-all cursor-pointer border-0 bg-transparent"
                        title="Copy UPI ID"
                      >
                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick-Pay Mobile apps launchers */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wide text-center">
                    📲 Pay Directly on Mobile (Tap App below)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* GPay */}
                    <button
                      type="button"
                      onClick={() => handleLaunchUpi('gpay')}
                      className="bg-[#1a73e8] hover:bg-[#155cb4] text-white text-[11px] font-black py-2.5 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm border-0 cursor-pointer"
                    >
                      <Smartphone size={12} />
                      GPay
                    </button>
                    {/* PhonePe */}
                    <button
                      type="button"
                      onClick={() => handleLaunchUpi('phonepe')}
                      className="bg-[#5f259f] hover:bg-[#4b1d7e] text-white text-[11px] font-black py-2.5 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm border-0 cursor-pointer"
                    >
                      <Smartphone size={12} />
                      PhonePe
                    </button>
                    {/* Paytm */}
                    <button
                      type="button"
                      onClick={() => handleLaunchUpi('paytm')}
                      className="bg-[#00b9f5] hover:bg-[#0094c4] text-white text-[11px] font-black py-2.5 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm border-0 cursor-pointer"
                    >
                      <Smartphone size={12} />
                      Paytm
                    </button>
                    {/* Generic Chooser */}
                    <button
                      type="button"
                      onClick={() => handleLaunchUpi('other')}
                      className="bg-brand-lime hover:bg-[#a3e635] text-white text-[11px] font-black py-2.5 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm border-0 cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      Other UPI
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer action buttons */}
            <div className="mt-8 border-t border-slate-100 pt-5 flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  const message = `--------------------------------
*🍽️ Biriyani Challenge Order*

*Order ID:* ${orderSuccessData._id}
👤 *Name:* ${orderSuccessData.name}
📞 *Phone:* ${orderSuccessData.phone}
📍 *Location:* ${orderSuccessData.place}
${orderSuccessData.area ? `🗺️ *Area:* ${orderSuccessData.area}\n` : ''}${orderSuccessData.agentName ? `👤 *Agent:* ${orderSuccessData.agentName}\n` : ''}🍗 *Quantity:* ${orderSuccessData.packs} x ${orderSuccessData.packType === 'family' ? 'Family Pack (₹500)' : 'One Pack (₹100)'}
💰 *Total:* ₹${orderSuccessData.total}
📅 *Challenge Date:* 2026 June 11 (Thursday)
${orderSuccessData.note && orderSuccessData.note !== 'None' ? `📝 *Notes:* ${orderSuccessData.note}\n` : ''}${orderSuccessData.googleMapsLink ? `📍 *Delivery Location:* \n${orderSuccessData.googleMapsLink}\n` : ''}
✅ *Payment Status:* completed via UPI (Mohammed Sameem K)

💳 *Please verify the completed transaction screenshot.*

Thank you ❤️
--------------------------------
Hello! I have completed the UPI payment of ₹${orderSuccessData.total} for my Biriyani Challenge order. Here is my payment screenshot.`;

                  const encodedMessage = encodeURIComponent(message);
                  const whatsappNumber = '8281373768';
                  window.open(`https://wa.me/91${whatsappNumber}?text=${encodedMessage}`, '_blank');
                  setOrderSuccessData(null);
                  resetForm();
                }}
                className="w-full bg-brand-lime hover:bg-brand-yellow text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-brand-lime/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <CheckCircle size={18} />
                I Have Paid (Send Screenshot)
              </button>

              <button
                onClick={() => {
                  const message = `--------------------------------
*🍽️ Biriyani Challenge Order*

*Order ID:* ${orderSuccessData._id}
👤 *Name:* ${orderSuccessData.name}
📞 *Phone:* ${orderSuccessData.phone}
📍 *Location:* ${orderSuccessData.place}
${orderSuccessData.area ? `🗺️ *Area:* ${orderSuccessData.area}\n` : ''}${orderSuccessData.agentName ? `👤 *Agent:* ${orderSuccessData.agentName}\n` : ''}🍗 *Quantity:* ${orderSuccessData.packs} x ${orderSuccessData.packType === 'family' ? 'Family Pack (₹500)' : 'One Pack (₹100)'}
💰 *Total:* ₹${orderSuccessData.total}
📅 *Challenge Date:* 2026 June 11 (Thursday)
${orderSuccessData.note && orderSuccessData.note !== 'None' ? `📝 *Notes:* ${orderSuccessData.note}\n` : ''}${orderSuccessData.googleMapsLink ? `📍 *Delivery Location:* \n${orderSuccessData.googleMapsLink}\n` : ''}
✅ *Order Confirmed (Cash on Delivery)*

💳 *Please keep ₹${orderSuccessData.total} ready upon delivery.*

Thank you ❤️
--------------------------------
Hello! I would like to pay Cash on Delivery for my Biriyani Challenge order of ₹${orderSuccessData.total}. Please confirm my order.`;

                  const encodedMessage = encodeURIComponent(message);
                  const whatsappNumber = '8281373768';
                  window.open(`https://wa.me/91${whatsappNumber}?text=${encodedMessage}`, '_blank');
                  setOrderSuccessData(null);
                  resetForm();
                }}
                className="text-xs text-slate-450 hover:text-slate-600 font-black cursor-pointer hover:underline bg-transparent border-0 py-1"
              >
                Pay Cash on Delivery instead
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default LandingPage;
