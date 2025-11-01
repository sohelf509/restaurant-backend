// backend/src/routes/menuRoutes.js
import express from 'express';
import MenuItem from '../models/MenuItem.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
import { upload, cloudinary } from '../src/config/cloudinary.js';

const router = express.Router();

// GET /api/menu - Fetch all menu items
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.status(200).json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: error.message
    });
  }
});

// POST /api/menu - Add a new menu item with image upload
router.post('/', protectAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, isAvailable } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a non-negative number'
      });
    }

    // Get image URL from Cloudinary upload
    const imageUrl = req.file ? req.file.path : null;

    const menuItem = new MenuItem({
      name,
      price: priceNum,
      description,
      category,
      imageUrl,
      isAvailable: isAvailable === 'true' || isAvailable === true
    });

    const savedItem = await menuItem.save();

    res.status(201).json({
      success: true,
      data: savedItem
    });
  } catch (error) {
    // If there's an error and image was uploaded, delete it from Cloudinary
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    
    res.status(400).json({
      success: false,
      message: 'Failed to create menu item',
      error: error.message
    });
  }
});

// PUT /api/menu/:id - Update a menu item by ID with optional image upload
router.patch('/:id', protectAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Validate price if provided
    if (updates.price !== undefined) {
      const priceNum = parseFloat(updates.price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a non-negative number'
        });
      }
      updates.price = priceNum;
    }

    // Handle isAvailable conversion
    if (updates.isAvailable !== undefined) {
      updates.isAvailable = updates.isAvailable === 'true' || updates.isAvailable === true;
    }

    // Handle image removal
    if (req.body.removeImage === 'true') {
      const oldMenuItem = await MenuItem.findById(id);
      if (oldMenuItem && oldMenuItem.imageUrl) {
        // Delete from Cloudinary
        const urlParts = oldMenuItem.imageUrl.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = `restaurant-menu/${publicIdWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      }
      updates.imageUrl = null; // Remove image URL
    }
    // Handle new image upload
    else if (req.file) {
      // Get old menu item to delete previous image
      const oldMenuItem = await MenuItem.findById(id);
      if (oldMenuItem && oldMenuItem.imageUrl) {
        // Extract public_id from Cloudinary URL and delete
        const urlParts = oldMenuItem.imageUrl.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = `restaurant-menu/${publicIdWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      }
      
      updates.imageUrl = req.file.path;
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message
    });
  }
});

// DELETE /api/menu/:id - Delete a menu item by ID
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (deletedItem.imageUrl) {
      const urlParts = deletedItem.imageUrl.split('/');
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = `restaurant-menu/${publicIdWithExt.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      data: deletedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message
    });
  }
});

export default router;