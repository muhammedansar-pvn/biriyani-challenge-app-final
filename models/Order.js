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
    required: true,
    enum: ['single', 'family'],
  },
  packs: {
    type: Number,
    required: true,
    min: 1,
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
    default: 'Pending',
    enum: ['Pending', 'Paid', 'Failed'],
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
