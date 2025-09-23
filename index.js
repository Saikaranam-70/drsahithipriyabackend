const express = require('express')
const nodemailer = require('nodemailer')
const dotEnv = require('dotenv')
const cors = require('cors')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require("bcryptjs");


const Doctor = require('./model/Doctor')
const bodyparser = require('body-parser')
const { verifyToken } = require('./middlewear/verifyToken')
const Blog = require('./model/Blog')
const Testimonials = require('./model/Testimonials')

const app = express();

dotEnv.config()
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("MongoDB connected successfully")
}).catch((error)=>console.log(error))

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: process.env.EMAIL,
        pass:process.env.APP_PASSWORD
    }
})

app.post("/send-contact", async(req, res)=>{
    try {
        const {name, email, phone, message} = req.body;
        console.log("hello")
        const mailOptions = {
            from: email,
            to : "sahithi.priya1239@gmail.com",
            replyTo: email,
            subject:`New Contact Message from ${name}`,
            html: `<h2>Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong><br>${message}</p>`
        }
        const info = await transporter.sendMail(mailOptions);
        res.json({success:true, messageId: info.messageId});
    } catch (error) {
        console.error(error);
    res.status(500).json({ success: false, error: error.message });
    }
})

app.post("/send-appointment", async(req, res)=>{
    try {
        const {name, email, phone, date, time} = req.body;
        const mailOptions={
            from:email,
            to:"sahithi.priya1239@gmail.com",
            replyTo: email,  
            subject:`New Appointment Request from ${name}`,
            html:`<h2>Appointment Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>`
        }
        const info = await transporter.sendMail(mailOptions)
        res.json({success:true, messageId:info.messageId});
    } catch (error) {
        console.error(error);
    res.status(500).json({ success: false, error: error.message });
    }
})
// ✅ Register Doctor
app.post('/register-doctor', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    console.log("Register route called");

    let doctor = await Doctor.findOne({ email });
    if (doctor) return res.status(400).json({ message: "Doctor already registered" });

    const existingDoctor = await Doctor.findOne();
    if (existingDoctor) {
      return res.status(400).json({ message: "A doctor is already registered. Only one doctor is allowed." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    doctor = new Doctor({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false // default
    });

    await doctor.save();
    await sendOtp(email, otp);

    res.status(200).json({ message: "OTP sent for verification" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify Registration
app.post("/verify-register", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const doctor = await Doctor.findOne({ email });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    if (doctor.otp !== otp || doctor.otpExpiry < Date.now())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    doctor.otp = null;
    doctor.otpExpiry = null;
    doctor.isVerified = true; // ✅ mark verified
    await doctor.save();

    // const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // block login if not verified
    if (!doctor.isVerified) {
      return res.status(403).json({ message: "Doctor not verified. Please complete registration OTP verification." });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const otp = generateOTP();
    doctor.otp = otp;
    doctor.otpExpiry = Date.now() + 5 * 60 * 1000;
    await doctor.save();

    await sendOtp(email, otp);

    res.status(200).json({ message: "OTP sent for login verification" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify Login
app.post("/verify-login", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const doctor = await Doctor.findOne({ email });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    if (doctor.otp !== otp || doctor.otpExpiry < Date.now())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    doctor.otp = null;
    doctor.otpExpiry = null;
    await doctor.save();

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/blogs/create", verifyToken, async(req, res)=>{
    try {
        const {title, content} = req.body;
        if(!title || !content) return res.status(400).json({ error: "Title and content are required" });
        const blog = new Blog({title, content});
        await blog.save();
        res.status(201).json({ message: "Blog created successfully", blog });
    } catch (error) {
        res.status(500).json({ error: err.message });
    }
})
app.get("/all-blogs", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 }); // newest first
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Blog.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Blog not found" });
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/testimonials/create", async (req, res) => {
  try {
    const { patientName, feedback } = req.body;
    if (!patientName || !feedback) return res.status(400).json({ error: "Patient name and feedback are required" });

    const testimonial = new Testimonials({ patientName, feedback });
    await testimonial.save();
    res.status(201).json({ message: "Testimonial created successfully", testimonial });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/all-testimonials", async (req, res) => {
  try {
    const testimonials = await Testimonials.find().sort({ date: -1 });
    res.status(200).json(testimonials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});

app.get('/', async(req, res)=>{
    res.send("<h1>Dr. B. Sahithi Priya</h1>")
})

const sendOtp = async(email, otp)=>{
    await transporter.sendMail({
    from: `"Doctor Auth" <${process.env.EMAIL}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
  });
}