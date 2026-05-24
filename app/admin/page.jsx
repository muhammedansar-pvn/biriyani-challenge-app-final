"use client";

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
  // Authentication State (Safely wrapped in useEffect for SSR/Hydration prevention)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isPinError, setIsPinError] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    note: 'None',
    googleMapsLink: '',
    status: 'Pending',
    paymentStatus: 'Pending',
    agentName: ''
  });

  // Handle Hydration / Check localStorage Auth on mount
  useEffect(() => {
    const isAuth = localStorage.getItem('biriyani_admin_auth') === 'true';
    setIsAuthenticated(isAuth);
  }, []);

  // Physical keyboard listener for secure PIN input pad
  useEffect(() => {
    if (isAuthenticated) return;

    const handleKeyDown = (e) => {
      // Bypass if modifier keys are pressed (e.g., Ctrl + C, Cmd + R)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key >= '0' && e.key <= '9') {
        if (pinInput.length < 4) {
          const nextInput = pinInput + e.key;
          setPinInput(nextInput);
          
          if (nextInput === '2026' || nextInput === '9744') {
            setTimeout(() => {
              setIsAuthenticated(true);
              localStorage.setItem('biriyani_admin_auth', 'true');
              toast.success('Admin access granted! Welcome back.');
            }, 300);
          }
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        setPinInput('');
      } else if (e.key === 'Enter') {
        if (pinInput === '2026' || pinInput === '9744') {
          setIsAuthenticated(true);
          localStorage.setItem('biriyani_admin_auth', 'true');
          toast.success('Admin access granted! Welcome back.');
        } else {
          setIsPinError(true);
          setPinInput('');
          toast.error('Invalid PIN. Please try again.');
          setTimeout(() => setIsPinError(false), 500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, pinInput]);

  // Poll database for orders in real-time
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to retrieve orders');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error("Failed to poll orders from MongoDB:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    // Poll every 4 seconds to sync mobile and laptop screens instantly
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle on-screen keypad button presses
  const handleKeypadPress = (key) => {
    if (key === 'C') {
      setPinInput('');
      return;
    }
    if (key === 'OK') {
      handlePinSubmit();
      return;
    }
    if (pinInput.length < 4) {
      const nextInput = pinInput + key;
      setPinInput(nextInput);
      if (nextInput === '2026' || nextInput === '9744') {
        setTimeout(() => {
          setIsAuthenticated(true);
          localStorage.setItem('biriyani_admin_auth', 'true');
          toast.success('Admin access granted! Welcome back.');
        }, 300);
      }
    }
  };

  // Handle PIN entry
  const handlePinSubmit = (e) => {
    if (e) e.preventDefault();
    if (pinInput === '2026' || pinInput === '9744' || pinInput === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('biriyani_admin_auth', 'true');
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
    localStorage.removeItem('biriyani_admin_auth');
    toast.info('Logged out from Admin Portal.');
  };

  // =========================
  // WhatsApp Order Parsing RegExp
  // =========================
  const handleImportTextSubmit = async (e) => {
    e.preventDefault();
    if (!importText.trim()) {
      toast.error('Please paste order text first.');
      return;
    }

    try {
      const normalizedText = importText.replace(/\r\n/g, '\n').trim();

      const idMatch = normalizedText.match(/(?:Order ID|ID):\*?\s*(BC-\d+)/i);
      const nameMatch = normalizedText.match(/(?:Customer Name|👤 \*?Name\*?):\*?\s*(.+)/i);
      const phoneMatch = normalizedText.match(/(?:Phone Number|📞 \*?Phone\*?):\*?\s*([\d\s+\-()]+)/i);
      const placeMatch = normalizedText.match(/(?:Location\/Place|📍 \*?Location\*?):\*?\s*(.+)/i);
      const areaMatch = normalizedText.match(/(?:Area|🗺️ \*?Area\*?):\*?\s*(.+)/i);
      const noteMatch = normalizedText.match(/(?:Special Notes|📝 \*?Notes\*?):\*?\s*(.+)/i);
      const agentMatch = normalizedText.match(/(?:Agent Name\/Code|Agent|👤 \*?Agent\*?):\*?\s*(.+)/i);
      
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

      const existingOrder = orders.find(o => o._id === orderId);

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
        status: existingOrder ? (existingOrder.status || 'Pending') : 'Pending',
        paymentStatus: existingOrder ? (existingOrder.paymentStatus || 'Pending') : 'Pending',
        createdAt: existingOrder ? (existingOrder.createdAt || new Date().toISOString()) : new Date().toISOString(),
        agentName: agentMatch ? agentMatch[1].trim() : ''
      };

      if (existingOrder) {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedOrder)
        });
        if (!response.ok) throw new Error('Failed to update imported order');
      } else {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedOrder)
        });
        if (!response.ok) throw new Error('Failed to save imported order');
      }

      toast.success(existingOrder ? `Updated existing order ${orderId}! 🍛` : `Imported new order ${orderId} successfully! 🍛`);
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
  const handleAddOrder = async (e) => {
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
      paymentStatus: newOrderForm.paymentStatus,
      createdAt: new Date().toISOString(),
      agentName: newOrderForm.agentName.trim()
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualOrder)
      });

      if (!response.ok) throw new Error('Failed to create manual order');
      
      toast.success(`Created manual order ${orderId} successfully!`);
      setIsAddModalOpen(false);
      setNewOrderForm({
        name: '',
        phone: '',
        place: '',
        area: '',
        packType: 'single',
        packs: 1,
        note: 'None',
        googleMapsLink: '',
        status: 'Pending',
        paymentStatus: 'Pending',
        agentName: ''
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add manual order.");
    }
  };

  // Update Status of an Order
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update status');

      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
      toast.success(`Order ${id} status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // Update Payment Status of an Order
  const handleUpdatePaymentStatus = async (id, newPayStatus) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPayStatus })
      });
      if (!response.ok) throw new Error('Failed to update payment status');

      setOrders(prev => prev.map(o => o._id === id ? { ...o, paymentStatus: newPayStatus } : o));
      toast.success(`Order ${id} payment updated to ${newPayStatus}`);
    } catch (err) {
      toast.error("Failed to update payment status.");
    }
  };

  // Delete Order
  const handleDeleteOrder = async (id) => {
    if (window.confirm(`Are you sure you want to permanently delete order ${id}?`)) {
      try {
        const response = await fetch(`/api/orders/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete order');

        setOrders(prev => prev.filter(o => o._id !== id));
        toast.info(`Order ${id} deleted.`);
      } catch (err) {
        toast.error("Failed to delete order.");
      }
    }
  };

  // Reset database completely
  const handleResetDatabase = async () => {
    if (window.confirm('WARNING: This will delete ALL orders in the cloud database. Are you absolutely sure?')) {
      if (window.confirm('Double verification: Type CONFIRM below to delete.')) {
        try {
          const response = await fetch('/api/orders', {
            method: 'DELETE'
          });
          if (!response.ok) throw new Error('Failed to reset database');

          setOrders([]);
          toast.error('All orders wiped clean from MongoDB.');
        } catch (err) {
          toast.error("Failed to reset database.");
        }
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
      'Agent Name/Code',
      'Pack Type',
      'Quantity',
      'Total Amount',
      'Note',
      'Google Maps Link',
      'Status',
      'Payment Status',
      'Date Created'
    ];

    const rows = filteredOrders.map(o => [
      o._id,
      `"${o.name.replace(/"/g, '""')}"`,
      o.phone,
      `"${o.place.replace(/"/g, '""')}"`,
      `"${o.area || ''}"`,
      `"${(o.agentName || '').replace(/"/g, '""')}"`,
      o.packType,
      o.packs,
      o.total,
      `"${(o.note || 'None').replace(/"/g, '""')}"`,
      o.googleMapsLink || '',
      o.status,
      o.paymentStatus || 'Pending',
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

  const downloadPDF = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    
    const totalPacksSingle = filteredOrders
      .filter(o => o.packType === 'single' && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.packs, 0);

    const totalPacksFamily = filteredOrders
      .filter(o => o.packType === 'family' && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.packs, 0);

    const revenueVal = filteredOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const activeAreaFilter = areaFilter === 'All' ? 'All Areas' : areaFilter;
    const activeStatusFilter = statusFilter === 'All' ? 'All Statuses' : statusFilter;
    const activePackFilter = packTypeFilter === 'All' ? 'All Types' : (packTypeFilter === 'single' ? 'Single Packs' : 'Family Packs');

    const orderRowsHtml = filteredOrders.map((o, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${o._id}</strong></td>
        <td>
          <div style="font-weight: bold; color: #111;">${o.name}</div>
          <div style="font-size: 10px; color: #555;">${o.phone}</div>
          ${o.agentName ? `<div style="font-size: 9px; color: #16a34a; font-weight: bold; margin-top: 2px;">Agent: ${o.agentName}</div>` : ''}
        </td>
        <td>
          <div style="font-size: 11px;">${o.place}</div>
          ${o.area ? `<div style="font-size: 9px; color: #777; font-weight: bold; margin-top: 2px;">Area: ${o.area}</div>` : ''}
        </td>
        <td style="text-align: center;">
          <div style="font-weight: bold;">${o.packs} Pack(s)</div>
          <div style="font-size: 9px; color: #666;">${o.packType === 'family' ? 'Family Pack (₹500)' : 'Single Pack (₹100)'}</div>
        </td>
        <td style="text-align: center;">
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; border: 1px solid #ccc; background: #fafafa;">
            ${o.status}
          </span>
          <div style="font-size: 8px; color: #666; margin-top: 3px; font-weight:bold;">Pay: ${o.paymentStatus || 'Pending'}</div>
        </td>
        <td style="text-align: right; font-weight: bold;">₹${o.total}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Biriyani Challenge - Orders Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #333; line-height: 1.4; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #22c55e; padding-bottom: 15px; margin-bottom: 25px; }
            .title-section h1 { font-size: 24px; font-weight: 800; margin: 0; color: #111; }
            .title-section p { font-size: 12px; font-weight: bold; margin: 5px 0 0 0; color: #22c55e; text-transform: uppercase; letter-spacing: 1px; }
            .meta-section { text-align: right; font-size: 11px; color: #555; font-weight: bold; line-height: 1.6; }
            
            .filter-tags { display: flex; gap: 10px; margin-bottom: 20px; font-size: 11px; font-weight: bold; color: #666; }
            .filter-tag { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 8px; border-radius: 6px; color: #166534; }
            
            .kpis-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 15px; text-align: center; }
            .kpi-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { background: #0f172a; color: #fff; font-weight: bold; padding: 10px; text-align: left; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; }
            tr:nth-child(even) { background: #f8fafc; }
            
            .summary-table { margin-top: 20px; border-top: 2px solid #0f172a; font-size: 13px; font-weight: bold; }
            .footer-note { text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 15px; font-weight: bold; }
            
            @media print {
              body { padding: 0; margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="title-section">
              <h1>🍛 BIRIYANI CHALLENGE REPORT</h1>
              <p>SSF Tirur Division Event Crew</p>
            </div>
            <div class="meta-section">
              <div>REPORT DATE: ${new Date().toLocaleDateString()}</div>
              <div>TOTAL DELIVERIES: ${filteredOrders.filter(o => o.status === 'Delivered').length} orders</div>
              <div>CHALLENGE DATE: 2026 June 11</div>
            </div>
          </div>
          
          <div class="filter-tags">
            <span class="filter-tag">Area: ${activeAreaFilter}</span>
            <span class="filter-tag">Status: ${activeStatusFilter}</span>
            <span class="filter-tag">Package: ${activePackFilter}</span>
            ${searchTerm ? `<span class="filter-tag">Search: "${searchTerm}"</span>` : ''}
          </div>
          
          <div class="kpis-grid">
            <div class="kpi-card">
              <div class="kpi-label">TOTAL ORDERS</div>
              <div class="kpi-value">${filteredOrders.length}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">SINGLE PACKS</div>
              <div class="kpi-value">${totalPacksSingle}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">FAMILY PACKS</div>
              <div class="kpi-value">${totalPacksFamily}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">TOTAL REVENUE</div>
              <div class="kpi-value" style="color: #22c55e;">₹${revenueVal}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">Sl</th>
                <th style="width: 12%;">Order ID</th>
                <th style="width: 25%;">Customer Details</th>
                <th style="width: 28%;">Delivery Address</th>
                <th style="width: 15%; text-align: center;">Packs Details</th>
                <th style="width: 12%; text-align: center;">Status</th>
                <th style="width: 13%; text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orderRowsHtml}
              <tr class="summary-table">
                <td colspan="4" style="text-align: right; padding-right: 15px;">TOTAL VALUES FOR THIS REPORT:</td>
                <td style="text-align: center;">
                  ${totalPacksSingle + totalPacksFamily * 5} Packs sold
                  <div style="font-size: 9px; font-weight: normal; color: #666; margin-top: 2px;">
                    Single: ${totalPacksSingle} | Family: ${totalPacksFamily}
                  </div>
                </td>
                <td></td>
                <td style="text-align: right; color: #22c55e; font-size: 14px; font-weight: 900;">₹${revenueVal}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer-note">
            This document is generated dynamically from the SSF Biriyani Challenge Admin Portal. All orders are Cash on Delivery.
            <div style="margin-top: 5px;">&copy; ${new Date().getFullYear()} SSF Tirur Division. All rights reserved.</div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print();" style="padding: 12px 25px; background: #22c55e; border: none; color: #fff; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
              Print / Save as PDF
            </button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

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

  // Metrics calculations
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
      order.place.toLowerCase().includes(cleanSearch) ||
      (order.agentName && order.agentName.toLowerCase().includes(cleanSearch));

    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesArea = areaFilter === 'All' || order.area === areaFilter;
    const matchesPackType = packTypeFilter === 'All' || order.packType === packTypeFilter;

    return matchesSearch && matchesStatus && matchesArea && matchesPackType;
  });

  const handleKeypadPress = (val) => {
    if (val === 'C') {
      setPinInput('');
    } else if (val === 'OK') {
      handlePinSubmit();
    } else {
      if (pinInput.length < 4) {
        const nextInput = pinInput + val;
        setPinInput(nextInput);
        
        if (nextInput === '2026' || nextInput === '9744') {
          setTimeout(() => {
            setIsAuthenticated(true);
            localStorage.setItem('biriyani_admin_auth', 'true');
            toast.success('Admin access granted! Welcome back.');
          }, 300);
        }
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0fdf4] flex flex-col items-center justify-center p-4 relative bg-pattern">
        <div className="absolute top-8 left-8">
          <a href="/" className="font-extrabold text-slate-800 text-lg tracking-wide hover:text-brand-lime flex items-center gap-1.5 transition-colors">
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

          <div className="space-y-6">
            <div className="relative">
              <input
                type="password"
                readOnly
                value={pinInput}
                placeholder="&bull; &bull; &bull; &bull;"
                className="w-full bg-green-50/40 border-2 border-green-150 rounded-2xl py-4 text-center text-3xl tracking-widest text-brand-lime font-black focus:outline-none focus:border-brand-lime shadow-inner"
              />
            </div>

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
                className="bg-green-550 hover:bg-brand-lime text-white border border-green-600 font-extrabold text-xs py-3 rounded-xl active:scale-95 transition-all cursor-pointer shadow-md shadow-green-500/10"
              >
                OK
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark bg-pattern flex flex-col">
      {/* Header bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-100/80 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-xl text-slate-900">
              ബിരിയാണി <span className="text-brand-lime font-black">ചലഞ്ച്</span>
            </span>
            <span className="bg-brand-lime/10 text-brand-lime font-extrabold px-3 py-1 rounded-full text-[10px] uppercase border border-brand-lime/20 tracking-wider">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-green-50 hover:bg-green-100 text-brand-lime font-black text-xs px-4 py-2.5 rounded-xl border border-green-100/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus size={14} />
              Import WhatsApp Order
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-brand-lime hover:bg-brand-yellow text-white font-black text-xs px-4 py-2.5 rounded-xl border-none transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-lime/10"
            >
              <Plus size={14} />
              Create Order
            </button>

            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-black text-xs px-4 py-2.5 rounded-xl border-none transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Unlock size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-5 bg-white">
            <span className="block text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1">Total Revenue</span>
            <span className="text-2xl font-black text-slate-900 flex items-center gap-0.5">
              ₹{totalRevenue}
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-5 bg-white">
            <span className="block text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1">Single Packs Sold</span>
            <span className="text-2xl font-black text-slate-900">{totalSinglePacks} packs</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 bg-white">
            <span className="block text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1">Family Packs Sold</span>
            <span className="text-2xl font-black text-brand-lime">{totalFamilyPacks} packs</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 bg-white">
            <span className="block text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1">Total Deliveries</span>
            <span className="text-2xl font-black text-slate-900">{completedOrders} orders</span>
          </div>
        </div>

        {/* Filter controls panel */}
        <div className="glass-panel rounded-2xl p-6 bg-white space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders (ID, Name, Phone, Place, Agent)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-lime font-semibold"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                onClick={downloadCSV}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download size={13} />
                Export CSV
              </button>

              <button
                onClick={downloadPDF}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileText size={13} />
                Generate PDF
              </button>

              <button
                onClick={handleResetDatabase}
                className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                Reset DB
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3.5 pt-3 border-t border-slate-100">
            {/* Status Filter */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-750 p-2 focus:outline-none focus:border-brand-lime"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cooking">Cooking</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Area Filter */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Area</span>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-750 p-2 focus:outline-none focus:border-brand-lime"
              >
                <option value="All">All Areas</option>
                {AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Package Filter */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Package</span>
              <select
                value={packTypeFilter}
                onChange={(e) => setPackTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-750 p-2 focus:outline-none focus:border-brand-lime"
              >
                <option value="All">All Packages</option>
                <option value="single">Single Pack</option>
                <option value="family">Family Pack</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders list/grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-450 font-bold text-sm">Loading orders from MongoDB Atlas...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-panel rounded-2xl bg-white text-center py-16 px-4">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-900 mb-1">No Orders Found</h3>
            <p className="text-slate-400 text-xs font-medium max-w-sm mx-auto">Try resetting your filter fields or search keywords to locate orders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="glass-panel rounded-2xl p-5 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-all hover:shadow-lg hover:border-green-200"
              >
                <div className="space-y-2 flex-grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900 text-base">{order._id}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      order.packType === 'family' ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20' : 'bg-slate-100 text-slate-650'
                    }`}>
                      {order.packs} x {order.packType === 'family' ? 'Family Pack' : 'One Pack'}
                    </span>
                    {order.agentName && (
                      <span className="text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-full font-black uppercase">
                        Agent: {order.agentName}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" />
                      <span>{order.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <a href={`tel:${order.phone}`} className="hover:underline text-slate-750">{order.phone}</a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{order.place}{order.area ? ` (${order.area})` : ''}</span>
                    </div>
                  </div>

                  {order.note && order.note !== 'None' && (
                    <div className="text-xs bg-slate-50 border border-slate-150/40 rounded-xl p-2.5 text-slate-500 italic max-w-xl">
                      Note: "{order.note}"
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-bold">
                    Placed at: {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-3.5 w-full md:w-auto justify-end">
                  <div className="text-right flex flex-col justify-center gap-1 pr-3 border-r border-slate-150/50 hidden lg:flex">
                    <span className="block font-black text-brand-lime text-lg">₹{order.total}</span>
                    <span className="block text-[9px] text-slate-400 font-black uppercase">C.O.D</span>
                  </div>

                  {/* Status Dropdowns */}
                  <div className="flex flex-col gap-2">
                    {/* Order Status */}
                    <div className="flex items-center justify-between gap-2.5">
                      <span className="text-[9px] text-slate-400 font-black uppercase">Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-750 p-1.5 focus:outline-none focus:border-brand-lime min-w-[130px]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center justify-between gap-2.5">
                      <span className="text-[9px] text-slate-400 font-black uppercase">Payment:</span>
                      <select
                        value={order.paymentStatus || 'Pending'}
                        onChange={(e) => handleUpdatePaymentStatus(order._id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-750 p-1.5 focus:outline-none focus:border-brand-lime min-w-[130px]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex sm:flex-col lg:flex-row items-center gap-2 justify-end w-full sm:w-auto">
                    <div className="flex gap-2 w-full justify-end">
                      <button
                        onClick={() => handlePrintSlip(order)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl cursor-pointer transition-all border-none"
                        title="Print Slip"
                      >
                        <Printer size={15} />
                      </button>

                      <button
                        onClick={() => sendWhatsAppStatusUpdate(order, 'confirm')}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl cursor-pointer transition-all border-none"
                        title="WhatsApp Confirmation"
                      >
                        <Check size={15} />
                      </button>

                      <button
                        onClick={() => sendWhatsAppStatusUpdate(order, 'delivery')}
                        className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-xl cursor-pointer transition-all border-none"
                        title="WhatsApp Out for Delivery"
                      >
                        <ExternalLink size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl cursor-pointer transition-all border-none"
                        title="Delete Order"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MANUAL ORDER ADDITION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-150 relative text-slate-800 my-8"
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border-none bg-transparent"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-950 mb-6 flex items-center gap-2">
              <Plus size={22} className="text-brand-lime" />
              Create Manual Order
            </h3>

            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.name}
                  onChange={(e) => setNewOrderForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-lime font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 font-bold block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newOrderForm.phone}
                    onChange={(e) => setNewOrderForm(p => ({ ...p, phone: e.target.value.replace(/[^0-9+\s()-]/g, '') }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-lime font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-bold block mb-1">Area / Ward</label>
                  <select
                    value={newOrderForm.area}
                    onChange={(e) => setNewOrderForm(p => ({ ...p, area: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-850 focus:outline-none focus:border-brand-lime font-semibold"
                  >
                    <option value="">No Area Select</option>
                    {AREAS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1">Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.place}
                  onChange={(e) => setNewOrderForm(p => ({ ...p, place: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-lime font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 font-bold block mb-1">Packs Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newOrderForm.packs}
                    onChange={(e) => setNewOrderForm(p => ({ ...p, packs: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-lime font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-bold block mb-1">Choose Package</label>
                  <select
                    value={newOrderForm.packType}
                    onChange={(e) => setNewOrderForm(p => ({ ...p, packType: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-850 focus:outline-none focus:border-brand-lime font-semibold"
                  >
                    <option value="single">Single Pack (₹100)</option>
                    <option value="family">Family Pack (₹500)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 font-bold block mb-1">Order Status</label>
                  <select
                    value={newOrderForm.status}
                    onChange={(e) => setNewOrderForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-850 focus:outline-none focus:border-brand-lime font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cooking">Cooking</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-bold block mb-1">Payment Status</label>
                  <select
                    value={newOrderForm.paymentStatus}
                    onChange={(e) => setNewOrderForm(p => ({ ...p, paymentStatus: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-850 focus:outline-none focus:border-brand-lime font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1">Agent Name / Code</label>
                <input
                  type="text"
                  value={newOrderForm.agentName}
                  onChange={(e) => setNewOrderForm(p => ({ ...p, agentName: e.target.value }))}
                  placeholder="e.g. Agent 102 (Optional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-lime font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1">Google Maps Coordinates Link</label>
                <input
                  type="text"
                  value={newOrderForm.googleMapsLink}
                  onChange={(e) => setNewOrderForm(p => ({ ...p, googleMapsLink: e.target.value }))}
                  placeholder="https://google.com/maps/q=..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-lime font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1">Kitchen Notes</label>
                <textarea
                  rows="2"
                  value={newOrderForm.note}
                  onChange={(e) => setNewOrderForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-lime font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-250 text-slate-700 font-extrabold text-xs px-5 py-3 rounded-xl border-none transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-brand-lime hover:bg-brand-yellow text-white font-extrabold text-xs px-6 py-3 rounded-xl border-none transition-all cursor-pointer shadow-md shadow-brand-lime/10"
                >
                  Create Order
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* WHATSAPP ORDER IMPORTER MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-150 relative text-slate-800 my-8"
          >
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border-none bg-transparent"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-950 mb-2 flex items-center gap-2">
              <MessageSquare size={22} className="text-brand-lime" />
              Import Order from WhatsApp
            </h3>
            <p className="text-slate-500 font-bold text-xs mb-4">Paste the customer's WhatsApp order slip below. Our parser will instantly read and save the order details!</p>

            <form onSubmit={handleImportTextSubmit} className="space-y-4">
              <div>
                <textarea
                  rows="8"
                  required
                  placeholder="Paste WhatsApp order details here..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-850 focus:outline-none focus:border-brand-lime font-bold shadow-inner font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setImportText('');
                    setIsImportModalOpen(false);
                  }}
                  className="bg-slate-100 hover:bg-slate-250 text-slate-700 font-extrabold text-xs px-5 py-3 rounded-xl border-none transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-brand-lime hover:bg-brand-yellow text-white font-extrabold text-xs px-6 py-3 rounded-xl border-none transition-all cursor-pointer shadow-md shadow-brand-lime/10"
                >
                  Parse & Import Order
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
