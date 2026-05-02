/**
 * main.js - Application entry point
 */

import { CleanupManager, debounce } from './modules/performance.js';
import { playNotifSound, playMessageSound } from './modules/utils.js';
import { state } from './modules/state.js';
import { navigateToPage, PAGE_IDS } from './modules/navigation.js';
import { 
  renderTasks, 
  toggleTask, 
  deleteTask, 
  selectTask, 
  renderSidebarProjects,
  openNewTaskModal,
  addNewTask,
  showDetailPanel,
  closeDetailPanel,
  copyDetailCode
} from './controllers/dashboard-controller.js';
import { 
  renderProjectsGrid, 
  openProjectDashboard, 
  addNewProject, 
  deleteProject,
  prepareNewProjectModal,
  openEditProjectModal,
  closeEditProjectModal,
  saveEditProject
} from './controllers/projects-controller.js';
import { 
  renderTeamGrid, 
  addNewMember, 
  deleteMember,
  prepareInviteMemberModal
} from './controllers/team-controller.js';
import { 
  renderInbox,
  openChat, 
  renderChatMessages, 
  renderSidebarChatList,
  updateInboxBadges,
  filterSidebarChats,
  toggleInboxRead,
  dismissInboxItem,
  filterInbox,
  markAllInboxRead,
  clearAllInbox,
  sendChatMessage,
  acceptInvitation,
  declineInvitation
} from './controllers/inbox-controller.js';
import { 
  renderNotes, 
  selectNote,
  addNote,
  filterNotes,
  setNotesFilter,
  toggleNotePin,
  toggleNoteScope,
  deleteCurrentNote,
  saveNote,
  changeNoteColor,
  promptAddTag,
  removeNoteTag
} from './controllers/notes-controller.js';
import {
  setSettingsTab,
  sendContactForm,
  toggleSound,
  toggleDesktopNotifications,
  renderNotificationSettings,
  renderProfileSettings,
  saveProfileSettings
} from './controllers/settings-controller.js';
import {
  ensureUserProfile,
  loadWorkspaceData,
  setUserPresence,
  subscribeToPendingInvitations,
  subscribeToVisibleNotes,
  subscribeToWorkspaceMembers,
  subscribeToWorkspaceProjects,
  subscribeToVisibleTasks,
  subscribeToInboxItems,
  subscribeToIncomingMessages,
  createInboxItem
} from './modules/data-store.js';

// Import Components (defining custom elements)
import '../components/sidebar.js';
import '../components/header.js';
import '../components/task-area.js';
import '../components/detail-panel.js';
import '../components/task-modal.js';
import '../components/inbox-page.js';
import '../components/notes-page.js';
import '../components/settings-page.js';

// Expose functions to window for HTML event handlers
window.navigateToPage = navigateToPage;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.selectTask = selectTask;
window.renderTasks = renderTasks;
window.openNewTaskModal = openNewTaskModal;
window.addNewTask = addNewTask;
window.showDetailPanel = showDetailPanel;
window.closeDetailPanel = closeDetailPanel;
window.copyDetailCode = copyDetailCode;
window.openProjectDashboard = openProjectDashboard;
window.addNewProject = addNewProject;
window.deleteProject = deleteProject;
window.openEditProjectModal = openEditProjectModal;
window.closeEditProjectModal = closeEditProjectModal;
window.saveEditProject = saveEditProject;
window.renderTeamGrid = renderTeamGrid;
window.addNewMember = addNewMember;
window.deleteMember = deleteMember;
window.prepareInviteMemberModal = prepareInviteMemberModal;
window.openChat = openChat;
window.renderInbox = renderInbox;
window.updateInboxBadges = updateInboxBadges;
window.selectNote = selectNote;
window.addNote = addNote;
window.filterNotes = filterNotes;
window.setNotesFilter = setNotesFilter;
window.toggleNotePin = toggleNotePin;
window.toggleNoteScope = toggleNoteScope;
window.deleteCurrentNote = deleteCurrentNote;
window.saveNote = saveNote;
window.changeNoteColor = changeNoteColor;
window.promptAddTag = promptAddTag;
window.removeNoteTag = removeNoteTag;
window.filterSidebarChats = filterSidebarChats;
window.toggleInboxRead = toggleInboxRead;
window.dismissInboxItem = dismissInboxItem;
window.setSettingsTab = setSettingsTab;
window.sendContactForm = sendContactForm;
window.toggleSound = toggleSound;
window.toggleDesktopNotifications = toggleDesktopNotifications;
window.renderNotificationSettings = renderNotificationSettings;
window.renderProfileSettings = renderProfileSettings;
window.saveProfileSettings = saveProfileSettings;
window.filterInbox = filterInbox;
window.markAllInboxRead = markAllInboxRead;
window.clearAllInbox = clearAllInbox;
window.sendChatMessage = sendChatMessage;
window.acceptInvitation = acceptInvitation;
window.declineInvitation = declineInvitation;
window.createInboxItem = createInboxItem;

