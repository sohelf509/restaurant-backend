// backend/src/models/MenuItem.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const menuItemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Starters', 'Main Course', 'Desserts', 'Drinks', 'Others'],
    },
    imageUrl: {
      type: String,
      validate: {
        validator: (url) => !url || /^(http|https):\/\/[^ "]+$/.test(url),
        message: 'Invalid image URL',
      },
    },
    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-update `updatedAt` before save
menuItemSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method for available items
menuItemSchema.statics.getAvailable = function () {
  return this.find({ isAvailable: true });
};

const MenuItem = model('MenuItem', menuItemSchema);
export default MenuItem;
