// backend/src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Basic phone validation - adjust regex based on your needs
          return /^[0-9]{10,15}$/.test(v);
        },
        message: 'Please provide a valid phone number (10-15 digits)'
      }
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('User', userSchema);