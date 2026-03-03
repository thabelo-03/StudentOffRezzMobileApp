const { db, admin } = require('../firebaseAdmin');

// --- HOUSE OPERATIONS (Stored in 'landlord' node to match existing routes) ---

const firebaseGetAllHouses = async () => {
  const snapshot = await db.ref('landlord').once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

const firebaseCreateHouse = async (houseData) => {
  // Pushing to 'landlord' node because listingRoutes.js and chatRoutes.js read from here
  const newHouseRef = db.ref('landlord').push();
  const houseWithId = { ...houseData, id: newHouseRef.key };
  await newHouseRef.set(houseWithId);
  return houseWithId;
};

const firebaseUpdateHouse = async (id, updates) => {
  await db.ref(`landlord/${id}`).update(updates);
  return { id, ...updates };
};

const firebaseDeleteHouse = async (id) => {
  await db.ref(`landlord/${id}`).remove();
  return { id };
};

// --- USER OPERATIONS ---

const firebaseCreateUser = async (uid, userData) => {
  await db.ref(`users/${uid}`).set(userData);
  return { uid, ...userData };
};

const firebaseGetUserById = async (uid) => {
  const snapshot = await db.ref(`users/${uid}`).once('value');
  return snapshot.val();
};

const firebaseGetUserByEmail = async (email) => {
  const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
  const val = snapshot.val();
  if (val) {
    const key = Object.keys(val)[0];
    return { uid: key, ...val[key] };
  }
  return null;
};

// --- REPORT OPERATIONS ---
const firebaseCreateReport = async (reportData) => {
  const newRef = db.ref('reports').push();
  const report = { ...reportData, timestamp: admin.database.ServerValue.TIMESTAMP };
  await newRef.set(report);
  return { id: newRef.key, ...report };
};

const firebaseGetAllReports = async () => {
  const snapshot = await db.ref('reports').once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

// --- SYSTEM CONFIG OPERATIONS ---
const firebaseGetSystemConfig = async () => {
  const snapshot = await db.ref('system_config').once('value');
  return snapshot.val() || { maintenanceMode: false, supportEmail: 'support@thabstay.com' };
};

const firebaseUpdateSystemConfig = async (updates) => {
  await db.ref('system_config').update(updates);
  return updates;
};

module.exports = {
  firebaseGetAllHouses,
  firebaseCreateHouse,
  firebaseUpdateHouse,
  firebaseDeleteHouse,
  firebaseCreateUser,
  firebaseGetUserById,
  firebaseGetUserByEmail,
  firebaseCreateReport,
  firebaseGetAllReports,
  firebaseGetSystemConfig,
  firebaseUpdateSystemConfig
};