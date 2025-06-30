const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports.userVerification = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    req.userId = decoded.id; 
    next(); 
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
