/**
 * inbox-controller.js - Logic for the Inbox and Chat system
 */

import { state } from '../modules/state.js';
import { getContactGradient, getStatusColor, showToast, escapeHtml, timeAgo } from '../modules/utils.js';
import { 
  acceptInvitationRecord, 
  declineInvitationRecord, 
  loadWorkspaceData,
  sendChatMessageRecord,
  subscribeToChatMessages,
  markChatMessagesReadRecord,
  updateInboxItemRecord,
  deleteInboxItemRecord,
  markAllInboxReadRecord,
  clearInboxCollection
} from '../modules/data-store.js';
import { auth } from '../../config/config.js';
import { renderSidebarProjects, renderTasks } from './dashboard-controller.js';
import { renderProjectsGrid } from './projects-controller.js';
import { renderTeamGrid } from './team-controller.js';

let activeMessageSubscription = null;


function invitationToInboxItem(invitation) {
  return {
    id: `invite:${invitation.id}`,
    invitationId: invitation.id,
    type: "invitation",
    icon: "project",
    title: "Project invitation",
    body: `${invitation.senderName} invited you to join ${invitation.projectName}`,
    project: invitation.projectName,
    time: timeAgo(invitation.createdAt),
    read: false,
    invitation
  };
}

function inlineJsArg(value) {
  return escapeHtml(JSON.stringify(value));
}

function getVisibleInboxItems() {
  const invitations = state.pendingInvitations.map(invitationToInboxItem);
  return [...invitations, ...state.inboxItems];
}

function getUnreadMessageCount(senderUid = null) {
  return state.incomingMessages.filter(message => {
    return !message.read && (!senderUid || message.senderUid === senderUid);
  }).length;
}

export function updateInboxBadges() {
  const unreadCount = getUnreadMessageCount();
  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);
  const badge = document.getElementById("inboxBadge");
  const railBadge = document.getElementById("railInboxBadge");

  [badge, railBadge].forEach(el => {
    if (!el) return;
    el.textContent = displayCount;
    el.classList.toggle("hidden", unreadCount === 0);
  });
}

export function renderInbox() {
  const list  = document.getElementById("inboxList");
  const count = document.getElementById("inboxCount");
  if (!list) return;

  const items = getVisibleInboxItems();
  const filtered = state.inboxFilter === "all"
    ? items
    : state.inboxFilter === "unread"
      ? items.filter(n => !n.read)
      : items.filter(n => n.type === state.inboxFilter);

  if (count) count.textContent = `(${filtered.length})`;

  updateInboxBadges();

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
    if (item.time.includes('min') || item.time.includes('hour') || item.time === 'Just now') today.push(item);
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

  // Real-time refresh
  if (!window._inboxRefreshInterval) {
    window._inboxRefreshInterval = setInterval(() => {
      if (state.activePageId === "pageInbox") renderInbox();
    }, 60000);
  }
}

