/**
 * inbox-controller.js - Logic for the Inbox and Chat system
 */

import { state } from '../modules/state.js';
import { getContactGradient, getStatusColor, showToast } from '../modules/utils.js';
import { fetchPendingInvitations, acceptInvitationRecord, declineInvitationRecord, loadWorkspaceData, subscribeToChat, sendChatMessageRecord, subscribeToAllMessages, subscribeToNotifications, updateNotificationRead, deleteNotificationRecord, markAllNotificationsReadRecord, clearAllNotificationsRecord, subscribeToChatMeta, markChatMetaSeen } from '../modules/data-store.js';
import { renderTeamGrid } from './team-controller.js';
import { renderNotes } from './notes-controller.js';

let activeChatUnsubscribe = null;
let globalMessagesUnsubscribe = null;
let notificationsUnsubscribe = null;
let chatMetaUnsubscribe = null;

// Persist unread state locally to survive reloads
const CHAT_UNREAD_KEY = 'codetask_chat_unread_state_v1';

function loadChatUnreadState() {
  try {
    const raw = localStorage.getItem(CHAT_UNREAD_KEY);
    if (!raw) return { lastCount: {}, unread: {} };
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load chat unread state', err);
    return { lastCount: {}, unread: {} };
  }
}

function saveChatUnreadState() {
  try {
    const payload = { lastCount: state.chatLastCount || {}, unread: state.chatUnread || {} };
    localStorage.setItem(CHAT_UNREAD_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save chat unread state', err);
  }
}

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
      invitation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
    };
    return icons[type] || icons.system;
  };
  const getInboxIconColor = (type) => {
    const colors = { task: "inbox-icon-task", mention: "inbox-icon-mention", project: "inbox-icon-project", system: "inbox-icon-system", invitation: "inbox-icon-task" };
    return colors[type] || colors.system;
  };

  return `
    <div class="inbox-item ${item.read ? '' : 'inbox-item-unread'}" onclick="window.toggleInboxRead('${item.id}')">
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
      ${item.type === 'invitation' ? `
        <div class="flex gap-2 ml-auto flex-shrink-0">
          <button class="px-3 py-1.5 text-[11px] font-bold bg-cyan text-base rounded-lg hover:opacity-90 transition-all active:scale-95" onclick="event.stopPropagation(); window.acceptInvitation('${item.invitationId}')">Accept</button>
          <button class="px-3 py-1.5 text-[11px] font-bold bg-white/5 text-gray-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all" onclick="event.stopPropagation(); window.declineInvitation('${item.invitationId}')">Decline</button>
        </div>
      ` : `
        <button class="inbox-item-dismiss icon-btn" onclick="event.stopPropagation(); window.dismissInboxItem('${item.id}')" title="Dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `}
    </div>`;
}

export function openChat(contactId) {
  state.activeChatContactId = contactId;
  const notifView = document.getElementById('inboxNotificationsView');
  const chatView  = document.getElementById('inboxChatView');
  if (notifView) notifView.classList.add('hidden');
  if (chatView)  chatView.classList.remove('hidden');

  const contact = state.members.find(c => c.id === contactId);
  if (!contact) return;

  const headerAvatar = document.getElementById('chatHeaderAvatar');
  const headerName   = document.getElementById('chatHeaderName');
  const headerStatus = document.getElementById('chatHeaderStatus');

  if (headerAvatar) {
    const initials = contact.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    headerAvatar.className = `chat-header-avatar bg-gradient-to-br ${getContactGradient(contactId)}`;
    headerAvatar.textContent = initials;
  }
  if (headerName) headerName.textContent = contact.name;
  if (headerStatus) {
    headerStatus.textContent = contact.status.charAt(0).toUpperCase() + contact.status.slice(1);
    headerStatus.className = `chat-header-status chat-status-${contact.status}`;
  }

  // Unsubscribe from previous chat
  if (activeChatUnsubscribe) {
    activeChatUnsubscribe();
    activeChatUnsubscribe = null;
  }

  // Subscribe to new chat
  if (contact.uid) {
    activeChatUnsubscribe = subscribeToChat(contact.uid, (messages) => {
      // Reconcile server messages with any pending optimistic local messages for this uid
      const pending = state.pendingLocalMessages && state.pendingLocalMessages[contact.uid] ? [...state.pendingLocalMessages[contact.uid]] : [];

      // Remove pending messages that appear in server messages (matching by text and timestamp proximity)
      const remainingPending = pending.filter(p => {
        const matched = messages.find(s => s.from === 'me' && s.text === p.text && Math.abs((s.timestampMs || Date.now()) - (p._ts || 0)) < 15000);
        return !matched;
      });

      // Update pending store to remaining ones
      state.pendingLocalMessages[contact.uid] = remainingPending;

      // Combine server messages and remaining pending optimistic messages (pending last)
      state.chatConversations[contact.uid] = [...messages, ...remainingPending];
      renderChatMessages();
    });
  }

  // Mark this conversation as seen
  if (contact && contact.uid) {
    state.chatLastCount = state.chatLastCount || {};
    state.chatUnread = state.chatUnread || {};
    const len = (state.chatConversations[contact.uid] || []).length;
    state.chatLastCount[contact.uid] = len;
    state.chatUnread[contact.uid] = 0;
    // Update member unreadCount for UI
    state.members = state.members.map(m => ({ ...m, unreadCount: m.uid ? (state.chatUnread[m.uid] || 0) : (m.unreadCount || 0) }));
    renderSidebarChatList();
    saveChatUnreadState();
    // Persist seen state to server
    try {
      markChatMetaSeen(contact.uid);
    } catch (err) {
      console.error('Failed to mark chat meta seen on server', err);
    }
  }

  renderSidebarChatList();
}

export function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container || !state.activeChatContactId) return;

  const contact = state.members.find(c => c.id === state.activeChatContactId);
  // Chat conversations are keyed by member UID (not the member doc id)
  const msgs = contact ? (state.chatConversations[contact.uid] || []) : [];

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
    ? state.members.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : state.members;

  list.innerHTML = filtered.map(c => {
    const isActive = c.id === state.activeChatContactId;
    const initials = c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    
    // Find conversation by UID since that's how subscribeToAllMessages groups them
    const conversation = state.chatConversations[c.uid] || [];
    const lastMsg = conversation[conversation.length - 1];
    const preview = lastMsg ? (lastMsg.from === 'me' ? 'You: ' : '') + lastMsg.text : 'No messages yet';

    return `
      <button class="sidebar-chat-contact ${isActive ? 'sidebar-chat-active' : ''}" onclick="window.openChat('${c.id}')">
        <div class="sidebar-chat-avatar-wrap">
          <div class="sidebar-chat-avatar bg-gradient-to-br ${getContactGradient(c.id)}">${initials}</div>
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

