const { admin, db } = require('../firebaseAdmin');

exports.register = async (req, res) => {
  console.log("Registration attempt for:", req.body.email);

  try {
    const { username, email, phone, password, role } = req.body;

    // 1. Validation check
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // 2. Create User in Firebase Authentication
    // Firebase handles email uniqueness and password hashing automatically
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
      phoneNumber: phone.startsWith('+') ? phone : undefined // Firebase requires E.164 format
    });

    console.log("Firebase Auth account created:", userRecord.uid);

    // 3. Store additional data (role, username) in Realtime Database
    // This allows us to check if they are a 'student' or 'landlord' later
    const userData = {
      username,
      email,
      phone,
      role, // 'student' or 'landlord'
      createdAt: new Date().toISOString()
    };

    await db.ref(`users/${userRecord.uid}`).set(userData);
    console.log("User profile saved to Realtime Database successfully");

    // 4. Custom Claims (Optional but recommended)
    // This embeds the 'role' directly into the Firebase Token
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: userRecord.uid, username, role }
    });

  } catch (error) {
    console.error("DETAILED ERROR:", error);
    
    // Handle specific Firebase errors (like email already exists)
    if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ message: 'User already exists' });
    }
    
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};