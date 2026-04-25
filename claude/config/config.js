// ─────────────────────────────────────────────────────────────
// config/config.js  —  Single Firebase initialisation point
// ─────────────────────────────────────────────────────────────

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const provider = new GoogleAuthProvider();

// ── ES Module exports (for auth-guard.js etc.) ───────────────
export {
  auth,
  provider,
  onAuthStateChanged,
  signOut
};

// ── Window globals (for non-module scripts: login.js, signup.js) ─
window.auth = auth;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
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