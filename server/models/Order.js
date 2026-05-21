const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    place: {
      type: String,
      required: [true, 'Please add a place'],
    },
    packs: {
      type: Number,
      required: [true, 'Please add number of packs'],
      min: [1, 'At least 1 pack is required'],
    },
    total: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    packType: {
      type: String,
      enum: ['single', 'family'],
      default: 'single',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'half', 'full'],
      default: 'full',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'pending'],
      default: 'pending',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