function renderInboxItem(item) {
  const getInboxIcon = (type) => {
    const icons = {
      task:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      mention: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>`,
      project: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
      system:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      invitation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6"/><path d="m22 10-10 6L2 10"/><path d="M2 10l10-6 10 6"/></svg>`,
      note: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    };
    return icons[type] || icons.system;
  };
  const getInboxIconColor = (type) => {
    const colors = { task: "inbox-icon-task", mention: "inbox-icon-mention", project: "inbox-icon-project", system: "inbox-icon-system", invitation: "inbox-icon-invitation", note: "inbox-icon-note" };
    return colors[type] || colors.system;
  };

  const itemId = inlineJsArg(item.id);
  const invitationId = inlineJsArg(item.invitationId);
  const isInvitation = item.type === "invitation";

  return `
    <div class="inbox-item ${item.read ? '' : 'inbox-item-unread'}" onclick="${isInvitation ? '' : `window.toggleInboxRead(${itemId})`}">
      <div class="inbox-item-icon ${getInboxIconColor(item.type)}">${getInboxIcon(item.type)}</div>
      <div class="inbox-item-content">
        <div class="inbox-item-header">
          <span class="inbox-item-title">${escapeHtml(item.title)}</span>
          <span class="inbox-item-time">${escapeHtml(timeAgo(item.createdAt || item.time))}</span>
        </div>
        <p class="inbox-item-body">${escapeHtml(item.body)}</p>
        ${item.project ? `<span class="inbox-item-project">${escapeHtml(item.project)}</span>` : ''}
        ${isInvitation ? `
          <div class="inbox-actions">
            <button class="inbox-action-btn inbox-accept" onclick="event.stopPropagation(); window.acceptInvitation(${invitationId})">Accept</button>
            <button class="inbox-action-btn inbox-decline" onclick="event.stopPropagation(); window.declineInvitation(${invitationId})">Decline</button>
          </div>` : ''}
      </div>
      ${!item.read ? '<div class="inbox-unread-dot"></div>' : ''}
      ${isInvitation ? '' : `<button class="inbox-item-dismiss icon-btn" onclick="event.stopPropagation(); window.dismissInboxItem(${itemId})" title="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`}
    </div>`;
}

export function openChat(contactId) {
  // 1. Cleanup previous subscription
  if (activeMessageSubscription) {
    activeMessageSubscription();
    activeMessageSubscription = null;
  }

  // 2. Set active contact and clear stale container
  state.activeChatContactId = contactId;
  markChatMessagesReadRecord(contactId).catch(console.error);
  const container = document.getElementById('chatMessages');
  if (container) {
    container.innerHTML = `
      <div class="flex items-center justify-center h-full opacity-30">
        <div class="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin"></div>
      </div>`;
  }

  const notifView = document.getElementById('inboxNotificationsView');
  const chatView  = document.getElementById('inboxChatView');
  if (notifView) notifView.classList.add('hidden');
  if (chatView)  chatView.classList.remove('hidden');

  // 3. Find contact and update header
  const contact = state.members.find(m => m.uid === contactId);
  if (!contact) return;

  const headerAvatar = document.getElementById('chatHeaderAvatar');
  const headerName   = document.getElementById('chatHeaderName');
  const headerStatus = document.getElementById('chatHeaderStatus');

  const name = contact.name || contact.displayName || contact.email?.split('@')[0] || "User";
  const initials = (name[0] || "U").toUpperCase();

  if (headerAvatar) {
    headerAvatar.className = `chat-header-avatar bg-gradient-to-br ${getContactGradient(contactId)}`;
    if (contact.photoURL) {
      headerAvatar.innerHTML = `<img src="${escapeHtml(contact.photoURL)}" class="w-full h-full rounded-full object-cover" />`;
    } else {
      headerAvatar.textContent = initials;
    }
  }
  if (headerName) headerName.textContent = name;
  if (headerStatus) {
    const status = contact.status || "offline";
    headerStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    headerStatus.className = `chat-header-status chat-status-${status}`;
  }

  // 4. Reset scroll position for new conversation
  const scrollContainer = document.getElementById('chatMessagesContainer');
  if (scrollContainer) scrollContainer.scrollTop = 0;

  // 5. Subscribe to real-time messages
  activeMessageSubscription = subscribeToChatMessages(contactId, (messages) => {
    // Only update if we are still looking at this contact
    if (state.activeChatContactId !== contactId) return;

    const currentUid = auth.currentUser?.uid;

    state.chatConversations[contactId] = messages.map(msg => ({
      from: msg.senderUid === currentUid ? 'me' : 'them',
      text: msg.text,
      time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(msg.timestamp).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : new Date(msg.timestamp).toLocaleDateString()
    }));

    if (messages.some(msg => msg.senderUid === contactId && !msg.read)) {
      markChatMessagesReadRecord(contactId).catch(console.error);
    }
    
    renderChatMessages();
    renderSidebarChatList();
    updateInboxBadges();
  }, (err) => {
    console.error("Message subscription error:", err);
  });

  renderSidebarChatList();
}

export function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container || !state.activeChatContactId) return;

  const msgs = state.chatConversations[state.activeChatContactId] || [];
  const contact = state.members.find(m => m.uid === state.activeChatContactId);

  if (msgs.length === 0) {
    if (!contact) {
      container.innerHTML = `<div class="chat-empty"><p class="text-[14px] text-gray-500 font-medium mt-3">Select a contact to start chatting</p></div>`;
      return;
    }

    const name = contact.name || contact.displayName || contact.email?.split('@')[0] || "Team Member";
    const initials = (name[0] || "U").toUpperCase();
    const avatarHtml = contact.photoURL 
      ? `<img src="${escapeHtml(contact.photoURL)}" class="w-16 h-16 rounded-full object-cover" />`
      : `<div class="w-16 h-16 rounded-full bg-gradient-to-br ${getContactGradient(contact.uid)} flex items-center justify-center text-xl font-bold text-white">${initials}</div>`;

    const teammateTasks = state.tasks.filter(t => t.ownerUid === contact.uid || (t.assignee && t.assignee.uid === contact.uid));
    const activeTasksCount = teammateTasks.filter(t => !t.done).length;

    container.innerHTML = `
      <div class="chat-empty-state flex flex-col items-center justify-center h-full py-16 px-12 animate-in fade-in duration-700">
        <div class="max-w-xl w-full flex flex-col items-center text-center">
          <div class="flex flex-col items-center mb-10">
            <div class="relative mb-6">
              ${avatarHtml}
              <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-base rounded-full flex items-center justify-center border-2 border-surface">
                <div class="w-2.5 h-2.5 rounded-full ${getStatusColor(contact.status || 'offline')}"></div>
              </div>
            </div>
            <h3 class="text-[26px] font-bold text-white tracking-tight mb-1">${escapeHtml(name)}</h3>
            <p class="text-[14px] text-gray-500 font-medium">${escapeHtml(contact.role || "Team Member")} \u2022 ${escapeHtml(contact.email || "")}</p>
          </div>

          <div class="flex gap-6 mb-12">
            <div class="px-6 py-3 bg-elevated border border-white/5 rounded-2xl min-w-[100px]">
              <p class="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-1">Active Tasks</p>
              <p class="text-[20px] font-mono font-bold text-gray-200">${activeTasksCount}</p>
            </div>
            <div class="px-6 py-3 bg-elevated border border-white/5 rounded-2xl min-w-[100px]">
              <p class="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-1">Completed</p>
              <p class="text-[20px] font-mono font-bold text-gray-200">${teammateTasks.filter(t => t.done).length}</p>
            </div>
          </div>

          <div class="w-full mb-12">
            <h4 class="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-4">Suggested Starters</h4>
            <div class="grid grid-cols-2 gap-4">
              <button class="flex flex-col items-center gap-3 p-5 rounded-2xl bg-elevated border border-white/5 hover:border-white/10 hover:bg-hover transition-all group" onclick="document.getElementById('chatInput').value = 'Hey ${escapeHtml(name.split(' ')[0])}, checking in on status'; document.getElementById('chatInput').focus();">
                <div class="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <p class="text-[13px] font-bold text-gray-200">Check Status</p>
                  <p class="text-[11px] text-gray-500">Ask for an update</p>
                </div>
              </button>
              <button class="flex flex-col items-center gap-3 p-5 rounded-2xl bg-elevated border border-white/5 hover:border-white/10 hover:bg-hover transition-all group" onclick="document.getElementById('chatInput').value = 'Let\\'s sync on current tasks when you have a moment'; document.getElementById('chatInput').focus();">
                <div class="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center text-purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <div>
                  <p class="text-[13px] font-bold text-gray-200">Request Sync</p>
                  <p class="text-[11px] text-gray-500">Schedule check-in</p>
                </div>
              </button>
            </div>
          </div>

          <div class="max-w-xs mx-auto p-4 border-t border-white/5">
            <p class="text-[12px] text-gray-600 leading-relaxed italic">
              Messages are synced in real-time across your workspace.
            </p>
          </div>
        </div>
      </div>`;
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

  const currentUid = auth.currentUser?.uid;
  const contacts = state.members
    .filter(m => m.uid && m.uid !== currentUid)
    .map(m => ({
      uid: m.uid,
      name: m.name || m.displayName || m.email?.split('@')[0] || "Team Member",
      avatar: (m.name || m.displayName || m.email || "U")[0].toUpperCase(),
      status: m.status || "offline",
      role: m.role || "Member",
      email: m.email,
      photoURL: m.photoURL,
      unreadCount: getUnreadMessageCount(m.uid)
    }));

  const filtered = query 
    ? contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : contacts;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="p-4 text-center text-xs text-gray-500">No teammates found</div>`;
    return;
  }

  list.innerHTML = filtered.map(c => {
    const isActive = state.activeChatContactId && c.uid === state.activeChatContactId;
    const conversation = state.chatConversations[c.uid] || [];
    const lastMsg = conversation[conversation.length - 1];
    const preview = lastMsg ? (lastMsg.from === 'me' ? 'You: ' : '') + lastMsg.text : 'No messages yet';

    const avatarHtml = c.photoURL 
      ? `<img src="${escapeHtml(c.photoURL)}" class="sidebar-chat-avatar object-cover" />`
      : `<div class="sidebar-chat-avatar bg-gradient-to-br ${getContactGradient(c.uid)}">${c.avatar}</div>`;

    return `
      <button class="sidebar-chat-contact ${isActive ? 'sidebar-chat-active' : ''}" onclick="window.openChat('${c.uid}')">
        <div class="sidebar-chat-avatar-wrap">
          ${avatarHtml}
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

export async function markAllInboxRead() {
  try {
    await markAllInboxReadRecord();
    showToast("All notifications marked as read");
  } catch (err) {
    console.error(err);
    showToast("Failed to update notifications", "error");
  }
}

export async function clearAllInbox() {
  if (!confirm("Clear all notifications?")) return;
  try {
    await clearInboxCollection();
    showToast("Inbox cleared");
  } catch (err) {
    console.error(err);
    showToast("Failed to clear inbox", "error");
  }
}

export async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim() || !state.activeChatContactId) return;

  const text = input.value;
  input.value = ''; // Optimistic clear

  try {
    await sendChatMessageRecord(state.activeChatContactId, text);
    // UI will be updated by the real-time subscription
  } catch (err) {
    showToast("Failed to send message", "error");
    console.error(err);
    input.value = text; // Restore if failed
  }
}

export function filterSidebarChats(query) {
  renderSidebarChatList(query);
}

export async function toggleInboxRead(id) {
  const item = state.inboxItems.find(n => n.id === id);
  if (item) {
    try {
      await updateInboxItemRecord(id, { read: !item.read });
    } catch (err) {
      console.error(err);
      showToast("Failed to update notification", "error");
    }
  }
}

export async function dismissInboxItem(id) {
  try {
    await deleteInboxItemRecord(id);
  } catch (err) {
    console.error(err);
    showToast("Failed to dismiss notification", "error");
  }
}

export async function acceptInvitation(invitationId) {
  try {
    const invitation = state.pendingInvitations.find(inv => inv.id === invitationId);
    await acceptInvitationRecord(invitationId);
    state.pendingInvitations = state.pendingInvitations.filter(inv => inv.id !== invitationId);
    
    if (invitation && invitation.senderUid) {
      await createInboxItem(invitation.senderUid, {
        type: "project",
        icon: "project",
        title: "Invitation accepted",
        body: `${auth.currentUser?.displayName || "A user"} accepted your invitation to join "${invitation.projectName}"`,
        project: invitation.projectName,
        time: "Just now"
      });
    }

    await loadWorkspaceData();
    renderInbox();
    renderSidebarProjects();
    renderProjectsGrid();
    renderTeamGrid();
    renderTasks();
    showToast("Invitation accepted");
  } catch (err) {
    showToast("Failed to accept invitation", "error");
    console.error(err);
  }
}

export async function declineInvitation(invitationId) {
  try {
    await declineInvitationRecord(invitationId);
    state.pendingInvitations = state.pendingInvitations.filter(inv => inv.id !== invitationId);
    renderInbox();
    showToast("Invitation declined");
  } catch (err) {
    showToast("Failed to decline invitation", "error");
    console.error(err);
  }
}
