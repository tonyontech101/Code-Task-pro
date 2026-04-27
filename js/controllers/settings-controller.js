/**
 * settings-controller.js - Logic for the Settings page
 */

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
