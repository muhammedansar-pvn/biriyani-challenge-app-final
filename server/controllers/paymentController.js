const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Public
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, packs, paymentMethod } = req.body;

    let finalAmount = amount;

    // Securely calculate amount on backend if packs and paymentMethod are provided
    if (!finalAmount && packs) {
      const PRICE_PER_PACK = 100;
      const total = packs * PRICE_PER_PACK;
      finalAmount = paymentMethod === 'full' 
        ? total 
        : paymentMethod === 'half' 
          ? Math.round(total / 2) 
          : 0;
    }

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const options = {
      amount: finalAmount * 100, // Razorpay expects amount in paise (₹1 = 100 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order', error: error.message, details: error.error || error });
  }
};

// @desc    Verify payment and save order
// @route   POST /api/payment/verify
// @access  Public
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Payment is verified — save order to DB
    const { name, phone, place, packs, note, paymentMethod } = orderData;
    const pricePerPack = 100;
    const total = packs * pricePerPack;
    const amountPaid = paymentMethod === 'half' ? Math.round(total / 2) : total;

    const order = await Order.create({
      name,
      phone,
      place,
      packs,
      total,
      note,
      paymentMethod: paymentMethod || 'full',
      paymentStatus: paymentMethod === 'half' ? 'partial' : 'paid',
      amountPaid,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    });

    res.status(201).json({
      success: true,
      message: 'Payment verified and order placed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Place COD order (no payment)
// @route   POST /api/payment/cod
// @access  Public
const placeCodOrder = async (req, res) => {
  try {
    const { name, phone, place, packs, note } = req.body;

    if (!name || !phone || !place || !packs) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const pricePerPack = 100;
    const total = packs * pricePerPack;

    const order = await Order.create({
      name,
      phone,
      place,
      packs,
      total,
      note,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      amountPaid: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Cash on Delivery order placed successfully',
      data: order,
    });
  } catch (error) {
    console.error('COD order error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  placeCodOrder,
};
