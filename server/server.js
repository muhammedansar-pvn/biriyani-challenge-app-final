const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars BEFORE importing routes (Razorpay needs keys at init)
dotenv.config();

const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Biriyani Challenge API is running...');
});

// Error handler middleware (basic)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
