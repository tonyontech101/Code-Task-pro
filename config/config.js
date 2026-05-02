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
  writeBatch,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const db   = getFirestore(app);
const provider = new GoogleAuthProvider();

async function writeUserProfile(user, overrides = {}) {
  if (!user) return;

  const email = (overrides.email || user.email || "").toLowerCase();
  const displayName = overrides.displayName || user.displayName || email.split("@")[0] || "User";

  await setDoc(doc(db, "userProfiles", user.uid), {
    uid: user.uid,
    displayName,
    email,
    photoURL: overrides.photoURL ?? user.photoURL ?? null,
    jobTitle: overrides.jobTitle || "Team Member",
    onlineStatus: overrides.onlineStatus || "offline",
    lastSeen: Date.now(),
    updatedAt: Date.now()
  }, { merge: true });
}

// ── ES Module exports (for auth-guard.js etc.) ───────────────
export {
  auth,
  db,
  provider,
  onAuthStateChanged,
  signOut,
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
  arrayUnion,
  arrayRemove,
  writeUserProfile
};

// ── Window globals (for non-module scripts: login.js, signup.js) ─
window.auth = auth;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword     = signInWithEmailAndPassword;
window.updateProfile                  = updateProfile;
window.writeUserProfile               = writeUserProfile;

// ── Google Sign-In (shared by login + signup) ────────────────
window.signInWithGoogle = async () => {
  try {
    const credential = await signInWithPopup(auth, provider);
    await writeUserProfile(credential.user, { onlineStatus: "online" });
    window.location.href = "app.html";
  } catch (err) {
    console.error("Google sign-in error:", err);
    alert(err.message);
  }
};

// ── Logout (called from sidebar button) ──────────────────────
window.logout = async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
};
