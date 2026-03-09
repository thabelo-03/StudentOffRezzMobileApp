const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { db } = require('../firebaseAdmin');

// @route   POST /api/bookings/confirm
// @desc    Confirm payment with Transaction ID and notify student
// Moved to top to prevent routing conflicts
router.post('/confirm', auth, async (req, res) => {
  try {
    console.log("Payment confirmation request received:", req.body);
    const { bookingId, transactionId } = req.body;
    
    if (!bookingId || !transactionId) {
      return res.status(400).json({ message: "Booking ID and Transaction ID required" });
    }

    // 1. Fetch Booking
    const bookingRef = db.ref(`bookings/${bookingId}`);
    const snapshot = await bookingRef.once('value');
    const booking = snapshot.val();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. Update Booking Status & Transaction ID
    await bookingRef.update({
      status: 'paid',
      transactionId: transactionId,
      paymentDate: Date.now()
    });

    // 3. Update Student View
    if (booking.studentId && booking.houseId) {
      await db.ref(`student_bookings_status/${booking.studentId}/${booking.houseId}`).update({
        status: 'paid',
        transactionId: transactionId
      });
    }

    // 4. Simulate Sending Email (In production, use nodemailer here)
    console.log(`[EMAIL SERVICE] Sending Payment Receipt to Student: ${booking.studentEmail}`);
    console.log(`[EMAIL SERVICE] Subject: Payment Successful - Transaction ${transactionId}`);
    console.log(`[EMAIL SERVICE] Body: Your payment for ${booking.houseName} was successful. Transaction ID: ${transactionId}`);

    res.json({ message: "Payment recorded successfully" });
  } catch (err) {
    console.error("Payment Confirmation Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/bookings/payments
// @desc    Get all paid bookings (Admin only)
router.get('/payments', auth, async (req, res) => {
  try {
    const snapshot = await db.ref('bookings').once('value');
    const data = snapshot.val() || {};

    const payments = Object.keys(data)
      .map(key => ({ id: key, ...data[key] }))
      .filter(b => b.status === 'paid')
      .sort((a, b) => (b.paymentDate || 0) - (a.paymentDate || 0));

    res.json(payments);
  } catch (err) {
    console.error("Admin Payments Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/bookings/landlord
// @desc    Get all bookings for the authenticated landlord
router.get('/landlord', auth, async (req, res) => {
  try {
    const landlordId = req.user.uid;
    console.log(`Fetching bookings for landlord: ${landlordId}`);

    // Fetch the root 'bookings' node
    const snapshot = await db.ref('bookings').once('value');
    const data = snapshot.val() || {};

    // Filter bookings belonging to this landlord
    const myBookings = Object.keys(data)
      .map(key => ({
        id: key,
        ...data[key]
      }))
      .filter(b => b.landlordId === landlordId);

    // Sort by timestamp (newest first)
    const sortedBookings = myBookings.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.json(sortedBookings);
  } catch (err) {
    console.error("Landlord Bookings GET Error:", err.message);
    res.status(500).json({ message: 'Server Error fetching bookings' });
  }
});

// @route   GET /api/bookings/student
// @desc    Get all bookings for the authenticated student
router.get('/student', auth, async (req, res) => {
  try {
    const studentId = req.user.uid;
    // Read from the new structure: student_bookings_status/{studentId}
    const snapshot = await db.ref(`student_bookings_status/${studentId}`).once('value');
    const data = snapshot.val() || {};

    const myBookings = Object.keys(data).map(houseId => ({
      houseId,
      ...data[houseId]
    })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.json(myBookings);
  } catch (err) {
    res.status(500).json({ message: 'Server Error fetching bookings' });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking (Matches your StudentHome 'Book Now' logic)
router.post('/', auth, async (req, res) => {
  try {
    const { houseId, landlordId, amount, houseName } = req.body;
    const studentId = req.user.uid;

    const newBooking = {
      houseId,
      studentId,
      landlordId,
      houseName,
      amount,
      status: 'pending',
      timestamp: Date.now(),
      studentEmail: req.user.email
    };

    // 1. Write to flat bookings list (for landlord backward compatibility)
    const bookingRef = db.ref('bookings').push();
    await bookingRef.set(newBooking);

    // 2. Write to student_bookings_status (Requested structure)
    await db.ref(`student_bookings_status/${studentId}/${houseId}`).set({
      status: 'pending',
      timestamp: Date.now(),
      bookingId: bookingRef.key
    });

    res.status(201).json({ id: bookingRef.key, ...newBooking });
  } catch (err) {
    res.status(500).json({ message: 'Booking failed' });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking status (Accept/Reject)
router.put('/:id', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // 1. Fetch the booking to get details
    const bookingRef = db.ref(`bookings/${bookingId}`);
    const snapshot = await bookingRef.once('value');
    const booking = snapshot.val();

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 2. Update global booking
    await bookingRef.update({ status });

    // 3. Update student view (student_bookings_status/{studentId}/{houseId})
    if (booking.studentId && booking.houseId) {
      await db.ref(`student_bookings_status/${booking.studentId}/${booking.houseId}`).update({ status });
    }

    res.json({ id: bookingId, status });
  } catch (err) {
    console.error("Update Booking Error:", err.message);
    res.status(500).json({ message: 'Server Error updating booking' });
  }
});

module.exports = router;