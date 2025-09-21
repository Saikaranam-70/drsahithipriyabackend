const express = require('express')
const nodemailer = require('nodemailer')
const dotEnv = require('dotenv')
const cors = require('cors')

const app = express();
app.use(express.json())
dotEnv.config()
app.use(cors())

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

        const mailOptions = {
            from: email,
            to : "saimanikantakaranam682@gmail.com",
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
            to:"saimanikantakaranam682@gmail.com",
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

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});

app.get('/', async(req, res)=>{
    res.send("<h1>Dr. B. Sahithi Priya</h1>")
})