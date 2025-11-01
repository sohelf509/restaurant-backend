import express from "express";
import { registerAdmin, loginAdmin } from "../controllers/adminController.js";

const router = express.Router();

router.post("/register", registerAdmin); // Create admin (only once)
router.post("/login", loginAdmin); // Admin login

export default router;
