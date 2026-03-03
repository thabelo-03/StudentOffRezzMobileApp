import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Need this for Login
import { getDatabase } from "firebase/database"; // Need this for RTDB

const firebaseConfig = {
  apiKey: "AIzaSyBZ5DU3D1eZd-LhWL5bgvA_FX6FAIO9-vI",
  authDomain: "mlalazi011.firebaseapp.com",
  databaseURL: "https://mlalazi011-default-rtdb.firebaseio.com",
  projectId: "mlalazi011",
  storageBucket: "mlalazi011.firebasestorage.app",
  messagingSenderId: "20281717238",
  appId: "1:20281717238:web:524ae242f9a32213c4d7d7",
  measurementId: "G-S1QHE0PYM1"
};

// 1. Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize the services and EXPORT them
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;