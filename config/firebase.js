import { initializeApp } from "firebase/app";
import { initializeAuth, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkoTyWMj4508Pam_mWm2elTgh1cm7W-VU",
  authDomain: "project-3e88072f-2587-491e-a0b.firebaseapp.com",
  projectId: "project-3e88072f-2587-491e-a0b",
  storageBucket: "project-3e88072f-2587-491e-a0b.firebasestorage.app",
  messagingSenderId: "500749231417",
  appId: "1:500749231417:web:69200477154cb78d9db4e8",
  measurementId: "G-HZ0SV7WHRQ"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: inMemoryPersistence
});
const db = getFirestore(app);

export { app, auth, db };
