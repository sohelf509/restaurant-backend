import Admin from "../models/Admin.js";
import { generateToken } from "../utils/generateToken.js";

// Register Admin (only once manually, or via protected route)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: "Admin already exists" });

    const admin = await Admin.create({ name, email, password });
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      const token = generateToken(admin._id);

      // ✅ Save token in a secure HTTP-only cookie
      res.cookie("adminToken", token, {
        httpOnly: true,                       // not accessible via JS
        secure: process.env.NODE_ENV === "production", // only HTTPS in prod
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        admin: { id: admin._id, name: admin.name, email: admin.email },
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
