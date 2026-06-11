import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  isLocked: {
    type: Boolean,
    default: false,
  },
  closingTime: {
    type: Date,
    default: null,
  },
  customMessage: {
    type: String,
    default: 'Ordering is currently closed for the Biriyani Challenge.',
  }
}, { timestamps: true });

export default mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);
