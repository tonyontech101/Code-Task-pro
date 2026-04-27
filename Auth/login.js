document.addEventListener('DOMContentLoaded', () => {
  // ── DOM ELEMENTS ──
  const toggleBtn = document.getElementById('togglePw');
  const passwordInput = document.getElementById('password');
  const emailInput = document.getElementById('email');
  const signinBtn = document.getElementById('signinBtn');
  const formView = document.getElementById('formView');
  const successView = document.getElementById('successView');
  const googleBtn = document.getElementById('googleLoginBtn');

  // ── PASSWORD TOGGLE ──
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';

      toggleBtn.querySelector('svg').innerHTML = isHidden
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    });
  }

  // ── VALIDATION HELPERS ──
  const showErr = (inputId, errId, hasError) => {
    const field = document.getElementById(inputId);
    const errMsg = document.getElementById(errId);

    if (field) field.classList.toggle('error', hasError);
    if (errMsg) errMsg.style.display = hasError ? 'block' : 'none';
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ── EMAIL/PASSWORD LOGIN (FIREBASE) ──
  if (signinBtn) {
    signinBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const emailVal = emailInput.value.trim();
      const passVal = passwordInput.value;

      let isValid = true;

      if (!emailVal || !isValidEmail(emailVal)) {
        showErr('email', 'emailErr', true);
        isValid = false;
      } else showErr('email', 'emailErr', false);

      if (!passVal) {
        showErr('password', 'pwErr', true);
        isValid = false;
      } else showErr('password', 'pwErr', false);

      if (!isValid) return;

      signinBtn.classList.add('loading');
      signinBtn.disabled = true;

      try {
        const userCredential = await window.signInWithEmailAndPassword(
          window.auth,
          emailVal,
          passVal
        );

        console.log("Login success:", userCredential.user);

        formView.style.display = 'none';
        successView.classList.add('show');

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);

      } catch (error) {
        console.error(error);

        let msg = "Login failed";

        switch (error.code) {
          case "auth/user-not-found":
            msg = "User not found";
            break;
          case "auth/wrong-password":
            msg = "Incorrect password";
            break;
          case "auth/invalid-email":
            msg = "Invalid email format";
            break;
          case "auth/too-many-requests":
            msg = "Too many attempts. Try again later";
            break;
        }

        alert(msg);

        signinBtn.classList.remove('loading');
        signinBtn.disabled = false;
      }
    });
  }

  // ── GOOGLE LOGIN ──
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        await window.signInWithGoogle();
      } catch (err) {
        console.error(err);
      }
    });
  }

  // ── LIVE ERROR CLEARING ──
  const inputsToValidate = [
    { id: 'email', errId: 'emailErr' },
    { id: 'password', errId: 'pwErr' }
  ];

  inputsToValidate.forEach(({ id, errId }) => {
    const inputEl = document.getElementById(id);
    if (inputEl) {
      inputEl.addEventListener('input', function () {
        this.classList.remove('error');
        const errMsg = document.getElementById(errId);
        if (errMsg) errMsg.style.display = 'none';
      });
    }
  });
});