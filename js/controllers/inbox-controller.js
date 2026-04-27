/**
 * inbox-controller.js - Logic for the Inbox and Chat system
 */

import { state } from '../modules/state.js';
import { getContactGradient, getStatusColor } from '../modules/utils.js';

export function renderInbox() {
  const list  = document.getElementById("inboxList");
  const count = document.getElementById("inboxCount");
  if (!list) return;

  const filtered = state.inboxFilter === "all"
    ? state.inboxItems
    : state.inboxFilter === "unread"
      ? state.inboxItems.filter(n => !n.read)
      : state.inboxItems.filter(n => n.type === state.inboxFilter);

  if (count) count.textContent = `(${filtered.length})`;

  // Update sidebar badge
  const unreadCount = state.inboxItems.filter(n => !n.read).length;
  const badge = document.getElementById("inboxBadge");
  if (badge) badge.textContent = unreadCount;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="inbox-empty">
        <div class="inbox-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
        </div>
        <p class="text-[14px] text-gray-500 font-medium mt-4">All caught up!</p>
        <p class="text-[12.5px] text-gray-600 mt-1">No ${state.inboxFilter === 'all' ? '' : state.inboxFilter + ' '}notifications to show</p>
      </div>`;
    return;
  }

  // Group by time sections
  const today = [];
  const earlier = [];
  filtered.forEach(item => {
    if (item.time.includes('min') || item.time.includes('hour')) today.push(item);
    else earlier.push(item);
  });

  let html = '';
  if (today.length > 0) {
    html += `<div class="inbox-section-label">Today</div>`;
    html += today.map(item => renderInboxItem(item)).join('');
  }
  if (earlier.length > 0) {
    html += `<div class="inbox-section-label" style="margin-top: 8px;">Earlier</div>`;
    html += earlier.map(item => renderInboxItem(item)).join('');
  }
  list.innerHTML = html;
}

function renderInboxItem(item) {
  const getInboxIcon = (type) => {
    const icons = {
      task:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      mention: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>`,
      project: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
      system:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };
    return icons[type] || icons.system;
  };
  const getInboxIconColor = (type) => {
    const colors = { task: "inbox-icon-task", mention: "inbox-icon-mention", project: "inbox-icon-project", system: "inbox-icon-system" };
    return colors[type] || colors.system;
  };

  return `
    <div class="inbox-item ${item.read ? '' : 'inbox-item-unread'}" onclick="window.toggleInboxRead(${item.id})">
      <div class="inbox-item-icon ${getInboxIconColor(item.type)}">${getInboxIcon(item.type)}</div>
      <div class="inbox-item-content">
        <div class="inbox-item-header">
          <span class="inbox-item-title">${item.title}</span>
          <span class="inbox-item-time">${item.time}</span>
        </div>
        <p class="inbox-item-body">${item.body}</p>
        ${item.project ? `<span class="inbox-item-project">${item.project}</span>` : ''}
      </div>
      ${!item.read ? '<div class="inbox-unread-dot"></div>' : ''}
      <button class="inbox-item-dismiss icon-btn" onclick="event.stopPropagation(); window.dismissInboxItem(${item.id})" title="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
}

export function openChat(contactId) {
  state.activeChatContactId = contactId;
  const notifView = document.getElementById('inboxNotificationsView');
  const chatView  = document.getElementById('inboxChatView');
  if (notifView) notifView.classList.add('hidden');
  if (chatView)  chatView.classList.remove('hidden');

  const contact = state.chatContacts.find(c => c.id === contactId);
  if (!contact) return;

  const headerAvatar = document.getElementById('chatHeaderAvatar');
  const headerName   = document.getElementById('chatHeaderName');
  const headerStatus = document.getElementById('chatHeaderStatus');

  if (headerAvatar) {
    headerAvatar.className = `chat-header-avatar bg-gradient-to-br ${getContactGradient(contactId)}`;
    headerAvatar.textContent = contact.avatar;
  }
  if (headerName) headerName.textContent = contact.name;
  if (headerStatus) {
    headerStatus.textContent = contact.status.charAt(0).toUpperCase() + contact.status.slice(1);
    headerStatus.className = `chat-header-status chat-status-${contact.status}`;
  }

  renderChatMessages();
  renderSidebarChatList();
}

export function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container || !state.activeChatContactId) return;

  const msgs = state.chatConversations[state.activeChatContactId] || [];
  const contact = state.chatContacts.find(c => c.id === state.activeChatContactId);

  if (msgs.length === 0) {
    container.innerHTML = `<div class="chat-empty"><p class="text-[14px] text-gray-500 font-medium mt-3">Start a conversation</p></div>`;
    return;
  }

  let currentDate = '';
  let html = '';
  msgs.forEach((msg, i) => {
    if (msg.date !== currentDate) {
      currentDate = msg.date;
      html += `<div class="chat-date-divider"><span>${msg.date}</span></div>`;
    }
    const isMe = msg.from === 'me';
    html += `
      <div class="chat-msg ${isMe ? 'chat-msg-me' : 'chat-msg-them'}">
        <div class="chat-msg-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}">
          <p class="chat-msg-text">${msg.text}</p>
          <span class="chat-msg-time">${msg.time}</span>
        </div>
      </div>`;
  });
  container.innerHTML = html;
  const scrollContainer = document.getElementById('chatMessagesContainer');
  if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
}

export function renderSidebarChatList(query = "") {
  const list = document.getElementById('sidebarChatList');
  if (!list) return;

  const filtered = query 
    ? state.chatContacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : state.chatContacts;

  list.innerHTML = filtered.map(c => {
    const isActive = c.id === state.activeChatContactId;
    const conversation = state.chatConversations[c.id] || [];
    const lastMsg = conversation[conversation.length - 1];
    const preview = lastMsg ? (lastMsg.from === 'me' ? 'You: ' : '') + lastMsg.text : 'No messages yet';

    return `
      <button class="sidebar-chat-contact ${isActive ? 'sidebar-chat-active' : ''}" onclick="window.openChat('${c.id}')">
        <div class="sidebar-chat-avatar-wrap">
          <div class="sidebar-chat-avatar bg-gradient-to-br ${getContactGradient(c.id)}">${c.avatar}</div>
          <div class="sidebar-chat-status-dot ${getStatusColor(c.status)}"></div>
        </div>
        <div class="sidebar-chat-info">
          <div class="sidebar-chat-name-row">
            <span class="sidebar-chat-name">${c.name}</span>
            ${c.unreadCount > 0 ? `<span class="sidebar-chat-unread">${c.unreadCount}</span>` : ''}
          </div>
          <span class="sidebar-chat-preview">${preview}</span>
        </div>
      </button>`;
  }).join('');
}

export function filterInbox(filter) {
  state.inboxFilter = filter;
  document.querySelectorAll('.inbox-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.filter === filter);
  });
  renderInbox();
}

export function markAllInboxRead() {
  state.inboxItems.forEach(n => n.read = true);
  renderInbox();
}

export function clearAllInbox() {
  if (!confirm("Clear all notifications?")) return;
  state.inboxItems = [];
  renderInbox();
}

export function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim() || !state.activeChatContactId) return;

  const msg = {
    from: 'me',
    text: input.value,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: 'Today'
  };

  if (!state.chatConversations[state.activeChatContactId]) {
    state.chatConversations[state.activeChatContactId] = [];
  }
  state.chatConversations[state.activeChatContactId].push(msg);
  
  input.value = '';
  renderChatMessages();
}

export function filterSidebarChats(query) {
  // Logic to filter the sidebar chat list
  renderSidebarChatList(query);
}

export function toggleInboxRead(id) {
  const item = state.inboxItems.find(n => n.id === id);
  if (item) {
    item.read = !item.read;
    renderInbox();
  }
}

export function dismissInboxItem(id) {
  state.inboxItems = state.inboxItems.filter(n => n.id !== id);
  renderInbox();
}
