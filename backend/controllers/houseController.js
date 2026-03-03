const { firebaseGetAllHouses } = require('../services/firebaseService');

const getHouses = async (req, res) => {
  try {
    const listings = await firebaseGetAllHouses();
    console.log(`Retrieved ${listings.length} houses.`);
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getHouses };