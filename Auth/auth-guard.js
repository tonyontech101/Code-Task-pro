// ─────────────────────────────────────────────────────────────
// Auth/auth-guard.js  —  Protects pages that require login
// ─────────────────────────────────────────────────────────────

import { auth, onAuthStateChanged } from "../config/config.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // ❌ Not logged in → redirect to login page
    window.location.href = "index.html";
    return;
  }

  // ✅ Authenticated — reveal the page
  console.log("Authorized:", user.email);
  window.codetaskAuthUser = user;
  window.codetaskAuthReady = true;
  document.body.style.display = "block";

  // Dispatch a custom event so components can react to the user
  window.dispatchEvent(
    new CustomEvent("auth-ready", { detail: { user } })
  );
});
