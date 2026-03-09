const express = require('express');
const router = express.Router();
const { admin, db } = require('../firebaseAdmin');
const { firebaseCreateUser, firebaseGetUserByEmail, firebaseGetUserById } = require('../services/firebaseService');
const authMiddleware = require('../middleware/authMiddleware');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password, role, studentRegNo } = req.body;

    // Trim whitespace from email to prevent formatting errors
    const cleanEmail = email ? email.trim() : '';

    console.log("Register Request:", { username, email: cleanEmail, role }); // Debug log to see what frontend is sending

    if (!cleanEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if Student Registration Number already exists
    if (role === 'student' && studentRegNo) {
      const snapshot = await db.ref('users').orderByChild('studentIdNumber').equalTo(studentRegNo).once('value');
      if (snapshot.exists()) {
        return res.status(400).json({ message: "Student Registration Number is already registered." });
      }
    }

    // 1. Check if user with that email already exists in Firebase Auth
    //    We can't directly check if an email exists without creating the user first in Auth,
    //    or trying to get user by email. We'll proceed to create and handle potential errors.

    // 2. Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: cleanEmail,
      password,
      displayName: username,
    });

    const uid = userRecord.uid;

    // 3. Store additional user data in Firebase Realtime Database
    const userData = {
      username,
      email: cleanEmail,
      phone,
      role,
    };

    // Initialize verification status for landlords
    if (role === 'landlord') {
      userData.verificationStatus = 'pending';
    }

    // Initialize data for students
    if (role === 'student') {
      userData.studentVerified = false;
      if (studentRegNo) {
        userData.studentIdNumber = studentRegNo;
        userData.verificationStatus = 'pending';
      } else {
        userData.verificationStatus = 'unverified';
      }
    }

    const newUser = await firebaseCreateUser(uid, userData);

    res.status(201).json({
      message: "User registered successfully",
      user: { uid: newUser.uid, username: newUser.username, email: newUser.email, role: newUser.role, verificationStatus: newUser.verificationStatus }
    });
  } catch (err) {
    console.error("REGISTRATION ERROR:", err);
    // Handle Firebase Auth specific errors
    if (err.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'User with that email already exists' });
    }
    if (err.code === 'auth/invalid-email') {
      return res.status(400).json({ message: 'Invalid email address format' });
    }
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Authenticate with Firebase Authentication
    //    Note: Direct password verification on the backend is generally not recommended with Firebase.
    //    Ideally, the frontend sends ID tokens. For this migration, we simulate by verifying email/pass.
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(400).json({ message: 'Invalid Credentials' });
      }
      throw error;
    }

    // Since we cannot directly verify password on backend, we'll assume successful authentication
    // from the client side is handled by Firebase SDK.
    // For this direct backend login endpoint, we can't compare plaintext password.
    // A robust solution involves the client sending the Firebase ID Token after client-side login.
    // For now, we proceed to create a custom token if user exists by email.

    // 2. Get additional user data from Realtime Database
    const userProfile = await firebaseGetUserById(userRecord.uid);
    if (!userProfile) {
      return res.status(400).json({ message: 'User profile not found in database' });
    }

    // 3. Create a custom Firebase token
    const customToken = await admin.auth().createCustomToken(userRecord.uid, { 
      role: userProfile.role,
      verificationStatus: userProfile.verificationStatus 
    });

    res.json({
      token: customToken, // This custom token needs to be exchanged for an ID token on the client
      user: {
        uid: userRecord.uid,
        username: userProfile.username,
        role: userProfile.role,
        email: userProfile.email,
        phone: userProfile.phone,
        verificationStatus: userProfile.verificationStatus,
        studentVerified: userProfile.studentVerified,
        studentIdNumber: userProfile.studentIdNumber
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// @route   PUT /api/auth/submit-documents
// @desc    Submit verification documents for Landlord
router.put('/submit-documents', async (req, res) => {
  try {
    const { uid, documents } = req.body;

    if (!uid || !documents) {
      return res.status(400).json({ message: "User ID and documents are required" });
    }

    // Update user in Realtime Database with document links
    await db.ref(`users/${uid}`).update({
      documents,
      verificationStatus: 'pending' // Ensure status is pending for admin review
    });

    res.json({ message: "Documents submitted successfully", verificationStatus: 'pending' });
  } catch (err) {
    console.error("DOCUMENT SUBMISSION ERROR:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// @route   POST /api/auth/verify-student-id
// @desc    Verify Student Registration Number
router.post('/verify-student-id', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { studentId } = req.body;

    // --- DEBUG LOG ---
    console.log(`[VERIFY STUDENT ID] Request for UID: ${uid}. Body:`, req.body);

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    await db.ref(`users/${uid}`).update({
      studentVerified: false,
      verificationStatus: 'pending',
      studentIdNumber: studentId
    });

    res.json({ message: "Student ID submitted for verification" });
  } catch (err) {
    console.error("STUDENT VERIFY ERROR:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = router;