// Additional UI helper functions
window.closeNewTaskModal = () => document.getElementById("modalBackdrop")?.classList.add("hidden");
window.openNewProjectModal = prepareNewProjectModal;
window.closeNewProjectModal = () => document.getElementById("projectModalBackdrop")?.classList.add("hidden");
window.openNewMemberModal = () => {
  prepareInviteMemberModal();
  document.getElementById("memberModalBackdrop")?.classList.remove("hidden");
};
window.closeNewMemberModal = () => document.getElementById("memberModalBackdrop")?.classList.add("hidden");
window.openLogoutModal = () => document.getElementById("logoutModalBackdrop")?.classList.remove("hidden");
window.closeLogoutModal = () => document.getElementById("logoutModalBackdrop")?.classList.add("hidden");
window.closeChatView = () => {
  document.getElementById('inboxNotificationsView')?.classList.remove('hidden');
  document.getElementById('inboxChatView')?.classList.add('hidden');
};
window.getCheckedMemberIds = (containerId) => {
  return [...document.querySelectorAll(`#${containerId} input[type=checkbox]:checked`)].map(cb => cb.value);
};
window.closeModalOnBackdrop = (event) => {
  if (event.target.id === "modalBackdrop") window.closeNewTaskModal();
};
window.closeProjectModalOnBackdrop = (event) => {
  if (event.target.id === "projectModalBackdrop") window.closeNewProjectModal();
};
window.closeEditProjectOnBackdrop = (event) => {
  if (event.target.id === "editProjectBackdrop") window.closeEditProjectModal();
};
window.closeMemberModalOnBackdrop = (event) => {
  if (event.target.id === "memberModalBackdrop") window.closeNewMemberModal();
};
window.closeLogoutModalOnBackdrop = (event) => {
  if (event.target.id === "logoutModalBackdrop") window.closeLogoutModal();
};
// Global cleanup manager for Firebase listeners
const workspaceCleanup = new CleanupManager();

let presenceTimer = null;
let hydrationStarted = false;
let incomingMessagesHydrated = false;
let latestIncomingMessageTimestamp = 0;

function getMessageSenderName(senderUid) {
  const sender = state.members.find(member => member.uid === senderUid);
  return sender?.name || sender?.displayName || sender?.email?.split("@")[0] || "New message";
}

function showMessageNotification(message) {
  if (!state.desktopNotificationsEnabled || !("Notification" in window) || Notification.permission !== "granted") return;

  const shouldNotify = document.hidden
    || state.activePageId !== "pageInbox"
    || state.activeChatContactId !== message.senderUid;
  if (!shouldNotify) return;

  try {
    const notification = new Notification(getMessageSenderName(message.senderUid), {
      body: String(message.text || "Sent you a message"),
      tag: `message-${message.senderUid}`,
      silent: true
    });

    notification.onclick = () => {
      window.focus();
      navigateToPage("pageInbox");
      openChat(message.senderUid);
      notification.close();
    };
  } catch (err) {
    console.warn("Desktop notification failed:", err);
  }
}

function handleIncomingMessages(messages) {
  state.incomingMessages = messages;

  const newestTimestamp = messages.reduce((latest, message) => {
    return Math.max(latest, Number(message.timestamp) || 0);
  }, latestIncomingMessageTimestamp);

  const freshMessages = incomingMessagesHydrated
    ? messages.filter(message => (Number(message.timestamp) || 0) > latestIncomingMessageTimestamp)
    : [];

  freshMessages.forEach(message => {
    if (state.soundEnabled) playMessageSound();
    showMessageNotification(message);
  });

  latestIncomingMessageTimestamp = newestTimestamp;
  incomingMessagesHydrated = true;
  renderSidebarChatList();
  updateInboxBadges();
}

function renderWorkspace() {
  renderSidebarProjects();
  renderTasks();
  renderProjectsGrid();
  renderTeamGrid();
  renderInbox();
  renderSidebarChatList();
  renderNotes();
  renderProfileSettings();
}

function setupPresence() {
  const syncPresence = () => setUserPresence(document.hidden ? "offline" : "online").catch(console.error);
  syncPresence();

  if (presenceTimer) window.clearInterval(presenceTimer);
  presenceTimer = window.setInterval(() => {
    setUserPresence("online").catch(console.error);
  }, 60000);

  document.addEventListener("visibilitychange", syncPresence);
  window.addEventListener("beforeunload", () => {
    setUserPresence("offline").catch(console.error);
  });
}

