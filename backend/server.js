const express = require('express');
const cors = require('cors'); // Re-adding cors
const dotenv = require('dotenv'); // Re-adding dotenv for general use if needed elsewhere, but not for DB
const path = require('path'); // Re-adding path for general use if needed elsewhere, but not for DB

// Load environment variables (keeping it for other env vars if any)
dotenv.config({ path: path.resolve(__dirname, './.env') });

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- STATIC FILES (IMAGES) ---
const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Initialize Firebase Admin SDK
require('./firebaseAdmin'); // Assuming you've created this file

// --- ROUTE IMPORTS ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const houseRoutes = require('./routes/houses');
const chatRoutes = require('./routes/chatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const listingRoutes = require('./routes/listingRoutes');
const reportRoutes = require('./routes/reportRoutes');

// --- ROUTES REGISTRATION ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/chat', chatRoutes);         
app.use('/api/bookings', bookingRoutes); 
app.use('/api/listings', listingRoutes); 
app.use('/api/reports', reportRoutes);

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📱 Network URL: http://192.168.1.7:${PORT}`); 
});