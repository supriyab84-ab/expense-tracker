const User = require("../models/User");
const bcrypt = require("bcryptjs");

// =========================
// REGISTER USER
// =========================
const registerUser = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all fields"
      });
    }

    // Clean input
    name = name.trim();
    email = email.trim().toLowerCase();

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Send response
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
      message: "Registration failed"
    });
  }
};


// =========================
// LOGIN USER
// =========================
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password"
      });
    }

    // Clean email
    email = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email });

    // User not found
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Login successful
    res.status(200).json({
      message: "Login successful",

      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Login failed"
    });
  }
};


// =========================
// EXPORT
// =========================
module.exports = {
  registerUser,
  loginUser
};