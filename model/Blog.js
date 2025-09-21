// model/Blog.js
const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  author: { type: String, default: "Dr. B. Sahithi Priya" } // since only one doctor
});

module.exports = mongoose.model("Blog", blogSchema);
