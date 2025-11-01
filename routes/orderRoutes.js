// backend/src/routes/orderRoutes.js
import express from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/orders - Place a new order
router.post('/', async (req, res) => {
  try {
    const { tableNumber, customerName, userId, items, orderType } = req.body;

    // Validate required fields
    if (!tableNumber || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Table number and items are required'
      });
    }

    // If userId is provided, verify user exists
    if (userId) {
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    // Validate and fetch menu items to get current prices
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item with ID ${item.menuItem} not found`
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Menu item "${menuItem.name}" is not available`
        });
      }

      const quantity = item.quantity || 1;
      const price = menuItem.price;
      
      orderItems.push({
        menuItem: menuItem._id,
        quantity,
        price
      });

      totalAmount += price * quantity;
    }

    // Create new order
    const orderData = {
      tableNumber,
      customerName,
      items: orderItems,
      totalAmount,
      orderType: orderType || 'dine-in'
    };

    // Add user reference if userId is provided
    if (userId) {
      orderData.user = userId;
    }

    const order = new Order(orderData);
    const savedOrder = await order.save();
    
    // Populate menu item details and user info for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('items.menuItem')
      .populate('user', 'name phone');

    res.status(201).json({
      success: true,
      data: populatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// GET /api/orders - Get all orders (sorted by newest first)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// GET /api/orders/:id - Get single order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('items.menuItem')
      .populate('user', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'preparing', 'served', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('items.menuItem')
      .populate('user', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// DELETE /api/orders/:id - Delete an order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      data: deletedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
});

export default router;