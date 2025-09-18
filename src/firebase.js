import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBUfHtxAvjhfIYO9pLktqYxyVokRy8Yb7w",
  authDomain: "collegeproject-4d534.firebaseapp.com",
  projectId: "collegeproject-4d534",
  storageBucket: "collegeproject-4d534.firebasestorage.app",
  messagingSenderId: "1043139485593",
  appId: "1:1043139485593:web:3829147ca4312e5c5d3d08",
  measurementId: "G-CHCHH2ZNTT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);