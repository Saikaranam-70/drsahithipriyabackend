// model/Testimonial.js
const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  feedback: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Testimonial", testimonialSchema);
