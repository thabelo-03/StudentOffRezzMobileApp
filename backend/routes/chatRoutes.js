const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { db } = require('../firebaseAdmin');
const { firebaseGetUserById } = require('../services/firebaseService');


// Endpoint for Landlords to get their conversations
router.get('/conversations', auth, async (req, res) => {
  // Legacy endpoint or needs refactor for new structure if used by LandlordInbox
  // For now, we'll implement a basic scan of public_chats if needed, 
  // but LandlordInbox in context calls /landlord-conversations (which isn't here yet, let's add it)
  res.json([]);
});

router.get('/landlord-conversations', auth, async (req, res) => {
  try {
    const landlordUid = req.user.uid;
    
    // 1. Get Landlord's houses (We need to know which houses belong to this landlord)
    // This is a bit expensive without an index, but we'll scan 'landlord' node
    const housesSnap = await db.ref('landlord').once('value');
    const housesData = housesSnap.val() || {};
    
    const myHouseIds = Object.keys(housesData).filter(key => 
      housesData[key].landlordId === landlordUid
    );

    const conversations = [];

    // 2. For each house, fetch public_chats/{houseId}
    for (const houseId of myHouseIds) {
      const chatsSnap = await db.ref(`public_chats/${houseId}`).once('value');
      const studentsChats = chatsSnap.val();

      if (studentsChats) {
        for (const studentId of Object.keys(studentsChats)) {
          const messages = studentsChats[studentId];
          const msgKeys = Object.keys(messages);
          const lastMsgKey = msgKeys[msgKeys.length - 1];
          const lastMsg = messages[lastMsgKey];

          // Fetch student details
          const student = await firebaseGetUserById(studentId);

          conversations.push({
            id: `${houseId}_${studentId}`,
            studentId: studentId,
            studentName: student?.username || 'Student User',
            studentAvatar: student?.photoURL,
            houseTitle: housesData[houseId].title || housesData[houseId].houseName,
            houseId: houseId,
            lastMessage: lastMsg.text,
            timestamp: lastMsg.timestamp
          });
        }
      }
    }

    res.json(conversations.sort((a, b) => b.timestamp - a.timestamp));
  } catch (err) {
    console.error("Chat Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT FOR STUDENTS TO GET THEIR CONVERSATIONS
router.get('/student-conversations', auth, async (req, res) => {
    try {
      const studentUid = req.user.uid;
      
      // Scan public_chats for this studentId
      // Structure: public_chats/{houseId}/{studentId}
      // We have to iterate houses. (Not ideal but works for requested structure)
      const publicChatsSnap = await db.ref('public_chats').once('value');
      const allHousesChats = publicChatsSnap.val() || {};

      const conversations = [];

      for (const houseId of Object.keys(allHousesChats)) {
        const houseChats = allHousesChats[houseId];
        if (houseChats[studentUid]) {
          // Found a chat for this student in this house
          const messages = houseChats[studentUid];
          const msgKeys = Object.keys(messages);
          const lastMsgKey = msgKeys[msgKeys.length - 1];
          const lastMsg = messages[lastMsgKey];

          // We need landlord details. We can fetch house to get landlordId
          const houseSnap = await db.ref(`landlord/${houseId}`).once('value');
          const house = houseSnap.val();
          const landlordId = house?.landlordId;
          const landlord = landlordId ? await firebaseGetUserById(landlordId) : null;

          conversations.push({
            id: `${houseId}_${studentUid}`,
            otherPartyId: landlordId,
            otherPartyName: landlord?.username || 'Landlord',
            houseTitle: house?.title || house?.houseName || 'Property',
            houseId: houseId,
            lastMessage: lastMsg.text,
            timestamp: lastMsg.timestamp
          });
        }
      }
  
      res.json(conversations.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error("Student Conversations Error:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

// Endpoint to fetch messages between a landlord and a student
router.get('/messages/:otherUserId', auth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { houseId } = req.query;
    
    // Determine studentId: if user is student, it's them. If landlord, it's the other user.
    const studentId = (req.user.role === 'student') ? userId : req.params.otherUserId;

    if (!houseId) return res.json([]);

    const snapshot = await db.ref(`public_chats/${houseId}/${studentId}`).once('value');
    const data = snapshot.val() || {};
    const messages = Object.keys(data).map(key => ({ id: key, ...data[key], createdAt: data[key].timestamp }));
    
    res.json(messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
  } catch (err) {
    console.error("Fetch Messages Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, text, houseTitle, houseId } = req.body;
    const senderId = req.user.uid;
    
    if (!houseId) return res.status(400).json({ error: "houseId is required" });

    // Determine studentId for the path
    const studentId = (req.user.role === 'student') ? senderId : receiverId;

    const newMessage = {
      senderId,
      senderName: req.user.username || 'Anonymous', // Assuming username is available or fetched
      text,
      timestamp: Date.now()
    };

    const chatRef = db.ref(`public_chats/${houseId}/${studentId}`).push();
    await chatRef.set(newMessage);
    
    res.status(201).json({
      id: chatRef.key,
      ...newMessage,
      createdAt: newMessage.timestamp
    });
  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;