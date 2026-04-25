// ── SAFE GET ──
const $ = (id) => document.getElementById(id);

// ── PASSWORD TOGGLE ──
function makeToggle(btnId, inputId) {
  const btn = $(btnId);
  const inp = $(inputId);
  if (!btn || !inp) return;

  btn.addEventListener('click', () => {
    const isHidden = inp.type === 'password';
    inp.type = isHidden ? 'text' : 'password';
  });
}

makeToggle('togglePw', 'password');
makeToggle('toggleConfirm', 'confirmPw');


// ── PASSWORD STRENGTH ──
const pwColors = ['#f75f5f','#f7a55f','#f7d45f','#4fd18a'];

$('password')?.addEventListener('input', function () {
  const v = this.value;
  let score = 0;

  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;

  ['s1','s2','s3','s4'].forEach((id, i) => {
    const el = $(id);
    if (!el) return;
    el.style.background = i < score ? pwColors[score - 1] : 'var(--border)';
  });

  const labels = ['Too weak','Weak','Good','Strong'];
  $('pwHint').textContent =
    v.length === 0 ? 'At least 8 characters' : labels[score - 1] || 'Too weak';
});


// ── VALIDATION ──
function showErr(inputId, errId, show) {
  const inp = $(inputId);
  const err = $(errId);
  if (!inp || !err) return;

  inp.classList.toggle('error', show);
  err.style.display = show ? 'block' : 'none';
}


// ── SIGNUP (FIREBASE) ──
$('signupBtn')?.addEventListener('click', async () => {
  const name  = $('fullName').value.trim();
  const email = $('email').value.trim();
  const pw    = $('password').value;
  const cpw   = $('confirmPw').value;
  const terms = $('terms').checked;

  let valid = true;

  if (!name) {
    showErr('fullName','nameErr',true);
    valid = false;
  } else showErr('fullName','nameErr',false);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('email','emailErr',true);
    valid = false;
  } else showErr('email','emailErr',false);

  if (pw.length < 8) {
    showErr('password','pwErr',true);
    valid = false;
  } else showErr('password','pwErr',false);

  if (pw !== cpw) {
    showErr('confirmPw','confirmErr',true);
    valid = false;
  } else showErr('confirmPw','confirmErr',false);

  const termsErr = $('termsErr');
  if (!terms) {
    termsErr.style.display = 'block';
    valid = false;
  } else {
    termsErr.style.display = 'none';
  }

  if (!valid) return;

  const btn = $('signupBtn');

  // Prevent double click
  if (btn.classList.contains('loading')) return;

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    // 🔥 CREATE USER
    const userCredential = await window.createUserWithEmailAndPassword(
      window.auth,
      email,
      pw
    );

    // 🔥 SAVE DISPLAY NAME
    if (window.updateProfile) {
      await window.updateProfile(userCredential.user, {
        displayName: name
      });
    }

    console.log("User created:", userCredential.user);

    // ✅ SUCCESS UI
    $('formView').style.display = 'none';
    $('successView').classList.add('show');

  } catch (error) {
    console.error(error);

    let message = "Signup failed";

    switch (error.code) {
      case "auth/email-already-in-use":
        message = "Email already exists";
        break;
      case "auth/weak-password":
        message = "Password must be at least 6 characters";
        break;
      case "auth/invalid-email":
        message = "Invalid email address";
        break;
      case "auth/network-request-failed":
        message = "Check your internet connection";
        break;
      case "auth/too-many-requests":
        message = "Too many attempts. Try again later";
        break;
    }

    alert(message);

    btn.classList.remove('loading');
    btn.disabled = false;
  }
});


// ── LIVE ERROR CLEAR ──
['fullName','email','password','confirmPw'].forEach(id => {
  $(id)?.addEventListener('input', function () {
    this.classList.remove('error');

    const map = {
      fullName: 'nameErr',
      email: 'emailErr',
      password: 'pwErr',
      confirmPw: 'confirmErr'
    };

    $(map[id]).style.display = 'none';
  });
});

// ── GOOGLE SIGN-UP ──
document.getElementById("googleBtn")?.addEventListener("click", () => {
  window.signInWithGoogle();
});
