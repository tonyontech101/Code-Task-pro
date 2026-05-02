class AppSettingsPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="flex flex-1 overflow-hidden h-full bg-base">
        <!-- Settings Sidebar -->
        <div class="w-[240px] flex flex-col border-r border-white/[0.04] bg-surface flex-shrink-0">
          <div class="p-6">
            <h1 class="text-[18px] font-bold tracking-tight text-white mb-6">Settings</h1>
            <nav class="flex flex-col gap-1">
              <button class="settings-nav-btn active" data-tab="profile" onclick="setSettingsTab('profile')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
                Profile
              </button>
              <button class="settings-nav-btn" data-tab="notifications" onclick="setSettingsTab('notifications')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Notifications
              </button>
              <button class="settings-nav-btn" data-tab="contact" onclick="setSettingsTab('contact')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                Contact
              </button>
            </nav>
          </div>
        </div>

        <!-- Settings Content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar" id="settingsContentArea">


          <!-- Profile Section -->
          <div id="settings-profile" class="settings-section p-10 max-w-2xl mx-auto">
            <h2 class="text-[24px] font-bold text-white mb-2">Profile</h2>
            <p class="text-[14px] text-gray-500 mb-8">Update your username and review your workspace progress.</p>

            <div class="bg-overlay border border-white/5 rounded-2xl p-6 mb-6">
              <div class="flex items-center gap-4 mb-6">
                <div id="profileAvatar" class="w-14 h-14 rounded-2xl bg-cyan/10 text-cyan flex items-center justify-center text-[20px] font-bold">U</div>
                <div class="min-w-0">
                  <h3 id="profileDisplayName" class="text-[17px] font-bold text-white truncate">User</h3>
                  <p id="profileDisplayEmail" class="text-[12.5px] text-gray-500 truncate">email@example.com</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div class="flex flex-col gap-2">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1">Username</label>
                  <input type="text" id="profileUsername" placeholder="Your username" class="settings-input">
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1">Email Address</label>
                  <input type="email" id="profileEmail" class="settings-input" readonly>
                </div>
              </div>

              <div class="flex items-center justify-between gap-4 flex-wrap">
                <p id="profileStatus" class="text-[12.5px] text-gray-500 min-h-[20px]"></p>
                <button onclick="saveProfileSettings()" class="px-6 py-2.5 bg-cyan text-base font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Save Profile
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="settings-stat">
                <span class="settings-stat-label">Tasks Completed</span>
                <strong id="profileTasksCompleted">0</strong>
              </div>
              <div class="settings-stat">
                <span class="settings-stat-label">Tasks To Do</span>
                <strong id="profileTasksTodo">0</strong>
              </div>
              <div class="settings-stat">
                <span class="settings-stat-label">Projects</span>
                <strong id="profileProjectsCount">0</strong>
              </div>
            </div>
          </div>

          <!-- Notifications Section -->
          <div id="settings-notifications" class="settings-section p-10 max-w-2xl mx-auto hidden">
            <div class="mb-8">
              <p class="text-[11px] font-bold uppercase tracking-widest text-cyan mb-2">Preferences</p>
              <h2 class="text-[24px] font-bold text-white mb-2">Notifications</h2>
              <p class="text-[14px] text-gray-500">Choose how CodeFlow alerts you while you work.</p>
            </div>

            <div class="settings-panel">
              <div class="settings-panel-header">
                <div>
                  <h3>Active Notification Features</h3>
                  <p>Controls for alerts currently supported in CodeFlow</p>
                </div>
              </div>

              <div class="settings-option">
                <div class="settings-option-icon text-cyan bg-cyan/10">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 18v3"/></svg>
                </div>
                <div class="settings-option-copy">
                  <h4>Desktop Notifications</h4>
                  <p>Show browser alerts for new direct messages when the app is open in another tab.</p>
                </div>
                <div id="desktopNotificationsToggle" class="settings-toggle" onclick="toggleDesktopNotifications()" role="switch" aria-label="Toggle desktop notifications">
                  <div id="desktopNotificationsToggleDot" class="settings-toggle-dot"></div>
                </div>
              </div>

              <div class="settings-option">
                <div class="settings-option-icon text-purple bg-purple/10">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </div>
                <div class="settings-option-copy">
                  <h4>Sound Effects</h4>
                  <p>Play sounds when you complete tasks, receive inbox updates, or get new messages.</p>
                </div>
                <div id="soundToggle" class="settings-toggle is-on" onclick="toggleSound()" role="switch" aria-label="Toggle notification sounds">
                  <div id="soundToggleDot" class="settings-toggle-dot is-on"></div>
                </div>
              </div>

              <div class="settings-option">
                <div class="settings-option-icon text-green-400 bg-green-500/10">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>
                </div>
                <div class="settings-option-copy">
                  <h4>Unread Indicators</h4>
                  <p>Inbox and chat badges show unread messages and updates automatically.</p>
                </div>
                <span class="settings-option-status">Always on</span>
              </div>
            </div>
          </div>

          <!-- Data Management Section -->
          <div id="settings-data" class="settings-section p-10 max-w-2xl mx-auto hidden">
            <h2 class="text-[24px] font-bold text-white mb-2">Data Management</h2>
            <p class="text-[14px] text-gray-500 mb-8">Export your data or start from scratch.</p>

            <div class="flex flex-col gap-6">
              <div class="p-6 bg-overlay border border-white/5 rounded-2xl">
                <h3 class="text-[15px] font-bold text-gray-200 mb-2">Export Workspace</h3>
                <p class="text-[13px] text-gray-600 mb-6">Download all your tasks, projects, and notes as a portable JSON file.</p>
                <button class="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-gray-300 hover:bg-white/10 transition-all">Download JSON (.json)</button>
              </div>

              <div class="p-6 border border-red-500/20 rounded-2xl bg-red-500/[0.02]">
                <h3 class="text-[15px] font-bold text-red-400 mb-2">Danger Zone</h3>
                <p class="text-[13px] text-gray-600 mb-6">This will permanently delete all your data stored in this browser. This action cannot be undone.</p>
                <button class="px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[13px] font-bold text-red-400 hover:bg-red-500/20 transition-all">Reset All Application Data</button>
              </div>
            </div>
          </div>
          <!-- Contact Section -->
          <div id="settings-contact" class="settings-section p-10 max-w-2xl mx-auto hidden">
            <h2 class="text-[24px] font-bold text-white mb-2">Contact the Developer</h2>
            <p class="text-[14px] text-gray-500 mb-8">Have questions or feedback? Connect with me on social media.</p>

            <div class="contact-status contact-status-warning mb-8">
              This feature is currently unavailable.
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <!-- Facebook -->
              <a href="https://www.facebook.com/anthony.danola.5/" target="_blank" class="p-6 bg-overlay border border-white/5 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/[0.05] transition-all group">
                <div class="w-12 h-12 rounded-xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </div>
                <span class="text-[13px] font-bold text-gray-300">Facebook</span>
              </a>

              <!-- Instagram -->
              <a href="https://www.instagram.com/wonderwallyuz/?__pwa=1" target="_blank" class="p-6 bg-overlay border border-white/5 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/[0.05] transition-all group">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </div>
                <span class="text-[13px] font-bold text-gray-300">Instagram</span>
              </a>

              <!-- GitHub -->
              <a href="https://github.com/wonderwallyuz" target="_blank" class="p-6 bg-overlay border border-white/5 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/[0.05] transition-all group">
                <div class="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </div>
                <span class="text-[13px] font-bold text-gray-300">GitHub</span>
              </a>
            </div>

            <div class="bg-overlay border border-white/5 rounded-2xl p-8">
              <h3 class="text-[16px] font-bold text-white mb-2">Send a Message</h3>
              <p class="text-[12.5px] text-gray-600 mb-6">Direct contact submissions are not connected yet.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div class="flex flex-col gap-2">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1">Full Name</label>
                  <input type="text" id="contactName" placeholder="Your name" class="settings-input">
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1">Email Address</label>
                  <input type="email" id="contactEmail" placeholder="your@email.com" class="settings-input">
                </div>
              </div>
              <div class="flex flex-col gap-2 mb-4">
                <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1">Subject</label>
                <input type="text" id="contactSubject" placeholder="What is this regarding?" class="settings-input">
              </div>
              <div class="flex flex-col gap-2 mb-6">
                <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1">Message</label>
                <textarea id="contactMessage" placeholder="Your message here..." class="settings-input min-h-[120px] py-3 resize-none"></textarea>
              </div>
              <button onclick="sendContactForm()" class="w-full sm:w-auto px-8 py-3 bg-cyan text-base font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send Message
              </button>
              <div id="contactStatus" class="contact-status mt-4" aria-live="polite"></div>
            </div>
          </div>
        </div>
      </div>
    `
  }
}
customElements.define('app-settings-page', AppSettingsPage);
