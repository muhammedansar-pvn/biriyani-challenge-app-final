const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const { name, phone, place, packs, note, packType, area, latitude, longitude, googleMapsLink } = req.body;

    if (!name || !phone || !place || !packs) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Calculate total based on packType (₹100 for single, ₹500 for family)
    const pricePerPack = packType === 'family' ? 500 : 100;
    const total = packs * pricePerPack;

    const order = await Order.create({
      name,
      phone,
      place,
      packs,
      total,
      note,
      packType: packType || 'single',
      area: area || '',
      latitude: latitude || null,
      longitude: longitude || null,
      googleMapsLink: googleMapsLink || '',
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin)
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }); // Newest first
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get orders by phone number (public tracking)
// @route   GET /api/orders/track/:phone
// @access  Public
const getOrdersByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a phone number' });
    }
    const orders = await Order.find({ phone }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  deleteOrder,
  getOrdersByPhone,
};
