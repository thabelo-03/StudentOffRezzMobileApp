const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount;

// When deploying to Render, we will use an environment variable.
// For local development, we'll fall back to the JSON file.
if (process.env.FIREBASE_CREDENTIALS) {
  try {
    // Parse the JSON string from the environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  } catch (e) {
    console.error('Error parsing FIREBASE_CREDENTIALS:', e);
  }
} else {
  const filePath = path.join(__dirname, 'firebase-adminsdk.json');
  if (fs.existsSync(filePath)) {
    serviceAccount = require(filePath);
  } else {
    console.error('CRITICAL: FIREBASE_CREDENTIALS env var not set and firebase-adminsdk.json not found.');
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Updated with your ThabStay RTDB URL:
    databaseURL: "https://mlalazi011-default-rtdb.firebaseio.com/"
  });
}

let db;
try {
  db = admin.database();
} catch (e) {
  console.error("Firebase DB init failed (likely missing creds):", e.message);
}

module.exports = { admin, db };
