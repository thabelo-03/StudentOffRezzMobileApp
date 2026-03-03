const { admin, db } = require('./firebaseAdmin');

const seedAdmin = async () => {
  const email = 'admin@gmail.com';
  const password = 'admin123';
  const username = 'System Admin';
  const phone = '0770000000';

  try {
    let uid;

    // 1. Check if user exists in Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      uid = userRecord.uid;
      console.log('⚠️ Admin user already exists in Auth. Updating password...');
      await admin.auth().updateUser(uid, {
        password: password,
        displayName: username
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('Creating new Admin user in Auth...');
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: username,
        });
        uid = userRecord.uid;
      } else {
        throw error;
      }
    }

    // 2. Set Admin Role in Realtime Database
    await db.ref(`users/${uid}`).set({
      username,
      email,
      phone,
      role: 'admin'
    });

    console.log('✅ Admin account seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();