import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  place: {
    type: String,
    required: true,
    trim: true,
  },
  area: {
    type: String,
    default: '',
  },
  packType: {
    type: String,
    required: false,
    default: 'single',
  },
  packs: {
    type: Number,
    required: false,
    default: 1,
  },
  singlePacks: {
    type: Number,
    default: 0,
  },
  familyPacks: {
    type: Number,
    default: 0,
  },
  singleTotal: {
    type: Number,
    default: 0,
  },
  familyTotal: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
    default: 'None',
  },
  googleMapsLink: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Confirmed', 'Cooking', 'Out for Delivery', 'Delivered', 'Cancelled'],
  },
  paymentStatus: {
    type: String,
    default: 'Not Paid',
    enum: ['Not Paid', 'Advance Paid', 'Fully Paid', 'Pending', 'Paid', 'Failed'],
  },
  advanceAmount: {
    type: Number,
    default: 0,
  },
  remainingAmount: {
    type: Number,
    default: 0,
  },
  agentName: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
