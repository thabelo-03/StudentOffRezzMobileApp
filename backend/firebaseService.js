const { db, admin } = require('./firebaseAdmin');

const usersRef = db.ref('users');
const housesRef = db.ref('houses');
const bookingsRef = db.ref('bookings');
const chatMessagesRef = db.ref('chatMessages');

// --- User Service Functions ---
const firebaseCreateUser = async (uid, userData) => {
  try {
    await usersRef.child(uid).set({
      ...userData,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });
    return { uid, ...userData };
  } catch (error) {
    console.error('Error creating user in Realtime Database:', error);
    throw error;
  }
};

const firebaseGetUserById = async (uid) => {
  try {
    const snapshot = await usersRef.child(uid).once('value');
    return snapshot.val() ? { uid, ...snapshot.val() } : null;
  } catch (error) {
    console.error('Error getting user by ID from Realtime Database:', error);
    throw error;
  }
};

const firebaseGetUserByEmail = async (email) => {
  try {
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    const userData = snapshot.val();
    if (userData) {
      const uid = Object.keys(userData)[0]; // Get the UID
      return { uid, ...userData[uid] };
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email from Realtime Database:', error);
    throw error;
  }
};

const firebaseUpdateUser = async (uid, updates) => {
  try {
    await usersRef.child(uid).update(updates);
    return { uid, ...updates };
  } catch (error) {
    console.error('Error updating user in Realtime Database:', error);
    throw error;
  }
};

const firebaseDeleteUser = async (uid) => {
  try {
    await usersRef.child(uid).remove();
    return true;
  } catch (error) {
    console.error('Error deleting user from Realtime Database:', error);
    throw error;
  }
};

// --- House Service Functions ---
const firebaseCreateHouse = async (houseData) => {
  try {
    const newHouseRef = housesRef.push();
    const houseId = newHouseRef.key;
    await newHouseRef.set({
      ...houseData,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });
    return { id: houseId, ...houseData };
  } catch (error) {
    console.error('Error creating house in Realtime Database:', error);
    throw error;
  }
};

const firebaseGetHouseById = async (houseId) => {
  try {
    const snapshot = await housesRef.child(houseId).once('value');
    return snapshot.val() ? { id: houseId, ...snapshot.val() } : null;
  } catch (error) {
    console.error('Error getting house by ID from Realtime Database:', error);
    throw error;
  }
};

const firebaseGetAllHouses = async () => {
  try {
    const snapshot = await housesRef.once('value');
    const houses = snapshot.val();
    if (houses) {
      return Object.keys(houses).map(key => ({ id: key, ...houses[key] }));
    }
    return [];
  } catch (error) {
    console.error('Error getting all houses from Realtime Database:', error);
    throw error;
  }
};

const firebaseUpdateHouse = async (houseId, updates) => {
  try {
    await housesRef.child(houseId).update({
      ...updates,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });
    return { id: houseId, ...updates };
  } catch (error) {
    console.error('Error updating house in Realtime Database:', error);
    throw error;
  }
};

const firebaseDeleteHouse = async (houseId) => {
  try {
    await housesRef.child(houseId).remove();
    return true;
  } catch (error) {
    console.error('Error deleting house from Realtime Database:', error);
    throw error;
  }
};

// --- Booking Service Functions ---
const firebaseCreateBooking = async (bookingData) => {
  try {
    const newBookingRef = bookingsRef.push();
    const bookingId = newBookingRef.key;
    await newBookingRef.set({
      ...bookingData,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });
    return { id: bookingId, ...bookingData };
  } catch (error) {
    console.error('Error creating booking in Realtime Database:', error);
    throw error;
  }
};

const firebaseGetBookingById = async (bookingId) => {
  try {
    const snapshot = await bookingsRef.child(bookingId).once('value');
    return snapshot.val() ? { id: bookingId, ...snapshot.val() } : null;
  } catch (error) {
    console.error('Error getting booking by ID from Realtime Database:', error);
    throw error;
  }
};

const firebaseGetBookingsByUserId = async (userId) => {
  try {
    const snapshot = await bookingsRef.orderByChild('studentId').equalTo(userId).once('value');
    const bookings = snapshot.val();
    if (bookings) {
      return Object.keys(bookings).map(key => ({ id: key, ...bookings[key] }));
    }
    return [];
  } catch (error) {
    console.error('Error getting bookings by user ID from Realtime Database:', error);
    throw error;
  }
};

const firebaseGetBookingsByLandlordId = async (landlordId) => {
  try {
    const snapshot = await bookingsRef.orderByChild('landlordId').equalTo(landlordId).once('value');
    const bookings = snapshot.val();
    if (bookings) {
      return Object.keys(bookings).map(key => ({ id: key, ...bookings[key] }));
    }
    return [];
  } catch (error) {
    console.error('Error getting bookings by landlord ID from Realtime Database:', error);
    throw error;
  }
};

const firebaseUpdateBooking = async (bookingId, updates) => {
  try {
    await bookingsRef.child(bookingId).update({
      ...updates,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });
    return { id: bookingId, ...updates };
  } catch (error) {
    console.error('Error updating booking in Realtime Database:', error);
    throw error;
  }
};

const firebaseDeleteBooking = async (bookingId) => {
  try {
    await bookingsRef.child(bookingId).remove();
    return true;
  } catch (error) {
    console.error('Error deleting booking from Realtime Database:', error);
    throw error;
  }
};

// --- ChatMessage Service Functions ---
const firebaseCreateChatMessage = async (chatMessageData) => {
  try {
    const newChatMessageRef = chatMessagesRef.push();
    const messageId = newChatMessageRef.key;
    await newChatMessageRef.set({
      ...chatMessageData,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });
    return { id: messageId, ...chatMessageData };
  } catch (error) {
    console.error('Error creating chat message in Realtime Database:', error);
    throw error;
  }
};

const firebaseGetChatMessagesByConversation = async (user1Id, user2Id = null) => {
  try {
    const snapshot = await chatMessagesRef.orderByChild('createdAt').once('value');
    
    const messages = snapshot.val();
    if (messages) {
      let filteredMessages = Object.keys(messages)
        .map(key => ({ id: key, ...messages[key] }));

      if (user2Id) { // Messages between two specific users
        filteredMessages = filteredMessages.filter(msg => 
          (msg.senderId === user1Id && msg.receiverId === user2Id) ||
          (msg.senderId === user2Id && msg.receiverId === user1Id)
        );
      } else { // All messages involving user1Id (either as sender or receiver)
        filteredMessages = filteredMessages.filter(msg => 
          msg.senderId === user1Id || msg.receiverId === user1Id
        );
      }
      return filteredMessages;
    }
    return [];
  } catch (error) {
    console.error('Error getting chat messages by conversation from Realtime Database:', error);
    throw error;
  }
};

const firebaseGetAllChatMessages = async () => {
  try {
    const snapshot = await chatMessagesRef.once('value');
    const messages = snapshot.val();
    if (messages) {
      return Object.keys(messages).map(key => ({ id: key, ...messages[key] }));
    }
    return [];
  } catch (error) {
    console.error('Error getting all chat messages from Realtime Database:', error);
    throw error;
  }
};


module.exports = {
  firebaseCreateUser,
  firebaseGetUserById,
  firebaseGetUserByEmail,
  firebaseUpdateUser,
  firebaseDeleteUser,
  firebaseCreateHouse,
  firebaseGetHouseById,
  firebaseGetAllHouses,
  firebaseUpdateHouse,
  firebaseDeleteHouse,
  firebaseCreateBooking,
  firebaseGetBookingById,
  firebaseGetBookingsByUserId,
  firebaseUpdateBooking,
  firebaseDeleteBooking,
  firebaseCreateChatMessage,
  firebaseGetChatMessagesByConversation,
  firebaseGetAllChatMessages,
  firebaseGetBookingsByLandlordId,
};