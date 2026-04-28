/**
 * settings-controller.js - Logic for the Settings page
 */

import { auth, storage, ref, uploadBytes, getDownloadURL, updateProfile } from "../../config/config.js";
import { getUserProfile, updateUserProfile } from "../modules/data-store.js";
import { showToast } from "../modules/utils.js";

export async function setSettingsTab(tabId) {
  // Update sidebar buttons
  document.querySelectorAll('.settings-nav-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
  });

  // Update content sections
  document.querySelectorAll('.settings-section').forEach(sec => {
    const isTarget = sec.id === `settings-${tabId}`;
    sec.classList.toggle('hidden', !isTarget);
  });

  if (tabId === 'profile') {
    await renderProfile();
  }
}

export async function renderProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const profile = await getUserProfile(user.uid);
  if (!profile) return;

  const nameInput = document.getElementById("profileFullName");
  const jobInput  = document.getElementById("profileJobTitle");
  const emailInput = document.getElementById("profileEmail");
  const avatarEl = document.getElementById("profileAvatarInitials");
  const avatarImg = document.getElementById("profileAvatarImg");

  if (nameInput) nameInput.value = profile.displayName || "";
  if (jobInput)  jobInput.value  = profile.jobTitle || "";
  if (emailInput) emailInput.value = profile.email || "";

  if (profile.photoURL) {
    if (avatarImg) {
      avatarImg.src = profile.photoURL;
      avatarImg.classList.remove("hidden");
    }
    if (avatarEl) avatarEl.classList.add("hidden");
  } else {
    if (avatarImg) avatarImg.classList.add("hidden");
    if (avatarEl) {
      avatarEl.classList.remove("hidden");
      const initials = profile.displayName
        ? profile.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : (profile.email ? profile.email[0].toUpperCase() : "?");
      avatarEl.textContent = initials;
    }
  }
}

export async function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 1024 * 1024) {
    return showToast("File size too large (max 1MB)", "error");
  }

  const user = auth.currentUser;
  if (!user) return;

  showToast("Uploading avatar...");

  try {
    const storageRef = ref(storage, `avatars/${user.uid}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    await updateUserProfile(user.uid, { photoURL: downloadURL });

    // Update Auth profile
    if (updateProfile) {
      await updateProfile(user, { photoURL: downloadURL });
    }

    showToast("Avatar updated successfully!");
    renderProfile();
    // Notify other UI parts (header) about updated auth user
    try { window.dispatchEvent(new CustomEvent('auth-ready', { detail: { user: auth.currentUser } })); } catch (e) {}
  } catch (err) {
    console.error(err);
    showToast("Failed to upload avatar", "error");
  }
}

export async function saveProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const name = document.getElementById("profileFullName")?.value.trim();
  const job  = document.getElementById("profileJobTitle")?.value.trim();

  if (!name) return showToast("Name cannot be empty", "error");

  try {
    await updateUserProfile(user.uid, {
      displayName: name,
      jobTitle: job
    });
    
    // Also update Firebase Auth display name for consistency
    if (updateProfile) {
      await updateProfile(user, { displayName: name });
    }

    showToast("Profile updated successfully!");
    renderProfile();
    // Notify other UI parts (header) about updated auth user
    try { window.dispatchEvent(new CustomEvent('auth-ready', { detail: { user: auth.currentUser } })); } catch (e) {}
  } catch (err) {
    console.error(err);
    showToast("Failed to update profile", "error");
  }
}

export function sendContactForm() {
  const name    = document.getElementById("contactName")?.value.trim();
  const email   = document.getElementById("contactEmail")?.value.trim();
  const subject = document.getElementById("contactSubject")?.value.trim();
  const message = document.getElementById("contactMessage")?.value.trim();

  if (!name || !email || !message) return alert("Please fill in required fields.");

  alert("Thanks for reaching out! This demo form is not connected to a backend, but in a real app this would be sent to the developer.");
  
  // Clear form
  if (document.getElementById("contactName")) document.getElementById("contactName").value = "";
  if (document.getElementById("contactEmail")) document.getElementById("contactEmail").value = "";
  if (document.getElementById("contactSubject")) document.getElementById("contactSubject").value = "";
  if (document.getElementById("contactMessage")) document.getElementById("contactMessage").value = "";
}
