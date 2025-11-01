// backend/src/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number is required'],
      trim: true
    },
    customerName: {
      type: String,
      trim: true
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: [true, 'Menu item reference is required']
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: [1, 'Quantity must be at least 1']
        },
        price: {
          type: Number,
          required: [true, 'Item price is required'],
          min: [0, 'Price cannot be negative']
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    status: {
      type: String,
      default: 'pending',
      enum: {
        values: ['pending', 'preparing', 'served', 'completed'],
        message: '{VALUE} is not a valid status'
      }
    },
    orderType: {
      type: String,
      default: 'dine-in',
      enum: {
        values: ['dine-in', 'home-delivery'],
        message: '{VALUE} is not a valid order type'
      }
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

export default mongoose.model('Order', orderSchema);