import {
  applyFirebaseLockout,
  formatCooldown,
  getRateLimitState,
  recordFailure,
  resetRateLimit
} from "./rate-limit.js";

import { updateProfile } from "../config/config.js";

const RATE_LIMIT_OPTIONS = {
  maxAttempts: 4,
  windowMs: 20 * 60 * 1000,
  cooldownMs: 20 * 60 * 1000
};

const $ = (id) => document.getElementById(id);

function makeToggle(btnId, inputId) {
  const btn = $(btnId);
  const inp = $(inputId);
  if (!btn || !inp) return;

  btn.addEventListener("click", () => {
    const isHidden = inp.type === "password";
    inp.type = isHidden ? "text" : "password";
  });
}

makeToggle("togglePw", "password");
makeToggle("toggleConfirm", "confirmPw");

const pwColors = ["#f75f5f", "#f7a55f", "#f7d45f", "#4fd18a"];
const statusEl = $("authStatus");
const signupBtn = $("signupBtn");
const defaultButtonText = signupBtn?.querySelector(".btn-text")?.textContent || "Sign up";
let cooldownTimer = null;

function showStatus(message = "", tone = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status-msg${tone ? ` ${tone}` : ""}`;
}

function setButtonState(state) {
  if (!signupBtn) return;

  if (state.isLocked) {
    signupBtn.disabled = true;
    signupBtn.classList.remove("loading");
    signupBtn.querySelector(".btn-text").textContent = `Try again in ${formatCooldown(state.msRemaining)}`;
    return;
  }

  signupBtn.disabled = false;
  signupBtn.querySelector(".btn-text").textContent = defaultButtonText;
}

function syncRateLimitUi() {
  const email = $("email")?.value?.trim() || "";
  const state = getRateLimitState("signup", email, RATE_LIMIT_OPTIONS);

  setButtonState(state);

  if (state.isLocked) {
    showStatus(
      `Too many sign-up attempts. Try again in ${formatCooldown(state.msRemaining)}.`,
      "error"
    );
  } else if (email && state.remainingAttempts < state.maxAttempts) {
    showStatus(
      `${state.remainingAttempts} of ${state.maxAttempts} sign-up attempts remaining before a temporary lock.`,
      "error"
    );
  } else {
    showStatus("");
  }

  return state;
}

function startCooldownTicker() {
  if (cooldownTimer) window.clearInterval(cooldownTimer);
  cooldownTimer = window.setInterval(() => {
    const state = syncRateLimitUi();
    if (!state.isLocked) {
      window.clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}

$("password")?.addEventListener("input", function () {
  const v = this.value;
  let score = 0;

  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;

  ["s1", "s2", "s3", "s4"].forEach((id, i) => {
    const el = $(id);
    if (!el) return;
    el.style.background = i < score ? pwColors[score - 1] : "var(--border)";
  });

  const labels = ["Too weak", "Weak", "Good", "Strong"];
  $("pwHint").textContent =
    v.length === 0 ? "At least 8 characters" : labels[score - 1] || "Too weak";
});

function showErr(inputId, errId, show) {
  const inp = $(inputId);
  const err = $(errId);
  if (!inp || !err) return;

  inp.classList.toggle("error", show);
  err.style.display = show ? "block" : "none";
}

syncRateLimitUi();

$("signupBtn")?.addEventListener("click", async () => {
  const name = $("fullName").value.trim();
  const email = $("email").value.trim();
  const pw = $("password").value;
  const cpw = $("confirmPw").value;
  const terms = $("terms").checked;

  let valid = true;

  if (!name) {
    showErr("fullName", "nameErr", true);
    valid = false;
  } else {
    showErr("fullName", "nameErr", false);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr("email", "emailErr", true);
    valid = false;
  } else {
    showErr("email", "emailErr", false);
  }

  if (pw.length < 8) {
    showErr("password", "pwErr", true);
    valid = false;
  } else {
    showErr("password", "pwErr", false);
  }

  if (pw !== cpw) {
    showErr("confirmPw", "confirmErr", true);
    valid = false;
  } else {
    showErr("confirmPw", "confirmErr", false);
  }

  const termsErr = $("termsErr");
  if (!terms) {
    termsErr.style.display = "block";
    valid = false;
  } else {
    termsErr.style.display = "none";
  }

  if (!valid) return;

  const currentState = getRateLimitState("signup", email, RATE_LIMIT_OPTIONS);
  if (currentState.isLocked) {
    syncRateLimitUi();
    startCooldownTicker();
    return;
  }

  if (signupBtn.classList.contains("loading")) return;

  signupBtn.classList.add("loading");
  signupBtn.disabled = true;
  showStatus("");

  try {
    const signInMethods = await window.fetchSignInMethodsForEmail(window.auth, email);
    if (signInMethods.length > 0) {
      showErr("email", "emailErr", true);
      $("emailErr").textContent = "This email is already in use. Please log in instead.";
      showStatus("This email is already linked to an existing account.", "error");
      signupBtn.classList.remove("loading");
      signupBtn.disabled = false;
      return;
    }

    const userCredential = await window.createUserWithEmailAndPassword(
      window.auth,
      email,
      pw
    );

    if (updateProfile) {
      await updateProfile(userCredential.user, {
        displayName: name
      });
    }

    resetRateLimit("signup", email);
    showStatus("Account created successfully.", "success");

    console.log("User created:", userCredential.user);

    $("formView").style.display = "none";
    $("successView").classList.add("show");
  } catch (error) {
    console.error(error);

    let message = "Signup failed";

    switch (error.code) {
      case "auth/email-already-in-use":
        showErr("email", "emailErr", true);
        $("emailErr").textContent = "This email is already in use. Please log in instead.";
        message = "This email is already linked to an existing account.";
        break;
      case "auth/weak-password":
        message = "Password must be at least 6 characters";
        break;
      case "auth/invalid-email": {
        const state = recordFailure("signup", email, RATE_LIMIT_OPTIONS);
        message = state.isLocked
          ? `Too many sign-up attempts. Try again in ${formatCooldown(state.msRemaining)}.`
          : `${state.remainingAttempts} sign-up attempts remaining before a temporary lock.`;
        if (state.isLocked) startCooldownTicker();
        break;
      }
      case "auth/network-request-failed":
        message = "Check your internet connection";
        break;
      case "auth/too-many-requests": {
        const state = applyFirebaseLockout("signup", email, RATE_LIMIT_OPTIONS);
        message = `Firebase temporarily blocked sign-up attempts. Try again in ${formatCooldown(state.msRemaining)}.`;
        startCooldownTicker();
        break;
      }
      default:
        if (error.code?.startsWith("auth/")) {
          const state = recordFailure("signup", email, RATE_LIMIT_OPTIONS);
          message = state.isLocked
            ? `Too many sign-up attempts. Try again in ${formatCooldown(state.msRemaining)}.`
            : `Signup failed. ${state.remainingAttempts} attempts remaining before a temporary lock.`;
          if (state.isLocked) startCooldownTicker();
        }
        break;
    }

    showStatus(message, "error");

    signupBtn.classList.remove("loading");
    syncRateLimitUi();
  }
});

["fullName", "email", "password", "confirmPw"].forEach((id) => {
  $(id)?.addEventListener("input", function () {
    this.classList.remove("error");

    const map = {
      fullName: "nameErr",
      email: "emailErr",
      password: "pwErr",
      confirmPw: "confirmErr"
    };

    if (id === "email") {
      $("emailErr").textContent = "Please enter a valid email address.";
    }
    $(map[id]).style.display = "none";
    syncRateLimitUi();
  });
});

document.getElementById("googleBtn")?.addEventListener("click", () => {
  window.signInWithGoogle();
});