export function startGlobalMessageListener() {
  if (globalMessagesUnsubscribe) return;
  
  globalMessagesUnsubscribe = subscribeToAllMessages((conversations) => {
    // Merge new conversations into state
    Object.assign(state.chatConversations, conversations);
    // Track unread counts by comparing message counts
    state.chatLastCount = state.chatLastCount || {};
    state.chatUnread = state.chatUnread || {};

    Object.keys(conversations).forEach((otherUid) => {
      const msgs = conversations[otherUid] || [];
      const prev = state.chatLastCount[otherUid] || 0;
      const curr = msgs.length;

      // If the active chat is open for this uid, mark as seen
      const activeMember = state.members.find(m => m.id === state.activeChatContactId);
      const activeUid = activeMember ? activeMember.uid : null;
      if (activeUid === otherUid) {
        state.chatLastCount[otherUid] = curr;
        state.chatUnread[otherUid] = 0;
      } else if (curr > prev) {
        state.chatUnread[otherUid] = (state.chatUnread[otherUid] || 0) + (curr - prev);
        state.chatLastCount[otherUid] = curr;
      }
    });

    // Update members with unread counts for UI
    state.members = state.members.map(m => ({ ...m, unreadCount: m.uid ? (state.chatUnread[m.uid] || 0) : (m.unreadCount || 0) }));

    // Persist changes
    saveChatUnreadState();

    // Update active chat view if open
    if (state.activeChatContactId) {
      const activeMember2 = state.members.find(m => m.id === state.activeChatContactId);
      if (activeMember2 && conversations[activeMember2.uid]) renderChatMessages();
    }

    // Always update sidebar
    // Reconcile pending optimistic messages across conversations: remove any pending that appear on server
    Object.keys(state.pendingLocalMessages || {}).forEach(uid => {
      const pending = state.pendingLocalMessages[uid] || [];
      if (!pending.length) return;
      const serverMsgs = conversations[uid] || state.chatConversations[uid] || [];
      const remaining = pending.filter(p => !serverMsgs.find(s => s.from === 'me' && s.text === p.text && Math.abs((s.timestampMs || Date.now()) - (p._ts || 0)) < 15000));
      state.pendingLocalMessages[uid] = remaining;
      // Ensure chatConversations includes remaining pending messages
      state.chatConversations[uid] = [...(serverMsgs || []), ...(remaining || [])];
    });

    renderSidebarChatList();
  });

  // Also start listening to server-side chat meta (unread counts)
  if (!chatMetaUnsubscribe) {
    chatMetaUnsubscribe = subscribeToChatMeta((items) => {
      state.chatUnread = state.chatUnread || {};
      items.forEach(it => {
        state.chatUnread[it.id] = it.unreadCount || 0;
      });
      state.members = state.members.map(m => ({ ...m, unreadCount: m.uid ? (state.chatUnread[m.uid] || 0) : (m.unreadCount || 0) }));
      saveChatUnreadState();
      renderSidebarChatList();
    });
  }
}

