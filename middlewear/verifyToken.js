const jwt = require('jsonwebtoken');
const dotEnv = require('dotenv');
const Doctor = require('../model/Doctor');

dotEnv.config();
const secretKey = process.env.JWT_SECRET;

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.token || req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Token not provided" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    const { id } = jwt.verify(token, secretKey);

    const doctor = await Doctor.findById(id).lean();
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    req.doctorId = doctor._id;
    next();
  } catch (error) {
    console.error(error.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = { verifyToken };
