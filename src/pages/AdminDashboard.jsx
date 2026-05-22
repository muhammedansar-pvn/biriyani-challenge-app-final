import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Lock,
  Unlock,
  Search,
  X,
  Plus,
  Download,
  Trash2,
  Printer,
  ExternalLink,
  MessageSquare,
  Phone,
  MapPin,
  RotateCcw,
  Check,
  Package,
  User,
  DollarSign,
  AlertCircle,
  FileText
} from 'lucide-react';

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

const AdminDashboard = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('biriyani_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [isPinError, setIsPinError] = useState(false);

  // Orders State
  const [orders, setOrders] = useState(() => {
    return JSON.parse(localStorage.getItem('biriyani_orders') || '[]');
  });

  // UI Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [packTypeFilter, setPackTypeFilter] = useState('All');

  // Modals and Importer States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Manual Order Form State
  const [newOrderForm, setNewOrderForm] = useState({
    name: '',
    phone: '',
    place: '',
    area: '',
    packType: 'single',
    packs: 1,
    note: '',
    googleMapsLink: '',
    status: 'Pending'
  });

  // Synchronize localStorage changes
  useEffect(() => {
    localStorage.setItem('biriyani_orders', JSON.stringify(orders));
  }, [orders]);

  // Handle PIN entry
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '2026' || pinInput === '9744' || pinInput === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('biriyani_admin_auth', 'true');
      toast.success('Admin access granted! Welcome back.');
    } else {
      setIsPinError(true);
      setPinInput('');
      toast.error('Invalid PIN. Please try again.');
      setTimeout(() => setIsPinError(false), 500);
    }
  };

  // Quick logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('biriyani_admin_auth');
    toast.info('Logged out from Admin Portal.');
  };

  // =========================
  // WhatsApp Order Parsing RegExp
  // =========================
  const handleImportTextSubmit = (e) => {
    e.preventDefault();
    if (!importText.trim()) {
      toast.error('Please paste order text first.');
      return;
    }

    try {
      const normalizedText = importText.replace(/\r\n/g, '\n').trim();

      const idMatch = normalizedText.match(/Order ID:\*?\s*(BC-\d+)/i);
      const nameMatch = normalizedText.match(/Customer Name:\*?\s*(.+)/i);
      const phoneMatch = normalizedText.match(/Phone Number:\*?\s*([\d\s+\-()]+)/i);
      const placeMatch = normalizedText.match(/Location\/Place:\*?\s*(.+)/i);
      const areaMatch = normalizedText.match(/Area:\*?\s*(.+)/i);
      const noteMatch = normalizedText.match(/Special Notes:\*?\s*(.+)/i);
      
      const qtyMatch = normalizedText.match(/Quantity:\*?\s*(\d+)/i);
      const packTypeMatch = normalizedText.match(/Quantity:\*?\s*\d+\s*x\s*([a-zA-Z\s]+)/i);

      const mapLinkMatch = normalizedText.match(/(https?:\/\/(www\.)?(google\.com\/maps|maps\.google|wa\.me)\S+)/i);

      if (!nameMatch || !phoneMatch || !placeMatch) {
        toast.error('Failed to parse order. Make sure Name, Phone, and Location are clear.');
        return;
      }

      const orderId = idMatch ? idMatch[1] : `BC-${Math.floor(100000 + Math.random() * 900000)}`;
      const rawPhone = phoneMatch[1].trim();
      const cleanPhone = cleanPhoneNumber(rawPhone);

      const packs = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const parsedTypeStr = packTypeMatch ? packTypeMatch[1].toLowerCase() : '';
      const packType = parsedTypeStr.includes('family') ? 'family' : 'single';
      
      const pricePerPack = packType === 'family' ? 500 : 100;
      const totalAmount = packs * pricePerPack;

      const parsedOrder = {
        _id: orderId,
        name: nameMatch[1].trim(),
        phone: cleanPhone,
        place: placeMatch[1].trim(),
        area: areaMatch ? areaMatch[1].trim() : '',
        packType: packType,
        packs: packs,
        total: totalAmount,
        note: noteMatch ? noteMatch[1].trim() : 'None',
        googleMapsLink: mapLinkMatch ? mapLinkMatch[1].trim() : '',
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const existingIdx = orders.findIndex(o => o._id === parsedOrder._id);
      if (existingIdx !== -1) {
        const updated = [...orders];
        parsedOrder.status = updated[existingIdx].status || 'Pending';
        parsedOrder.createdAt = updated[existingIdx].createdAt || parsedOrder.createdAt;
        updated[existingIdx] = parsedOrder;
        setOrders(updated);
        toast.success(`Updated existing order ${orderId}! 🍛`);
      } else {
        setOrders(prev => [parsedOrder, ...prev]);
        toast.success(`Imported new order ${orderId} successfully! 🍛`);
      }

      setImportText('');
      setIsImportModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error occurred while parsing the text. Check formatting.');
    }
  };

  // =========================
  // Form Submission Handlers
  // =========================
  const handleAddOrder = (e) => {
    e.preventDefault();
    if (!newOrderForm.name.trim() || !newOrderForm.phone.trim() || !newOrderForm.place.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const cleanPhone = cleanPhoneNumber(newOrderForm.phone);
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    const orderId = `BC-${Math.floor(100000 + Math.random() * 900000)}`;
    const pricePerPack = newOrderForm.packType === 'family' ? 500 : 100;
    const totalAmount = newOrderForm.packs * pricePerPack;

    const manualOrder = {
      _id: orderId,
      name: newOrderForm.name.trim(),
      phone: cleanPhone,
      place: newOrderForm.place.trim(),
      area: newOrderForm.area,
      packType: newOrderForm.packType,
      packs: parseInt(newOrderForm.packs),
      total: totalAmount,
      note: newOrderForm.note.trim() || 'None',
      googleMapsLink: newOrderForm.googleMapsLink.trim(),
      status: newOrderForm.status,
      createdAt: new Date().toISOString()
    };

    setOrders(prev => [manualOrder, ...prev]);
    toast.success(`Created manual order ${orderId}!`);
    setIsAddModalOpen(false);
    setNewOrderForm({
      name: '',
      phone: '',
      place: '',
      area: '',
      packType: 'single',
      packs: 1,
      note: '',
      googleMapsLink: '',
      status: 'Pending'
    });
  };

  // Update Status of an Order
  const handleUpdateStatus = (id, newStatus) => {
    const updated = orders.map(order => {
      if (order._id === id) {
        return { ...order, status: newStatus };
      }
      return order;
    });
    setOrders(updated);
    toast.success(`Order ${id} status updated to ${newStatus}`);
  };

  // Delete Order
  const handleDeleteOrder = (id) => {
    if (window.confirm(`Are you sure you want to permanently delete order ${id}?`)) {
      setOrders(prev => prev.filter(order => order._id !== id));
      toast.info(`Order ${id} deleted.`);
    }
  };

  // Reset database completely
  const handleResetDatabase = () => {
    if (window.confirm('WARNING: This will delete ALL orders in the local database. Are you absolutely sure?')) {
      if (window.confirm('Double verification: Type CONFIRM below to delete.')) {
        setOrders([]);
        localStorage.removeItem('biriyani_orders');
        toast.error('All orders wiped clean.');
      }
    }
  };

  // =========================
  // Actions: CSV and WhatsApp templates
  // =========================
  const downloadCSV = () => {
    if (orders.length === 0) {
      toast.error('No orders to export.');
      return;
    }

    const headers = [
      'Order ID',
      'Name',
      'Phone',
      'Place',
      'Area',
      'Pack Type',
      'Quantity',
      'Total Amount',
      'Note',
      'Google Maps Link',
      'Status',
      'Date Created'
    ];

    const rows = filteredOrders.map(o => [
      o._id,
      `"${o.name.replace(/"/g, '""')}"`,
      o.phone,
      `"${o.place.replace(/"/g, '""')}"`,
      `"${o.area || ''}"`,
      o.packType,
      o.packs,
      o.total,
      `"${(o.note || 'None').replace(/"/g, '""')}"`,
      o.googleMapsLink || '',
      o.status,
      new Date(o.createdAt).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Biriyani_Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Spreadsheet CSV downloaded successfully! 📊');
  };

  // WhatsApp Updates Templates
  const sendWhatsAppStatusUpdate = (order, type) => {
    let message = '';
    
    if (type === 'confirm') {
      message = `*🍛 BIRIYANI CHALLENGE ORDER CONFIRMED!*
----------------------------------
Hi *${order.name}*, your order *${order._id}* is successfully *CONFIRMED*!

*Order Details:*
- Quantity: ${order.packs} x ${order.packType === 'family' ? 'Family Pack' : 'One Pack'}
- Total Amount: ₹${order.total}
- Delivery Location: ${order.place}
- Delivery Date: *2026 June 11 (Thursday)*

Thank you so much for supporting *Sahithyolsav 2026 Cultural Event*!`;
    } else if (type === 'delivery') {
      message = `*🛵 BIRIYANI CHALLENGE OUT FOR DELIVERY!*
----------------------------------
Hi *${order.name}*, good news! Your order *${order._id}* is *OUT FOR DELIVERY* and our delivery boy is on the way to you!

*Summary:*
- Total Amount: *₹${order.total}* (Cash on Delivery)
- Quantity: ${order.packs} x ${order.packType === 'family' ? 'Family Pack' : 'One Pack'}
- Address: ${order.place}

Please keep cash ready. Thank you!`;
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/91${order.phone}?text=${encoded}`, '_blank');
  };

  // Thermal kitchen slips print
  const handlePrintSlip = (order) => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    
    const html = `
      <html>
        <head>
          <title>Kitchen Slip - ${order._id}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; font-size: 14px; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .title { font-size: 18px; font-weight: bold; margin: 0; }
            .details { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .label { font-weight: bold; }
            .total { font-size: 16px; font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 11px; border-top: 2px dashed #000; padding-top: 10px; }
            .note { background: #eee; padding: 10px; border-left: 3px solid #000; margin-top: 10px; font-size: 12px; }
            @media print {
              body { padding: 0; margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 class="title">BIRIYANI CHALLENGE</h2>
            <div style="font-size:11px; margin-top:5px;">Sahithyolsav 2026 | Tirur Division</div>
          </div>
          
          <div class="details">
            <div class="row">
              <span class="label">ORDER ID:</span>
              <span><strong>${order._id}</strong></span>
            </div>
            <div class="row">
              <span class="label">DATE PLACED:</span>
              <span>${new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span class="label">CHALLENGE DATE:</span>
              <span>2026 June 11 (Thursday)</span>
            </div>
            <hr style="border:none; border-top: 1px dashed #000; margin: 10px 0;" />
            <div class="row">
              <span class="label">CUSTOMER:</span>
              <span>${order.name}</span>
            </div>
            <div class="row">
              <span class="label">PHONE:</span>
              <span>${order.phone}</span>
            </div>
            <div class="row">
              <span class="label">LOCATION:</span>
              <span>${order.place}</span>
            </div>
            ${order.area ? `<div class="row"><span class="label">AREA:</span><span>${order.area}</span></div>` : ''}
            
            <hr style="border:none; border-top: 1px dashed #000; margin: 10px 0;" />
            
            <div class="row" style="font-size:16px;">
              <span class="label">ITEMS:</span>
              <span><strong>${order.packs} x ${order.packType === 'family' ? 'Family Pack' : 'Single Pack'}</strong></span>
            </div>
            
            ${order.note && order.note !== 'None' ? `
              <div class="note">
                <strong>Kitchen Note:</strong><br/>
                "${order.note}"
              </div>
            ` : ''}
            
            <div class="row total">
              <span>TOTAL (C.O.D):</span>
              <span>₹${order.total}</span>
            </div>
          </div>
          
          <div class="footer">
            <strong>Thank You for supporting Sahithyolsav 2026</strong>
            <p style="margin:5px 0 0 0;">SSF Tirur Division</p>
          </div>
          
          <div style="text-align:center; margin-top:30px;">
            <button onclick="window.print();" style="padding:10px 20px; font-weight:bold; cursor:pointer;">Print Slip</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // =========================
  // Metrics calculations
  // =========================
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalSinglePacks = orders
    .filter(o => o.packType === 'single' && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.packs, 0);

  const totalFamilyPacks = orders
    .filter(o => o.packType === 'family' && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.packs, 0);

  const completedOrders = orders.filter(o => o.status === 'Delivered').length;

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const cleanSearch = searchTerm.toLowerCase().trim();
    const matchesSearch =
      order._id.toLowerCase().includes(cleanSearch) ||
      order.name.toLowerCase().includes(cleanSearch) ||
      order.phone.includes(cleanSearch) ||
      order.place.toLowerCase().includes(cleanSearch);

    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesArea = areaFilter === 'All' || order.area === areaFilter;
    const matchesPackType = packTypeFilter === 'All' || order.packType === packTypeFilter;

    return matchesSearch && matchesStatus && matchesArea && matchesPackType;
  });

  // Pin Keypad components
  const handleKeypadPress = (val) => {
    if (val === 'C') {
      setPinInput('');
    } else if (val === 'OK') {
      if (pinInput === '2026' || pinInput === '9744' || pinInput === 'admin123') {
        setIsAuthenticated(true);
        sessionStorage.setItem('biriyani_admin_auth', 'true');
        toast.success('Admin access granted! Welcome back.');
      } else {
        setIsPinError(true);
        setPinInput('');
        toast.error('Invalid PIN. Please try again.');
        setTimeout(() => setIsPinError(false), 500);
      }
    } else {
      if (pinInput.length < 4) {
        const nextInput = pinInput + val;
        setPinInput(nextInput);
        
        // Auto submit if it hits 4 digits and is correct
        if (nextInput === '2026' || nextInput === '9744') {
          setTimeout(() => {
            setIsAuthenticated(true);
            sessionStorage.setItem('biriyani_admin_auth', 'true');
            toast.success('Admin access granted! Welcome back.');
          }, 300);
        }
      }
    }
  };

  // If Not Authenticated, show lock screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0fdf4] flex flex-col items-center justify-center p-4 relative bg-pattern">
        {/* Logo and title */}
        <div className="absolute top-8 left-8">
          <a href="#/" className="font-extrabold text-slate-800 text-lg tracking-wide hover:text-brand-lime flex items-center gap-1.5 transition-colors">
            <span>&larr;</span>
            <span>ബിരിയാണി ചലഞ്ച്</span>
          </a>
        </div>

        <motion.div
          animate={isPinError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full bg-white/90 border border-green-200/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-brand-lime/10 text-brand-lime rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-lime/20 shadow-md">
            <Lock size={32} />
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-1">Admin Portal Access</h1>
          <p className="text-slate-500 text-xs font-semibold mb-6">Enter secure 4-digit PIN to access orders dashboard</p>

          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="password"
                readOnly
                value={pinInput}
                placeholder="&bull; &bull; &bull; &bull;"
                className="w-full bg-green-50/40 border-2 border-green-150 rounded-2xl py-4 text-center text-3xl tracking-widest text-brand-lime font-black focus:outline-none focus:border-brand-lime shadow-inner"
              />
            </div>

            {/* Custom Interactive Passcode Keypad */}
            <div className="grid grid-cols-3 gap-3.5 max-w-[260px] mx-auto mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  className="bg-white hover:bg-green-50/50 border border-green-100 text-slate-800 font-extrabold text-xl py-3 rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('C')}
                className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 font-extrabold text-sm py-3 rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="bg-white hover:bg-green-50/50 border border-green-100 text-slate-800 font-extrabold text-xl py-3 rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('OK')}
                className="bg-brand-lime/10 hover:bg-brand-lime/20 border border-brand-lime/20 text-brand-lime font-extrabold text-sm py-3 rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                OK
              </button>
            </div>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Tip: default pin is <strong className="text-brand-lime font-extrabold">2026</strong> or use <strong className="text-slate-650">admin123</strong>
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4fbf7] flex flex-col text-slate-800 bg-pattern">
      {/* NAVBAR */}
      <nav className="bg-[#f0fdf4]/90 border-b border-green-200/45 py-4 px-6 sticky top-0 z-40 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-brand-lime text-white font-black text-xs px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm shadow-brand-lime/15 animate-pulse">Admin</span>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>ബിരിയാണി ചലഞ്ച്</span>
              <span className="text-slate-400 text-sm font-semibold">Dashboard</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#/"
              className="bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 shadow-sm"
            >
              &larr; View Website
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-100 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* DASHBOARD CONTENT */}
      <main className="flex-grow p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* METRIC KPI CARDS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Revenue */}
          <div className="bg-white border border-green-200/35 rounded-3xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-green-200/80 transition-all">
            <div className="w-12 h-12 bg-brand-lime/10 text-brand-lime rounded-2xl flex items-center justify-center border border-brand-lime/20 shadow-inner">
              <DollarSign size={24} />
            </div>
            <div>
              <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <span className="text-2xl font-black text-slate-900">₹{totalRevenue}</span>
            </div>
            <div className="absolute right-0 bottom-0 text-brand-lime/5 transform translate-y-3 translate-x-3 pointer-events-none group-hover:scale-110 transition-transform">
              <DollarSign size={80} />
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white border border-green-200/35 rounded-3xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-green-200/80 transition-all">
            <div className="w-12 h-12 bg-blue-50 text-blue-550 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
              <Package size={24} />
            </div>
            <div>
              <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <span className="text-2xl font-black text-slate-900">{orders.length}</span>
            </div>
            <div className="absolute right-0 bottom-0 text-blue-500/5 transform translate-y-3 translate-x-3 pointer-events-none group-hover:scale-110 transition-transform">
              <Package size={80} />
            </div>
          </div>

          {/* Card 3: Servings Sold */}
          <div className="bg-white border border-green-200/35 rounded-3xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-green-200/80 transition-all">
            <div className="w-12 h-12 bg-purple-50 text-purple-550 rounded-2xl flex items-center justify-center border border-purple-100 shadow-inner">
              <FileText size={24} />
            </div>
            <div>
              <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Total Servings</span>
              <span className="text-2xl font-black text-slate-900">{totalSinglePacks + (totalFamilyPacks * 5)} Packs</span>
              <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                Single: {totalSinglePacks} | Family: {totalFamilyPacks}
              </span>
            </div>
            <div className="absolute right-0 bottom-0 text-purple-500/5 transform translate-y-3 translate-x-3 pointer-events-none group-hover:scale-110 transition-transform">
              <FileText size={80} />
            </div>
          </div>

          {/* Card 4: Completion Rate */}
          <div className="bg-white border border-green-200/35 rounded-3xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-green-200/80 transition-all">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner">
              <Check size={24} />
            </div>
            <div>
              <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Delivered Orders</span>
              <span className="text-2xl font-black text-slate-900">{completedOrders}</span>
              <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                Rate: {orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0}% Completion
              </span>
            </div>
            <div className="absolute right-0 bottom-0 text-emerald-500/5 transform translate-y-3 translate-x-3 pointer-events-none group-hover:scale-110 transition-transform">
              <Check size={80} />
            </div>
          </div>

        </section>

        {/* CONTROLS BAR: SEARCH, MODALS, UTILITIES */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-green-200/30 rounded-3xl p-5 shadow-sm">
          
          {/* Left search */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Name, Phone, ID, Landmark..."
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime font-semibold text-sm placeholder-slate-450 shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Right utility buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-green-50 hover:bg-green-100 text-brand-lime border border-green-200/40 font-extrabold text-xs px-4 py-3 rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <MessageSquare size={16} />
              Import WhatsApp Text
            </button>

            {/* Add Manual Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-brand-lime hover:bg-[#a3e635] text-white font-black text-xs px-5 py-3 rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-brand-lime/10"
            >
              <Plus size={16} />
              Add Local Order
            </button>

            {/* Export CSV Button */}
            <button
              onClick={downloadCSV}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-xs px-4 py-3 rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download size={16} />
              Export CSV Excel
            </button>

            {/* Reset database */}
            <button
              onClick={handleResetDatabase}
              className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 font-extrabold text-xs px-3 py-3 rounded-2xl transition-all cursor-pointer shadow-sm"
              title="Reset Database"
            >
              <Trash2 size={16} />
            </button>

          </div>

        </section>

        {/* TAB & DROPDOWN FILTERS */}
        <section className="bg-white border border-green-200/25 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Status Tab list */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-100 w-full md:w-auto">
            {['All', 'Pending', 'Confirmed', 'Cooking', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-brand-lime text-white shadow shadow-brand-lime/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Area & Pack filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full md:w-auto">
            
            {/* Area Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-bold">Area:</span>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-lime flex-grow sm:flex-grow-0 shadow-sm"
              >
                <option value="All">All Areas</option>
                {AREAS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Pack Type Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-bold">Packs:</span>
              <select
                value={packTypeFilter}
                onChange={(e) => setPackTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-lime flex-grow sm:flex-grow-0 shadow-sm"
              >
                <option value="All">All Types</option>
                <option value="single">Single Packs (₹100)</option>
                <option value="family">Family Packs (₹500)</option>
              </select>
            </div>

          </div>

        </section>

        {/* ORDERS LIST CONTAINER */}
        <section className="bg-white border border-green-200/25 rounded-3xl shadow-sm overflow-hidden">
          
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span>Orders Database</span>
              <span className="bg-green-50 text-brand-lime font-black text-xs px-2.5 py-0.5 rounded-full border border-green-100">
                {filteredOrders.length} showing
              </span>
            </h3>
            
            {statusFilter !== 'All' || areaFilter !== 'All' || packTypeFilter !== 'All' || searchTerm ? (
              <button
                onClick={() => {
                  setStatusFilter('All');
                  setAreaFilter('All');
                  setPackTypeFilter('All');
                  setSearchTerm('');
                }}
                className="text-xs text-brand-lime hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                Clear Filters
              </button>
            ) : null}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <AlertCircle size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-700">No orders match filters</h4>
              <p className="text-slate-450 text-xs mt-1 max-w-sm mx-auto font-semibold">
                Try clearing search terms or import a customer WhatsApp order notification to see data here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/55 text-slate-450 font-bold text-xs uppercase border-b border-slate-100">
                    <th className="py-4 px-6">ID & Placed At</th>
                    <th className="py-4 px-6">Customer Info</th>
                    <th className="py-4 px-6">Delivery Address</th>
                    <th className="py-4 px-6">Packs & Total</th>
                    <th className="py-4 px-6">Order Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredOrders.map((order) => {
                    
                    // Determine Status pill style
                    let pillColor = 'bg-amber-50 text-amber-700 border border-amber-200/50';
                    if (order.status === 'Confirmed') pillColor = 'bg-blue-50 text-blue-700 border border-blue-200/50';
                    if (order.status === 'Cooking') pillColor = 'bg-purple-50 text-purple-700 border border-purple-200/50';
                    if (order.status === 'Out for Delivery') pillColor = 'bg-teal-50 text-teal-700 border border-teal-200/50';
                    if (order.status === 'Delivered') pillColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
                    if (order.status === 'Cancelled') pillColor = 'bg-rose-50 text-rose-700 border border-rose-200/50';

                    return (
                      <tr key={order._id} className="hover:bg-slate-50/40 transition-colors">
                        
                        {/* Column 1: Order ID */}
                        <td className="py-4.5 px-6">
                          <span className="block font-black text-slate-900 text-sm">{order._id}</span>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase mt-1">
                            {new Date(order.createdAt).toLocaleDateString()} &bull; {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        {/* Column 2: Customer */}
                        <td className="py-4.5 px-6">
                          <span className="block font-black text-slate-800 text-sm">{order.name}</span>
                          <a
                            href={`tel:${order.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] text-[#0284c7] font-bold mt-1.5 hover:underline"
                          >
                            <Phone size={10} />
                            {order.phone}
                          </a>
                        </td>

                        {/* Column 3: Address */}
                        <td className="py-4.5 px-6 max-w-[240px]">
                          <span className="block font-bold text-slate-650 text-xs truncate" title={order.place}>
                            {order.place}
                          </span>
                          <div className="flex items-center gap-2 mt-1.5">
                            {order.area && (
                              <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                {order.area}
                              </span>
                            )}
                            {order.googleMapsLink && (
                              <a
                                href={order.googleMapsLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-xs text-brand-lime font-black hover:underline"
                              >
                                <MapPin size={10} />
                                View Map
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Column 4: Quantity */}
                        <td className="py-4.5 px-6">
                          <span className="block font-black text-slate-900 text-sm">
                            {order.packs} Pack{order.packs > 1 ? 's' : ''}
                          </span>
                          <span className="block text-[10px] text-slate-450 font-extrabold uppercase mt-0.5">
                            {order.packType === 'family' ? 'Family Pack (₹500)' : 'Single Pack (₹100)'}
                          </span>
                          <span className="block text-brand-lime font-black text-sm mt-1">₹{order.total}</span>
                        </td>

                        {/* Column 5: Status */}
                        <td className="py-4.5 px-6">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-block text-center font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full max-w-[120px] ${pillColor}`}>
                              {order.status}
                            </span>
                            
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-[11px] font-bold rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-brand-lime max-w-[120px]"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Cooking">Cooking</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>

                        {/* Column 6: Actions */}
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            
                            {/* WhatsApp Updates Dropdown */}
                            <div className="relative group/wa">
                              <button className="p-2 bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/20 text-[#128c7e] rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm">
                                <MessageSquare size={14} />
                              </button>
                              <div className="absolute right-0 bottom-full mb-1 z-35 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 w-44 hidden group-hover/wa:block animate-in fade-in slide-in-from-bottom-1 duration-150 text-left">
                                <span className="block px-3 py-1.5 text-[9px] text-slate-400 font-extrabold uppercase border-b border-slate-100">
                                  WhatsApp Update
                                </span>
                                <button
                                  onClick={() => sendWhatsAppStatusUpdate(order, 'confirm')}
                                  className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                  Order Confirmed
                                </button>
                                <button
                                  onClick={() => sendWhatsAppStatusUpdate(order, 'delivery')}
                                  className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                  Out For Delivery
                                </button>
                              </div>
                            </div>

                            {/* Print Slip */}
                            <button
                              onClick={() => handlePrintSlip(order)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-650 active:scale-95 transition-all cursor-pointer shadow-sm"
                              title="Print Kitchen Slip"
                            >
                              <Printer size={14} />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteOrder(order._id)}
                              className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-red-550 active:scale-95 transition-all cursor-pointer shadow-sm"
                              title="Delete Order"
                            >
                              <Trash2 size={14} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE FOOTER SUMMARY */}
          <div className="p-4 bg-slate-55/60 border-t border-slate-100 text-slate-400 text-xs font-bold flex justify-between items-center">
            <span>Showing {filteredOrders.length} of {orders.length} orders</span>
            {filteredOrders.length > 0 && (
              <span className="text-brand-lime font-black text-sm">
                Subtotal Value: ₹{filteredOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0)}
              </span>
            )}
          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-slate-200 mt-12 bg-white text-center text-xs text-slate-400 font-bold shadow-inner">
        <span>&copy; {new Date().getFullYear()} Biriyani Challenge Admin. SSF Tirur Division.</span>
      </footer>

      {/* MODAL 1: WHATSAPP COPY-PASTE IMPORTER */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-green-100 relative text-slate-800"
            >
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportText('');
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-lime/10 text-brand-lime rounded-xl flex items-center justify-center border border-brand-lime/20 shadow-inner">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Import from WhatsApp</h3>
                  <p className="text-slate-450 text-xs font-semibold">Paste the copied WhatsApp order details text here</p>
                </div>
              </div>

              <form onSubmit={handleImportTextSubmit} className="space-y-4">
                <div>
                  <textarea
                    rows="8"
                    required
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste order message received on WhatsApp here... e.g.&#10;*Order ID:* BC-670560&#10;*Customer Name:* John Doe&#10;*Phone Number:* 9876543210..."
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:border-brand-lime text-slate-700 placeholder-slate-400 shadow-inner"
                  />
                </div>

                <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 text-[10px] text-slate-500 font-bold space-y-1">
                  <span className="block text-brand-lime font-black uppercase tracking-wider mb-1">How it works:</span>
                  <p>1. Copy the exact order receipt you received on your WhatsApp.</p>
                  <p>2. Paste the text here. Our system will automatically parse the ID, Name, Phone, Area, Quantity, Maps link, and Notes.</p>
                  <p>3. If the order already exists in your table, it updates; otherwise, it appends a new row!</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-lime hover:bg-brand-yellow text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
                >
                  <Check size={18} />
                  Parse & Import Order
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD MANUAL LOCAL ORDER */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-green-100 relative text-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-lime/10 text-brand-lime rounded-xl flex items-center justify-center border border-brand-lime/20 shadow-inner">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Add New Order</h3>
                  <p className="text-slate-450 text-xs font-semibold">Manually record an order in your local database</p>
                </div>
              </div>

              <form onSubmit={handleAddOrder} className="space-y-4 text-xs font-bold text-slate-600">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-slate-500 mb-1.5">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={newOrderForm.name}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime shadow-inner"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-slate-500 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newOrderForm.phone}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9+\s()-]/g, '') }))}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime shadow-inner"
                    />
                  </div>

                  {/* Place */}
                  <div>
                    <label className="block text-slate-500 mb-1.5">Delivery Place/Landmark *</label>
                    <input
                      type="text"
                      required
                      value={newOrderForm.place}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, place: e.target.value }))}
                      placeholder="e.g. Near Town Masjid"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime shadow-inner"
                    />
                  </div>

                  {/* Area Dropdown */}
                  <div>
                    <label className="block text-slate-500 mb-1.5">Area (Optional)</label>
                    <select
                      value={newOrderForm.area}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, area: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-brand-lime shadow-sm"
                    >
                      <option value="">Select Area</option>
                      {AREAS.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  {/* Package Type */}
                  <div>
                    <label className="block text-slate-500 mb-1.5">Package Type</label>
                    <select
                      value={newOrderForm.packType}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, packType: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-brand-lime shadow-sm"
                    >
                      <option value="single">Single Pack (₹100)</option>
                      <option value="family">Family Pack (₹500)</option>
                    </select>
                  </div>

                  {/* Packs quantity */}
                  <div>
                    <label className="block text-slate-500 mb-1.5">Quantity (Packs)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newOrderForm.packs}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, packs: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime shadow-inner"
                    />
                  </div>

                  {/* Coordinates Map Link */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1.5">Google Maps Link (Optional)</label>
                    <input
                      type="url"
                      value={newOrderForm.googleMapsLink}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, googleMapsLink: e.target.value }))}
                      placeholder="e.g. https://www.google.com/maps?q=10.12,75.98"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime shadow-inner"
                    />
                  </div>

                  {/* Note */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1.5">Special Notes (Optional)</label>
                    <textarea
                      rows="2"
                      value={newOrderForm.note}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="e.g. Deliver before 1 PM"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-brand-lime shadow-inner"
                    />
                  </div>

                  {/* Initial Status */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1.5">Initial Status</label>
                    <select
                      value={newOrderForm.status}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-brand-lime shadow-sm"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cooking">Cooking</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-brand-lime hover:bg-brand-yellow text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
                  >
                    <Plus size={18} />
                    Insert Local Order Record
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
