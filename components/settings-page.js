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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profile
              </button>
              <button class="settings-nav-btn" data-tab="appearance" onclick="setSettingsTab('appearance')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20v-2a8 8 0 0 0 0-16V2z"/></svg>
                Appearance
              </button>
              <button class="settings-nav-btn" data-tab="notifications" onclick="setSettingsTab('notifications')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Notifications
              </button>
              <button class="settings-nav-btn" data-tab="donations" onclick="setSettingsTab('donations')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                Donations
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
            <p class="text-[14px] text-gray-500 mb-8">Manage your public presence and account details.</p>
            
            <div class="flex flex-col gap-6">
              <div class="flex items-center gap-6 pb-6 border-b border-white/[0.04]">
                <div class="relative w-20 h-20">
                  <div id="profileAvatarInitials" class="w-full h-full rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[24px] font-bold text-white shadow-2xl">--</div>
                  <img id="profileAvatarImg" class="absolute inset-0 w-full h-full rounded-full object-cover hidden shadow-2xl" src="" alt="Avatar">
                </div>
                <div>
                  <input type="file" id="avatarFileInput" class="hidden" accept="image/*" onchange="handleAvatarUpload(event)">
                  <button class="px-4 py-2 bg-overlay border border-white/10 rounded-xl text-[13px] font-semibold text-gray-300 hover:bg-hover transition-all" onclick="document.getElementById('avatarFileInput').click()">Change Avatar</button>
                  <p class="text-[11px] text-gray-600 mt-2 uppercase tracking-widest font-bold">JPG, PNG or GIF. Max 1MB.</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1">Full Name</label>
                  <input type="text" id="profileFullName" class="settings-input">
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1">Job Title</label>
                  <input type="text" id="profileJobTitle" placeholder="e.g. Senior Developer" class="settings-input">
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1">Email Address</label>
                <input type="email" id="profileEmail" class="settings-input" readonly disabled>
                <p class="text-[11px] text-gray-600 ml-1 italic">Email address cannot be changed.</p>
              </div>

              <div class="pt-4">
                <button onclick="saveProfile()" class="px-6 py-2.5 bg-cyan text-base font-bold rounded-xl hover:opacity-90 transition-all active:scale-95">Save Changes</button>
              </div>
            </div>
          </div>

          <!-- Appearance Section -->
          <div id="settings-appearance" class="settings-section p-10 max-w-2xl mx-auto hidden">
            <h2 class="text-[24px] font-bold text-white mb-2">Appearance</h2>
            <p class="text-[14px] text-gray-500 mb-8">Customize how CodeTask Pro looks and feels.</p>

            <div class="flex flex-col gap-8">
              <div>
                <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1 block mb-3">Theme Mode</label>
                <div class="grid grid-cols-3 gap-4">
                  <div class="theme-card active">
                    <div class="w-full h-16 bg-base rounded-lg mb-2 border border-white/5"></div>
                    <span class="text-[12px] font-medium text-gray-400">Dark</span>
                  </div>
                  <div class="theme-card opacity-50">
                    <div class="w-full h-16 bg-gray-100 rounded-lg mb-2 border border-black/5"></div>
                    <span class="text-[12px] font-medium text-gray-600">Light</span>
                  </div>
                  <div class="theme-card opacity-50">
                    <div class="w-full h-16 bg-gradient-to-r from-base to-gray-200 rounded-lg mb-2 border border-white/5"></div>
                    <span class="text-[12px] font-medium text-gray-600">System</span>
                  </div>
                </div>
              </div>

              <div>
                <label class="text-[11px] font-bold uppercase tracking-widest text-gray-600 ml-1 block mb-3">Accent Color</label>
                <div class="flex gap-3">
                  <div class="w-8 h-8 rounded-full bg-cyan cursor-pointer ring-2 ring-white ring-offset-4 ring-offset-base"></div>
                  <div class="w-8 h-8 rounded-full bg-purple cursor-pointer hover:scale-110 transition-all"></div>
                  <div class="w-8 h-8 rounded-full bg-red-500 cursor-pointer hover:scale-110 transition-all"></div>
                  <div class="w-8 h-8 rounded-full bg-amber-500 cursor-pointer hover:scale-110 transition-all"></div>
                  <div class="w-8 h-8 rounded-full bg-green-500 cursor-pointer hover:scale-110 transition-all"></div>
                </div>
              </div>

              <div class="flex items-center justify-between p-4 bg-overlay border border-white/5 rounded-2xl">
                <div>
                  <h3 class="text-[14px] font-bold text-gray-200">Reduced Motion</h3>
                  <p class="text-[12px] text-gray-600">Disable transitions and animations.</p>
                </div>
                <div class="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer">
                  <div class="absolute left-1 top-1 w-3 h-3 bg-gray-500 rounded-full transition-all"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Notifications Section -->
          <div id="settings-notifications" class="settings-section p-10 max-w-2xl mx-auto hidden">
            <h2 class="text-[24px] font-bold text-white mb-2">Notifications</h2>
            <p class="text-[14px] text-gray-500 mb-8">Control when and how you get notified.</p>

            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between p-5 bg-overlay border border-white/5 rounded-2xl">
                <div>
                  <h3 class="text-[14px] font-bold text-gray-200">Desktop Notifications</h3>
                  <p class="text-[12px] text-gray-600">Receive alerts when tasks are due soon.</p>
                </div>
                <div class="w-10 h-5 bg-cyan/20 rounded-full relative cursor-pointer">
                  <div class="absolute right-1 top-1 w-3 h-3 bg-cyan rounded-full transition-all"></div>
                </div>
              </div>

              <div class="flex items-center justify-between p-5 bg-overlay border border-white/5 rounded-2xl">
                <div>
                  <h3 class="text-[14px] font-bold text-gray-200">Sound Effects</h3>
                  <p class="text-[12px] text-gray-600">Play a sound when completing a task.</p>
                </div>
                <div class="w-10 h-5 bg-cyan/20 rounded-full relative cursor-pointer">
                  <div class="absolute right-1 top-1 w-3 h-3 bg-cyan rounded-full transition-all"></div>
                </div>
              </div>

              <div class="flex items-center justify-between p-5 bg-overlay border border-white/5 rounded-2xl">
                <div>
                  <h3 class="text-[14px] font-bold text-gray-200">Email Digest</h3>
                  <p class="text-[12px] text-gray-600">Weekly summary of your team activity.</p>
                </div>
                <div class="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer">
                  <div class="absolute left-1 top-1 w-3 h-3 bg-gray-500 rounded-full transition-all"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Donations Section -->
          <div id="settings-donations" class="settings-section p-10 max-w-2xl mx-auto hidden">
            <div class="text-center mb-10">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan/10 text-cyan mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <h2 class="text-[28px] font-bold text-white mb-3">Support CodeTask Pro</h2>
              <p class="text-[15px] text-gray-500 leading-relaxed max-w-md mx-auto">
                Love using CodeTask Pro? Your support helps me keep the servers running and continue developing new features for the community.
              </p>
            </div>

            <div class="flex flex-col items-center gap-8">
              <div class="relative group">
                <!-- Decorative glow -->
                <div class="absolute -inset-1 bg-gradient-to-r from-cyan to-purple rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                
                <div class="relative bg-white rounded-2xl p-2 shadow-2xl overflow-hidden max-w-[280px]">
                  <!-- QR Code Container with "crop" effect -->
                  <div class="rounded-xl overflow-hidden bg-gray-50 aspect-[4/5] flex items-center justify-center">
                    <img src="assets/image/cashg.jpg" alt="GCash QR Code" class="w-full h-full object-cover scale-[1.02]">
                  </div>
                  <div class="pt-3 pb-2 text-center">
                    <p class="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Scan to Donate</p>
                    <p class="text-[14px] font-bold text-blue-600">GCash</p>
                  </div>
                </div>
              </div>

              <div class="bg-overlay border border-white/5 rounded-2xl p-6 text-center w-full max-w-sm">
                <p class="text-[13px] text-gray-400 italic">
                  "Every small contribution makes a huge difference. Thank you for being part of this journey!"
                </p>
                <div class="mt-4 pt-4 border-t border-white/5">
                  <p class="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Developer</p>
                  <p class="text-[14px] font-semibold text-gray-200 mt-1">@wonderwallyuz</p>
                </div>
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
            <p class="text-[14px] text-gray-500 mb-8">Have questions or feedback? Connect with me on social media or via email.</p>

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
              <h3 class="text-[16px] font-bold text-white mb-6">Send a Message</h3>
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
            </div>
          </div>
        </div>
      </div>
    `
  }
}
customElements.define('app-settings-page', AppSettingsPage);
