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
      trim: true,
      required: function() {
        return this.orderType === 'dine-in';
      }
    },
    customerName: {
      type: String,
      trim: true,
      required: [true, 'Customer name is required']
    },
    phoneNumber: {
      type: String,
      trim: true,
      required: function() {
        return this.orderType === 'home-delivery';
      }
    },
    deliveryAddress: {
      type: String,
      trim: true,
      required: function() {
        return this.orderType === 'home-delivery';
      }
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
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, 'Delivery fee cannot be negative']
    },
    status: {
      type: String,
      default: 'pending',
      enum: {
        values: ['pending', 'preparing', 'served', 'completed', 'out-for-delivery', 'delivered'],
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
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash-on-delivery', 'online-payment', 'card'],
        message: '{VALUE} is not a valid payment method'
      },
      required: function() {
        return this.orderType === 'home-delivery';
      }
    },
    paymentStatus: {
      type: String,
      default: 'pending',
      enum: ['pending', 'paid', 'failed']
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