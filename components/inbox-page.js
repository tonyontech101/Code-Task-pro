class AppInboxPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="flex flex-1 overflow-hidden">

        <!-- Main Chat / Notifications Area -->
        <div class="flex flex-col flex-1 overflow-hidden min-w-0">

          <!-- View Toggle: Notifications / Chat -->
          <div id="inboxMainView" class="flex flex-col flex-1 overflow-hidden">

            <!-- Notifications View (default) -->
            <div id="inboxNotificationsView" class="flex flex-col flex-1 overflow-hidden">
              <!-- Inbox Header -->
              <div class="flex flex-col sm:flex-row sm:items-start justify-between px-4 md:px-7 pt-5 md:pt-6 pb-3 md:pb-4 flex-shrink-0 gap-3">
                <div>
                  <h1 class="text-[18px] md:text-[20px] font-bold tracking-tight">Inbox <span id="inboxCount" class="text-[14px] font-medium text-gray-600">(0)</span></h1>
                  <p class="text-[12.5px] text-gray-600 mt-0.5">Notifications and updates</p>
                </div>
                <div class="flex items-center gap-2 inbox-header-actions">
                  <button id="inboxMarkAllRead" class="flex items-center gap-1.5 px-3 py-2 md:py-1.5 text-[12.5px] text-gray-400 bg-overlay border border-white/10 rounded-lg hover:bg-hover hover:text-gray-200 transition-all flex-1 sm:flex-none justify-center" onclick="markAllInboxRead()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    <span>Mark all read</span>
                  </button>
                  <button class="flex items-center gap-1.5 px-3 py-2 md:py-1.5 text-[12.5px] text-gray-400 bg-overlay border border-white/10 rounded-lg hover:bg-hover hover:text-red-400 transition-all flex-1 sm:flex-none justify-center" onclick="clearAllInbox()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <span>Clear all</span>
                  </button>
                </div>
              </div>

              <!-- Inbox Filter Tabs -->
              <div class="flex items-center gap-1 px-4 md:px-7 mb-4 flex-shrink-0 overflow-x-auto custom-scrollbar pb-1">
                <button class="inbox-tab active" data-filter="all" onclick="filterInbox('all')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                  All
                </button>
                <button class="inbox-tab" data-filter="unread" onclick="filterInbox('unread')">
                  <span class="inbox-tab-dot"></span>
                  Unread
                </button>
                <button class="inbox-tab" data-filter="task" onclick="filterInbox('task')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Tasks
                </button>
                <button class="inbox-tab" data-filter="project" onclick="filterInbox('project')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  Projects
                </button>
                <button class="inbox-tab" data-filter="invitation" onclick="filterInbox('invitation')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6"/><path d="m22 10-10 6L2 10"/><path d="M2 10l10-6 10 6"/></svg>
                  Invites
                </button>
                <button class="inbox-tab" data-filter="mention" onclick="filterInbox('mention')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
                  Mentions
                </button>
                <button class="inbox-tab" data-filter="system" onclick="filterInbox('system')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  System
                </button>
              </div>

              <!-- Inbox List -->
              <div class="flex-1 overflow-y-auto px-4 md:px-7 pb-6">
                <div id="inboxList" class="flex flex-col gap-2">
                  <!-- Populated by renderInbox() -->
                </div>
              </div>
            </div>

            <!-- Chat View (shown when a contact is selected) -->
            <div id="inboxChatView" class="flex flex-col flex-1 overflow-hidden hidden">

              <!-- Chat Header -->
              <div class="chat-header">
                <button class="icon-btn" onclick="closeChatView()" title="Back to Notifications">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div id="chatHeaderAvatar" class="chat-header-avatar"></div>
                <div class="chat-header-info">
                  <span id="chatHeaderName" class="chat-header-name">—</span>
                  <span id="chatHeaderStatus" class="chat-header-status">Offline</span>
                </div>
                <div class="ml-auto flex items-center gap-3">
                  <button class="icon-btn" title="Search Conversation">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                  <div class="w-px h-4 bg-white/5"></div>
                  <button class="icon-btn" title="More Options">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  </button>
                </div>
              </div>

              <!-- Chat Messages -->
              <div id="chatMessagesContainer" class="chat-messages-container">
                <div id="chatMessages" class="chat-messages">
                  <!-- Populated by renderChatMessages() -->
                </div>
              </div>

              <!-- Chat Input -->
              <div class="chat-input-container flex-col items-stretch">
                <!-- File Preview Area -->
                <div id="chatFilePreviewContainer" class="hidden mb-2 px-3 py-2 bg-elevated border border-white/10 rounded-xl flex items-center justify-between">
                  <div class="flex items-center gap-2 overflow-hidden">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-cyan shrink-0"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                    <span id="chatFilePreviewName" class="text-[12px] text-gray-300 truncate">filename.png</span>
                  </div>
                  <button class="text-gray-500 hover:text-red-400 p-1 shrink-0" onclick="window.clearChatFileSelection()" title="Remove file">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                
                <div class="flex items-center gap-2 w-full">
                  <div class="chat-input-wrap flex-1">
                    <input type="file" id="chatFileInput" class="hidden" onchange="window.handleChatFileSelect(event)" />
                    <button class="icon-btn chat-attach-btn mr-1" title="Attach File" onclick="document.getElementById('chatFileInput').click()">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </button>
                    <input id="chatInput" type="text" placeholder="Send a message..." onkeydown="if(event.key==='Enter')sendChatMessage()" />
                    <button class="icon-btn chat-emoji-btn ml-1" title="Emoji">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    </button>
                  </div>
                  <button id="chatSendBtn" class="chat-send-btn" onclick="sendChatMessage()" title="Send Message">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('app-inbox-page', AppInboxPage);