export function startNotificationListener() {
  if (notificationsUnsubscribe) return;
  
  notificationsUnsubscribe = subscribeToNotifications((notifications) => {
    state.dbNotifications = notifications.map(n => ({
      ...n,
      time: formatInvitationTime(n.createdAt)
    }));
    mergeInboxItems();
  });
}

function mergeInboxItems() {
  // Convert invitations into inbox items format
  const invitationItems = (state.pendingInvitations || []).map((inv) => ({
    id: `inv-${inv.id}`,
    type: "invitation",
    icon: "invitation",
    title: "Team Invitation",
    body: `${inv.senderName} (${inv.senderEmail}) invited you to join their team as ${inv.role}`,
    project: null,
    time: formatInvitationTime(inv.createdAt),
    read: false,
    invitationId: inv.id,
    createdAt: inv.createdAt
  }));

  const dbNotifs = state.dbNotifications || [];
  
  // Combine and sort by newest
  state.inboxItems = [...invitationItems, ...dbNotifs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  
  renderInbox();
}

export function filterInbox(filter) {
  state.inboxFilter = filter;
  document.querySelectorAll('.inbox-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.filter === filter);
  });
  renderInbox();
}

export async function markAllInboxRead() {
  try {
    await markAllNotificationsReadRecord();
    state.inboxItems.forEach(n => n.read = true);
    renderInbox();
  } catch (err) {
    console.error(err);
  }
}

export async function clearAllInbox() {
  if (!confirm("Clear all notifications?")) return;
  try {
    await clearAllNotificationsRecord();
    state.inboxItems = state.inboxItems.filter(n => n.type === 'invitation');
    renderInbox();
  } catch (err) {
    console.error(err);
  }
}

