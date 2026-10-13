const mongoose = require('mongoose');
const { Schema } = mongoose;

const serviceSchema = new Schema(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'], index: true },
    title: { type: String, required: [true, 'Service title is required'], trim: true, maxlength: 100 },
    description: { type: String, required: [true, 'Service description is required'], trim: true, maxlength: 1000 },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    duration: { type: Number, required: [true, 'Duration is required'], min: [15, 'Duration must be at least 15 minutes'] },
    image: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
