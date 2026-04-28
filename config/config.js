// ─────────────────────────────────────────────────────────────
// config/config.js  —  Single Firebase initialisation point
// ─────────────────────────────────────────────────────────────

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ── Firebase Config ──────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBOMgLzJXKRWoTPCc2tnoSNuUytLo0lRn0",
  authDomain:        "codetaskpro-aaf0c.firebaseapp.com",
  projectId:         "codetaskpro-aaf0c",
  storageBucket:     "codetaskpro-aaf0c.appspot.com",
  messagingSenderId: "307069215768",
  appId:             "1:307069215768:web:038a668901f571b2598f6d"
};

// ── Initialise Firebase (once) ───────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// ── ES Module exports (for auth-guard.js etc.) ───────────────
export {
  auth,
  db,
  storage,
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  ref,
  uploadBytes,
  getDownloadURL,
  updateProfile,
  provider,
  onAuthStateChanged,
  signOut
};

// ── Window globals (for non-module scripts: login.js, signup.js) ─
window.auth = auth;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.fetchSignInMethodsForEmail     = fetchSignInMethodsForEmail;
window.signInWithEmailAndPassword     = signInWithEmailAndPassword;
window.updateProfile                  = updateProfile;

// ── Google Sign-In (shared by login + signup) ────────────────
window.signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Google sign-in error:", err);
    alert(err.message);
  }
};

// ── Logout (called from sidebar button) ──────────────────────
window.logout = async () => {
  try {
    await signOut(auth);
    window.location.href = "login-page.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
};
