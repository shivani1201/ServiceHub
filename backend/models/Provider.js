const mongoose = require('mongoose');
const { Schema } = mongoose;

const providerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: [true, 'Provider name is required'], trim: true, maxlength: 60 },
    email: { type: String, required: [true, 'Provider email is required'], lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    profileImage: { type: String, default: '' },
    bio: { type: String, trim: true, default: '', maxlength: 600 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    experience: { type: Number, default: 0, min: [0, 'Experience cannot be negative'] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isActive: { type: Boolean, default: true },
    availability: {
      days: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '18:00' },
    },
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Provider', providerSchema);
