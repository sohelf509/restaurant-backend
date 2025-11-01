import express from 'express';
import Table from '../models/Table.js';
import QRCode from 'qrcode';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/tables - Create a new table
router.post('/', protectAdmin, async (req, res) => {
  try {
    const { tableNumber } = req.body;

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Table number is required'
      });
    }

    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: `Table ${tableNumber} already exists`
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const orderUrl = `${frontendUrl}/order?table=${tableNumber}`;

    const qrCodeUrl = await QRCode.toDataURL(orderUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const table = new Table({
      tableNumber,
      qrCodeUrl
    });

    const savedTable = await table.save();

    res.status(201).json({
      success: true,
      data: savedTable
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create table',
      error: error.message
    });
  }
});

// GET /api/tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.status(200).json({
      success: true,
      data: tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tables',
      error: error.message
    });
  }
});

// GET /api/tables/:tableNumber
router.get('/:tableNumber', async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const table = await Table.findOne({ tableNumber });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table ${tableNumber} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table',
      error: error.message
    });
  }
});

// DELETE /api/tables/:id
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTable = await Table.findByIdAndDelete(id);

    if (!deletedTable) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully',
      data: deletedTable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete table',
      error: error.message
    });
  }
});

export default router;
