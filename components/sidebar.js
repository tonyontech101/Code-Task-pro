class AppSidebar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <div class="fixed inset-0 bg-black/60 z-40 hidden sidebar-backdrop backdrop-blur-sm" onclick="document.body.classList.remove('sidebar-open')"></div>
        <aside class="fixed inset-y-0 left-0 z-50 transform -translate-x-full md:relative md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-shrink-0 border-r border-white/[0.06] bg-base h-full">

        <!-- Icon Rail -->
        <nav class="flex flex-col items-center w-14 py-3 gap-0.5 border-r border-white/[0.06] bg-surface">
            <!-- Logo -->
            <div class="flex items-center justify-center w-9 h-9 mb-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#00d4c8" opacity="0.9"/>
                <path d="M2 17l10 5 10-5" stroke="#8b5cf6" stroke-width="2" fill="none"/>
                <path d="M2 12l10 5 10-5" stroke="#00d4c8" stroke-width="2" fill="none" opacity="0.6"/>
            </svg>
            </div>

            <button class="rail-btn active" title="Dashboard" data-tip="Dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </button>
            <button class="rail-btn" title="Projects">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="rail-btn" title="Friends">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </button>
            <button class="rail-btn" title="Notes">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="rail-btn relative" title="Inbox">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
            <span id="railInboxBadge" class="inbox-rail-badge hidden">0</span>
            </button>
            <button class="rail-btn" title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>

            <div class="flex-1"></div>

            <button class="rail-btn text-gray-600 hover:text-red-400 hover:bg-red-500/10" title="Logout" onclick="openLogoutModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
        </nav>

        <!-- Sidebar Panel: Default (Projects/Priority/Labels) -->
        <div id="sidebarDefaultPanel" class="w-[220px] bg-surface flex flex-col py-5 gap-2 overflow-y-auto h-full">

            <!-- Projects (dynamically rendered by app.js) --> 
            <div class="px-3 mb-2">
            <span class="block text-[11px] font-semibold tracking-widest uppercase text-gray-600 px-2 mb-2">Projects</span>
            <ul class="space-y-0.5" id="sidebarProjects">
                <!-- populated by renderSidebarProjects() -->
            </ul>
            </div>

            <!-- Priority -->
            <div class="px-3 mb-2">
            <span class="block text-[11px] font-semibold tracking-widest uppercase text-gray-600 px-2 mb-2">Priority</span>
            <ul class="space-y-0.5" id="sidebarPriority">
                <li><button class="sidebar-item sidebar-priority w-full active" data-priority="all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span class="text-gray-400">All Priorities</span>
                </button></li>
                <li><button class="sidebar-item sidebar-priority w-full" data-priority="urgent">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span class="text-gray-400">Urgent</span>
                </button></li>
                <li><button class="sidebar-item sidebar-priority w-full" data-priority="high">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span class="text-gray-400">High</span>
                </button></li>
                <li><button class="sidebar-item sidebar-priority w-full" data-priority="low">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span class="text-gray-400">Low</span>
                </button></li>
            </ul>
            </div>

            <!-- Labels -->
            <div class="px-3 mb-2">
            <span class="block text-[11px] font-semibold tracking-widest uppercase text-gray-600 px-2 mb-2">Labels</span>
            <ul class="space-y-0.5" id="sidebarTagLabels">
                <li><button class="sidebar-item sidebar-label w-full active" data-label="all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span class="text-gray-400">All Labels</span>
                </button></li>
                <li><button class="sidebar-item sidebar-label w-full" data-label="wip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span class="text-gray-400">WIP</span>
                </button></li>
                <li><button class="sidebar-item sidebar-label w-full" data-label="backend">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span class="text-gray-400">Backend</span>
                </button></li>
            </ul>
            </div>

            <!-- Inbox -->
            <div class="px-3 mt-auto pt-3 border-t border-white/[0.06]">
            <button class="sidebar-item sidebar-inbox w-full" data-action="inbox">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                <span>Inbox</span>
                <span id="inboxBadge" class="ml-auto text-[11px] font-semibold text-gray-400 bg-overlay border border-white/10 rounded-full px-2 py-0.5 hidden">0</span>
            </button>
            </div>

        </div>

        <!-- Sidebar Panel: Inbox Chats (hidden by default) -->
        <div id="sidebarInboxPanel" class="w-[220px] bg-surface flex flex-col overflow-hidden hidden h-full">

            <!-- Inbox Sidebar Header -->
            <div class="flex items-center justify-between px-4 pt-4 pb-2">
              <span class="text-[11px] font-semibold tracking-widest uppercase text-gray-600">Friends</span>
              <button class="icon-btn" title="Back to Notifications" onclick="closeChatView()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
              </button>
            </div>

            <!-- Sidebar Search -->
            <div class="px-3 pb-2">
              <div class="sidebar-chat-search">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input id="sidebarChatSearch" type="text" placeholder="Search..." oninput="filterSidebarChats(this.value)" />
              </div>
            </div>

            <!-- Sidebar Contact List -->
            <div id="sidebarChatList" class="flex-1 overflow-y-auto px-2 pb-3">
              <!-- Populated by renderSidebarChatList() -->
            </div>
        </div>

        </aside>
    `;
  }
}
customElements.define('app-sidebar', AppSidebar);