export async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim() || !state.activeChatContactId) return;

  const contact = state.members.find(c => c.id === state.activeChatContactId);
  if (!contact || !contact.uid) {
    showToast("Cannot send message: Team member not linked to a user profile", "error");
    return;
  }

  const text = input.value;
  input.value = '';
  // Optimistic UI: push a local pending message immediately
  const localId = `local-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  const localMsg = {
    id: localId,
    text,
    time: 'Just now',
    date: 'Today',
    from: 'me',
    _optimistic: true,
    _failed: false,
    _ts: Date.now()
  };

  state.pendingLocalMessages = state.pendingLocalMessages || {};
  state.pendingLocalMessages[contact.uid] = state.pendingLocalMessages[contact.uid] || [];
  state.pendingLocalMessages[contact.uid].push(localMsg);

  // Ensure the conversation array exists and include optimistic message
  state.chatConversations[contact.uid] = state.chatConversations[contact.uid] || [];
  state.chatConversations[contact.uid].push(localMsg);
  renderChatMessages();
  renderSidebarChatList();

  try {
    await sendChatMessageRecord(contact.uid, text);
    // server snapshot will arrive via subscription and reconciliation will remove optimistic duplicates
  } catch (err) {
    // Mark the optimistic message as failed
    const pending = state.pendingLocalMessages[contact.uid] || [];
    const msg = pending.find(m => m.id === localId);
    if (msg) msg._failed = true;
    // Also update conversation view
    state.chatConversations[contact.uid] = (state.chatConversations[contact.uid] || []).map(m => m.id === localId ? { ...m, _failed: true } : m);
    renderChatMessages();
    renderSidebarChatList();
    showToast("Failed to send message", "error");
    console.error(err);
  }
}

export function filterSidebarChats(query) {
  // Logic to filter the sidebar chat list
  renderSidebarChatList(query);
}

export async function toggleInboxRead(id) {
  const item = state.inboxItems.find(n => n.id === id);
  if (item) {
    item.read = !item.read; // Optimistic update
    renderInbox();
    
    if (item.type !== 'invitation') {
      try {
        await updateNotificationRead(id, item.read);
      } catch (err) {
        console.error("Failed to update notification", err);
      }
    }
  }
}

export async function dismissInboxItem(id) {
  const item = state.inboxItems.find(n => n.id === id);
  if (item && item.type !== 'invitation') {
    try {
      await deleteNotificationRecord(id);
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  }
  
  state.inboxItems = state.inboxItems.filter(n => n.id !== id);
  renderInbox();
}

// ── Invitation Handlers ────────────────────────────────────────
export async function acceptInvitation(invitationId) {
  try {
    const newMember = await acceptInvitationRecord(invitationId);

    // Remove invitation from inbox
    state.inboxItems = state.inboxItems.filter(item => item.invitationId !== invitationId);
    state.pendingInvitations = state.pendingInvitations.filter(inv => inv.id !== invitationId);

    // Reload workspace data to get the new member
    await loadWorkspaceData();

    // Re-render team and notes to show new member and their team notes
    renderInbox();
    renderTeamGrid();
    renderNotes();
    showToast("Invitation accepted! You're now teammates.");
  } catch (err) {
    showToast("Failed to accept invitation", "error");
    console.error(err);
  }
}

export async function declineInvitation(invitationId) {
  try {
    await declineInvitationRecord(invitationId);

    // Remove invitation from inbox
    state.inboxItems = state.inboxItems.filter(item => item.invitationId !== invitationId);
    state.pendingInvitations = state.pendingInvitations.filter(inv => inv.id !== invitationId);

    renderInbox();
    showToast("Invitation declined");
  } catch (err) {
    showToast("Failed to decline invitation", "error");
    console.error(err);
  }
}

export async function loadInvitationsToInbox() {
  try {
    const invitations = await fetchPendingInvitations();
    state.pendingInvitations = invitations;
    mergeInboxItems();
  } catch (err) {
    console.error("Failed to load invitations:", err);
  }
}

function formatInvitationTime(timestamp) {
  if (!timestamp) return "Just now";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
