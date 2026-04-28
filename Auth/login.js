import {
  applyFirebaseLockout,
  formatCooldown,
  getRateLimitState,
  isCountableAuthError,
  recordFailure,
  resetRateLimit
} from "./rate-limit.js";

const RATE_LIMIT_OPTIONS = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  cooldownMs: 15 * 60 * 1000
};

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("togglePw");
  const passwordInput = document.getElementById("password");
  const emailInput = document.getElementById("email");
  const signinBtn = document.getElementById("signinBtn");
  const formView = document.getElementById("formView");
  const successView = document.getElementById("successView");
  const googleBtn = document.getElementById("googleLoginBtn");
  const statusEl = document.getElementById("authStatus");
  const defaultButtonText = signinBtn?.querySelector(".btn-text")?.textContent || "Sign in";

  let cooldownTimer = null;

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";

      toggleBtn.querySelector("svg").innerHTML = isHidden
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    });
  }

  const showErr = (inputId, errId, hasError) => {
    const field = document.getElementById(inputId);
    const errMsg = document.getElementById(errId);

    if (field) field.classList.toggle("error", hasError);
    if (errMsg) errMsg.style.display = hasError ? "block" : "none";
  };

  const showStatus = (message = "", tone = "") => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `status-msg${tone ? ` ${tone}` : ""}`;
  };

  const setButtonState = (state) => {
    if (!signinBtn) return;

    if (state.isLocked) {
      signinBtn.disabled = true;
      signinBtn.classList.remove("loading");
      signinBtn.querySelector(".btn-text").textContent = `Try again in ${formatCooldown(state.msRemaining)}`;
      return;
    }

    signinBtn.disabled = false;
    signinBtn.querySelector(".btn-text").textContent = defaultButtonText;
  };

  const syncRateLimitUi = () => {
    const email = emailInput?.value?.trim() || "";
    const state = getRateLimitState("login", email, RATE_LIMIT_OPTIONS);

    setButtonState(state);

    if (state.isLocked) {
      showStatus(
        `Too many sign-in attempts. Try again in ${formatCooldown(state.msRemaining)}.`,
        "error"
      );
    } else if (email && state.remainingAttempts < state.maxAttempts) {
      showStatus(
        `${state.remainingAttempts} of ${state.maxAttempts} sign-in attempts remaining before a temporary lock.`,
        "error"
      );
    } else {
      showStatus("");
    }

    return state;
  };

  const startCooldownTicker = () => {
    if (cooldownTimer) window.clearInterval(cooldownTimer);
    cooldownTimer = window.setInterval(() => {
      const state = syncRateLimitUi();
      if (!state.isLocked) {
        window.clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
    }, 1000);
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  syncRateLimitUi();

  if (signinBtn) {
    signinBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const emailVal = emailInput.value.trim();
      const passVal = passwordInput.value;

      let isValid = true;

      if (!emailVal || !isValidEmail(emailVal)) {
        showErr("email", "emailErr", true);
        isValid = false;
      } else {
        showErr("email", "emailErr", false);
      }

      if (!passVal) {
        showErr("password", "pwErr", true);
        isValid = false;
      } else {
        showErr("password", "pwErr", false);
      }

      if (!isValid) return;

      const currentState = getRateLimitState("login", emailVal, RATE_LIMIT_OPTIONS);
      if (currentState.isLocked) {
        syncRateLimitUi();
        startCooldownTicker();
        return;
      }

      signinBtn.classList.add("loading");
      signinBtn.disabled = true;
      showStatus("");

      try {
        const userCredential = await window.signInWithEmailAndPassword(
          window.auth,
          emailVal,
          passVal
        );

        resetRateLimit("login", emailVal);
        showStatus("Sign-in successful. Redirecting...", "success");

        console.log("Login success:", userCredential.user);

        formView.style.display = "none";
        successView.classList.add("show");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 800);
      } catch (error) {
        console.error(error);

        let msg = "Login failed";

        if (isCountableAuthError(error.code)) {
          const state = recordFailure("login", emailVal, RATE_LIMIT_OPTIONS);
          if (state.isLocked) {
            msg = `Too many sign-in attempts. Try again in ${formatCooldown(state.msRemaining)}.`;
            startCooldownTicker();
          } else {
            msg = `Login failed. ${state.remainingAttempts} attempts remaining before a temporary lock.`;
          }
        } else if (error.code === "auth/too-many-requests") {
          const state = applyFirebaseLockout("login", emailVal, RATE_LIMIT_OPTIONS);
          msg = `Firebase temporarily blocked sign-in attempts. Try again in ${formatCooldown(state.msRemaining)}.`;
          startCooldownTicker();
        } else if (error.code === "auth/network-request-failed") {
          msg = "Check your internet connection and try again.";
        }

        showStatus(msg, "error");
        signinBtn.classList.remove("loading");
        syncRateLimitUi();
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        await window.signInWithGoogle();
      } catch (err) {
        console.error(err);
      }
    });
  }

  [
    { id: "email", errId: "emailErr" },
    { id: "password", errId: "pwErr" }
  ].forEach(({ id, errId }) => {
    const inputEl = document.getElementById(id);
    if (!inputEl) return;

    inputEl.addEventListener("input", function () {
      this.classList.remove("error");
      const errMsg = document.getElementById(errId);
      if (errMsg) errMsg.style.display = "none";
      syncRateLimitUi();
    });
  });
});
