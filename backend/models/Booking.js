const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: String, required: [true, 'Date is required'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must look like YYYY-MM-DD'] },
    time: { type: String, required: [true, 'Time is required'], match: [/^\d{2}:\d{2}$/, 'Time must look like HH:MM'] },
    address: { type: String, required: [true, 'Address is required'], trim: true, maxlength: 250 },
    notes: { type: String, trim: true, default: '', maxlength: 500 },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'], default: 'pending' },
    price: { type: Number, default: 0 },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
