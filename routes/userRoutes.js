// backend/src/routes/userRoutes.js
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// POST /api/users/register - Register or return existing user
router.post('/register', async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Validate phone number
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ phone });

    if (user) {
      return res.status(200).json({
        success: true,
        message: 'User already exists',
        user
      });
    }

    // Create new user
    user = new User({
      name,
      phone
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
});

// POST /api/users/login - Login with phone number
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find user by phone
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// GET /api/users/:id - Get single user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

export default router;