const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');
const { db } = require('../firebaseAdmin');

// Destructure functions from the service
const { 
  firebaseGetAllHouses, 
  firebaseCreateHouse, 
  firebaseUpdateHouse, 
  firebaseDeleteHouse 
} = firebaseService;

const auth = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const houses = await firebaseGetAllHouses();

    // Enrich houses with landlord verification status
    const enrichedHouses = await Promise.all(houses.map(async (house) => {
      if (house.landlordId) {
        try {
          const snapshot = await db.ref(`users/${house.landlordId}/verificationStatus`).once('value');
          const status = snapshot.val();
          console.log(`House: ${house.title}, Landlord: ${house.landlordId}, Verified: ${status}`); // Debug Log
          return { ...house, landlordVerified: status === 'verified' };
        } catch (e) {
          return house;
        }
      }
      return house;
    }));

    res.json(enrichedHouses);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listings' });
  }
});

// @route   POST /api/houses
// @desc    Create a new listing (Adds landlord details automatically)
router.post('/', auth, async (req, res) => {
  try {
    const houseData = {
      ...req.body,
      landlordId: req.user.uid,      // Attach the logged-in user's ID
      landlordEmail: req.user.email  // Attach the logged-in user's email
    };
    const newHouse = await firebaseCreateHouse(houseData);
    res.status(201).json(newHouse);
  } catch (err) {
    console.error("Create House Error:", err);
    res.status(500).json({ message: 'Error creating house' });
  }
});

// @route   PUT /api/houses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await firebaseUpdateHouse(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating house' });
  }
});

// @route   DELETE /api/houses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await firebaseDeleteHouse(req.params.id);
    res.json({ message: 'House deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting house' });
  }
});

module.exports = router;