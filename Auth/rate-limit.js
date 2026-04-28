const DEFAULT_LIMITS = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  cooldownMs: 15 * 60 * 1000
};

function getStorageKey(action, email = "") {
  const normalizedEmail = email.trim().toLowerCase() || "anonymous";
  return `codetask:auth-rate-limit:${action}:${normalizedEmail}`;
}

function readEntry(action, email) {
  try {
    const raw = window.localStorage.getItem(getStorageKey(action, email));
    if (!raw) return null;

    const entry = JSON.parse(raw);
    if (!entry || !Array.isArray(entry.failures)) return null;

    return entry;
  } catch {
    return null;
  }
}

function writeEntry(action, email, entry) {
  window.localStorage.setItem(getStorageKey(action, email), JSON.stringify(entry));
}

function clearEntry(action, email) {
  window.localStorage.removeItem(getStorageKey(action, email));
}

function pruneFailures(failures, windowMs) {
  const now = Date.now();
  return failures.filter((timestamp) => now - timestamp < windowMs);
}

export function getRateLimitState(action, email = "", options = {}) {
  const settings = { ...DEFAULT_LIMITS, ...options };
  const entry = readEntry(action, email);
  const failures = pruneFailures(entry?.failures || [], settings.windowMs);
  const lockedUntil = entry?.lockedUntil || 0;
  const now = Date.now();
  const isLocked = lockedUntil > now;
  const remainingAttempts = Math.max(settings.maxAttempts - failures.length, 0);

  if (entry && failures.length !== entry.failures.length) {
    writeEntry(action, email, { ...entry, failures });
  }

  if (entry && failures.length === 0 && !isLocked) {
    clearEntry(action, email);
  }

  return {
    isLocked,
    lockedUntil,
    msRemaining: isLocked ? lockedUntil - now : 0,
    failures,
    remainingAttempts,
    maxAttempts: settings.maxAttempts
  };
}

export function recordFailure(action, email = "", options = {}) {
  const settings = { ...DEFAULT_LIMITS, ...options };
  const current = getRateLimitState(action, email, settings);
  const failures = [...current.failures, Date.now()];
  const shouldLock = failures.length >= settings.maxAttempts;
  const lockedUntil = shouldLock ? Date.now() + settings.cooldownMs : 0;

  writeEntry(action, email, { failures, lockedUntil });

  return getRateLimitState(action, email, settings);
}

export function resetRateLimit(action, email = "") {
  clearEntry(action, email);
}

export function applyFirebaseLockout(action, email = "", options = {}) {
  const settings = { ...DEFAULT_LIMITS, ...options };
  writeEntry(action, email, {
    failures: [],
    lockedUntil: Date.now() + settings.cooldownMs
  });

  return getRateLimitState(action, email, settings);
}

export function isCountableAuthError(code) {
  return [
    "auth/invalid-credential",
    "auth/user-not-found",
    "auth/wrong-password",
    "auth/invalid-email"
  ].includes(code);
}

export function formatCooldown(msRemaining) {
  const totalSeconds = Math.max(Math.ceil(msRemaining / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}