async function hydrateAuthenticatedWorkspace() {
  if (hydrationStarted) return;
  hydrationStarted = true;

  try {
    await ensureUserProfile();
    setupPresence();
    await loadWorkspaceData();
    renderWorkspace();

    // Clean up any existing listeners before starting fresh
    workspaceCleanup.cleanup();
    incomingMessagesHydrated = false;
    latestIncomingMessageTimestamp = 0;

    workspaceCleanup.add(subscribeToPendingInvitations((pending) => {
      state.pendingInvitations = pending;
      renderInbox();
    }, console.error));

    workspaceCleanup.add(subscribeToWorkspaceMembers((members) => {
      state.members = members;
      renderTeamGrid();
      renderProjectsGrid();
      renderSidebarProjects();
      renderSidebarChatList();
    }, console.error));

    workspaceCleanup.add(subscribeToWorkspaceProjects((projects) => {
      state.projects = projects;
      
      // Secondary listeners that depend on the project list
      // Note: In a more advanced setup, we might manage these separately,
      // but for now, we just refresh the specific subscriptions.
      
      workspaceCleanup.add(subscribeToVisibleTasks(state.projects, (tasks) => {
        state.tasks = tasks;
        renderTasks();
        renderProfileSettings();
        renderProjectsGrid();
        renderTeamGrid();
      }, console.error));

      workspaceCleanup.add(subscribeToVisibleNotes(state.projects, (notes) => {
        state.notes = notes;
        renderNotes();
      }, console.error));

      renderSidebarProjects();
      renderProjectsGrid();
      renderTeamGrid();
      renderTasks();
      renderNotes();
    }, console.error));

    workspaceCleanup.add(subscribeToInboxItems((items) => {
      const prevCount = state.inboxItems.length;
      state.inboxItems = items;
      renderInbox();

      // Play sound if new items arrived
      if (state.soundEnabled && items.length > prevCount) {
        playNotifSound();
      }
    }, console.error));

    workspaceCleanup.add(subscribeToIncomingMessages(handleIncomingMessages, console.error));
  } catch (err) {
    hydrationStarted = false;
    console.error("Failed to load workspace data:", err);
  }
}

window.addEventListener("auth-ready", hydrateAuthenticatedWorkspace);
if (window.codetaskAuthReady) hydrateAuthenticatedWorkspace();

// Mock data initialization (or fetch from Firebase later)
function init() {
  console.log("Initializing CodeTask Pro...");
  
  // Initial Renders
  if ("Notification" in window && Notification.permission === "granted") {
    state.desktopNotificationsEnabled = true;
  }
  renderSidebarProjects();
  renderTasks();
  renderProfileSettings();
  renderNotificationSettings();
  
  // Setup Rail Buttons
  const railBtns = document.querySelectorAll(".rail-btn");
  railBtns.forEach((btn, i) => {
    const pageMap = { 0: "pageDashboard", 1: "pageProjects", 2: "pageTeam", 3: "pageNotes", 4: "pageInbox", 5: "pageSettings" };
    if (pageMap[i]) {
      btn.addEventListener("click", () => {
        const pageId = pageMap[i];
        navigateToPage(pageId);
        
        // Trigger specific renders
        if (pageId === "pageProjects") renderProjectsGrid();
        if (pageId === "pageTeam") renderTeamGrid();
        if (pageId === "pageInbox") { renderInbox(); renderSidebarChatList(); }
        if (pageId === "pageNotes") renderNotes();
      });
    }
  });

  // Setup Sidebar Filters (using delegation)
  document.addEventListener("click", (e) => {
    const labelBtn = e.target.closest(".sidebar-label");
    if (labelBtn) {
      document.querySelectorAll(".sidebar-label").forEach(b => b.classList.remove("active"));
      labelBtn.classList.add("active");
      state.currentLabel = labelBtn.dataset.label;
      if (state.activePageId !== "pageDashboard") navigateToPage("pageDashboard");
      renderTasks();
      return;
    }

    const priorityBtn = e.target.closest(".sidebar-priority");
    if (priorityBtn) {
      document.querySelectorAll(".sidebar-priority").forEach(b => b.classList.remove("active"));
      priorityBtn.classList.add("active");
      state.currentPriority = priorityBtn.dataset.priority;
      if (state.activePageId !== "pageDashboard") navigateToPage("pageDashboard");
      renderTasks();
      return;
    }

    const inboxBtn = e.target.closest(".sidebar-item[data-action='inbox']");
    if (inboxBtn) {
      navigateToPage("pageInbox");
      renderInbox();
      renderSidebarChatList();
      return;
    }
  });

  // Show app body after init
  document.body.style.display = "block";
}

// Wait for DOM
document.addEventListener("DOMContentLoaded", init);
