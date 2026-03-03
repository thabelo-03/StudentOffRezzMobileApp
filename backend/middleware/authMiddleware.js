const { admin } = require('../firebaseAdmin');
const { firebaseGetUserById } = require('../services/firebaseService');

module.exports = async function (req, res, next) {
  const authHeader = req.header('Authorization');
  const idToken = authHeader?.split(' ')[1];

  if (!idToken) {
    return res.status(401).json({ message: 'No ID token, authorization denied' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 1. Attach the core data from the Firebase Token
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email, // THIS IS CRITICAL for filtering Bongi's houses
    };

    // 2. Fetch the role from Realtime DB (users node)
    const userProfile = await firebaseGetUserById(decodedToken.uid);
    
    if (userProfile) {
      req.user.role = userProfile.role;
      req.user.username = userProfile.username; // Attach username for chat routes
    } else {
      // Fallback: If profile isn't in DB yet, assume landlord for Bongi's access
      req.user.role = 'landlord'; 
    }

    console.log(`Authenticated: ${req.user.email} as ${req.user.role}`);
    next();
  } catch (err) {
    console.error('Error verifying Firebase ID token:', err);
    res.status(401).json({ message: 'Invalid or expired ID token' });
  }
};