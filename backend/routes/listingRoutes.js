const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { db } = require('../firebaseAdmin');

/**
 * @route   GET /api/listings/mine
 * @desc    Fetch listings belonging to Bongi based on email
 */
router.get('/mine', auth, async (req, res) => {
  try {
    // 1. Get the email of the logged-in user (e.g., bongi@gmail.com)
    const userEmail = req.user.email; 
    console.log(`Bongi is logged in with: ${userEmail}. Filtering listings...`);

    // 2. Point to 'landlord' node (Same as StudentHome)
    const snapshot = await db.ref('landlord').once('value');
    const data = snapshot.val() || {};

    // 3. Filter: Compare the 'landlordEmail' in DB to the logged-in user's email
    const myHouses = Object.keys(data)
      .map(key => ({
        id: key,
        ...data[key]
      }))
      .filter(house => {
        // We use lowercase to ensure "Bongi@gmail.com" matches "bongi@gmail.com"
        return house.landlordEmail?.toLowerCase() === userEmail?.toLowerCase();
      });

    console.log(`✅ Success: Found ${myHouses.length} properties for ${userEmail}`);
    res.json(myHouses);

  } catch (err) {
    console.error('Fetch Mine Error:', err.message);
    res.status(500).json({ message: "Server error fetching your listings" });
  }
});

module.exports = router;