const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Define Schemas manually for the seed
const Booking = mongoose.model('Booking', new mongoose.Schema({}, {strict: false}), 'bookings');
const ChatMessage = mongoose.model('ChatMessage', new mongoose.Schema({}, {strict: false}), 'chatmessages');

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  // 1. CLEAR OLD TEST DATA (Optional)
  // await Booking.deleteMany({ landlordEmail: "sam@gmail.com" });

  const samId = new mongoose.Types.ObjectId("65b1234567890abcdef12345"); // Simulated Sam's ID
  const studentId = new mongoose.Types.ObjectId("65c0987654321fedcba09876");

  // 2. SEED A PENDING BOOKING
  await Booking.create({
    landlordId: samId,
    landlordEmail: "sam@gmail.com",
    studentId: studentId,
    listingTitle: "BLUE SKY - Sam's Place",
    amount: 150,
    status: "pending", // This MUST be lowercase to match our filter
    createdAt: new Date()
  });

  // 3. SEED A CHAT MESSAGE
  await ChatMessage.create({
    conversationId: "conv_sam_student_001",
    sender: studentId, // Student is sending the message
    recipient: samId,  // Sam is receiving it
    text: "Is the BLUE SKY room still available?",
    houseTitle: "BLUE SKY",
    isRead: false,
    createdAt: new Date()
  });

  console.log("✅ Reverse Engineering Data Seeded for sam@gmail.com");
  process.exit();
};

seedData();