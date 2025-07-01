const {UserModel} = require("../models/UserModel"); // ✅ folder is lowercase
const {createSecretToken} = require("../utils/SecretToken"); // ✅ it's default export
const bcrypt = require("bcryptjs");

module.exports.Signup = async (req, res, next) => {
  try {
    const { email, password, username, createdAt } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const user = new UserModel({ email, password, username, createdAt });
    await user.save(); // ✅ triggers pre('save') for password hashing

    const token = createSecretToken(user._id);

   res.cookie("token", token, {
  httpOnly: true,
  secure: true,         // ✅ Required for HTTPS
  sameSite: "None",     // ✅ Allows cross-site cookies (frontend ↔ backend)
});

    // Optional: remove password from response
    const { password: _, ...userData } = user._doc;

    res.status(201).json({
      message: "User signed in successfully",
      success: true,
      user: userData,
    });

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed", error });
  }
};

module.exports.Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ✅ Validate input
    if (!email || !password) {
      return res.json({ message: "All fields are required" });
    }

    // 🔍 Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.json({ message: "Incorrect password or email" });
    }

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ message: "Incorrect password or email" });
    }

    // 🪙 Create token
    const token = createSecretToken(user._id);

    // 🍪 Set cookie
  res.cookie("token", token, {
  httpOnly: true,
  secure: true,         // ✅ Required for HTTPS
  sameSite: "None",     // ✅ Allows cross-site cookies (frontend ↔ backend)
});


    // ✅ Send user data back (excluding password)
    const { password: _, ...userData } = user._doc;

    res.status(201).json({
      message: "User logged in successfully",
      success: true,
      user: userData, // ✅ Include user info like username/email
    });

    next();
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
module.exports.Logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "User logged out successfully", success: true });
};
