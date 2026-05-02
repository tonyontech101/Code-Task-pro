/**
 * settings-controller.js - Logic for the Settings page
 */

import { state } from '../modules/state.js';

export function setSettingsTab(tabId) {
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
}

function renderToggle(toggleId, dotId, enabled) {
  const toggle = document.getElementById(toggleId);
  const dot = document.getElementById(dotId);

  if (toggle && dot) {
    toggle.className = `w-10 h-5 rounded-full relative cursor-pointer transition-colors ${enabled ? 'bg-cyan/20' : 'bg-white/10'}`;
    dot.className = `absolute top-1 w-3 h-3 rounded-full transition-all ${enabled ? 'right-1 bg-cyan' : 'left-1 bg-gray-500'}`;
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

export function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  renderToggle('soundToggle', 'soundToggleDot', state.soundEnabled);
}

export async function toggleDesktopNotifications() {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notifications.");
    state.desktopNotificationsEnabled = false;
    renderNotificationSettings();
    return;
  }

  if (state.desktopNotificationsEnabled) {
    state.desktopNotificationsEnabled = false;
    renderNotificationSettings();
    return;
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();

  state.desktopNotificationsEnabled = permission === "granted";
  if (!state.desktopNotificationsEnabled) {
    alert("Desktop notifications are blocked. Enable them in your browser settings to get alerts in other tabs.");
  }
  renderNotificationSettings();
}

export function renderNotificationSettings() {
  if ("Notification" in window && Notification.permission === "denied") {
    state.desktopNotificationsEnabled = false;
  }

  renderToggle('soundToggle', 'soundToggleDot', state.soundEnabled);
  renderToggle('desktopNotificationsToggle', 'desktopNotificationsToggleDot', state.desktopNotificationsEnabled);
}
