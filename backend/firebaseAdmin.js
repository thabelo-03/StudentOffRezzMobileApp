const admin = require('firebase-admin');

// 1. Ensure you have downloaded the 'firebase-adminsdk.json' 
// from your Firebase Console and placed it in your /backend folder.
const serviceAccount = require('./firebase-adminsdk.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Updated with your ThabStay RTDB URL:
  databaseURL: "https://mlalazi011-default-rtdb.firebaseio.com/"
});

const db = admin.database();

module.exports = { admin, db };
