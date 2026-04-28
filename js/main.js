/**
 * main.js - Application entry point
 */

import { state } from "./modules/state.js";
import { navigateToPage } from "./modules/navigation.js";
import { loadWorkspaceData, ensureUserProfile } from "./modules/data-store.js";
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
} from "./controllers/dashboard-controller.js";
import {
  renderProjectsGrid,
  openProjectDashboard,
  addNewProject,
  deleteProject,
  openEditProjectModal,
  saveEditProject,
  closeEditProjectModal,
  refreshProjectMemberOptions
} from "./controllers/projects-controller.js";
import {
  renderTeamGrid,
  sendTeamInvitation,
  deleteMember,
  resetMemberModal
} from "./controllers/team-controller.js";
import {
  renderInbox,
  openChat,
  renderSidebarChatList,
  filterSidebarChats,
  toggleInboxRead,
  dismissInboxItem,
  filterInbox,
  markAllInboxRead,
  clearAllInbox,
  sendChatMessage,
  acceptInvitation,
  declineInvitation,
  loadInvitationsToInbox,
  startGlobalMessageListener,
  startNotificationListener
} from "./controllers/inbox-controller.js";
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
} from "./controllers/notes-controller.js";
import {
  setSettingsTab,
  sendContactForm,
  saveProfile,
  renderProfile as renderSettingsProfile,
  handleAvatarUpload
} from "./controllers/settings-controller.js";

import "../components/sidebar.js";
import "../components/header.js";
import "../components/task-area.js";
import "../components/detail-panel.js";
import "../components/task-modal.js";
import "../components/inbox-page.js";
import "../components/notes-page.js";
import "../components/settings-page.js";

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
window.saveEditProject = saveEditProject;
window.closeEditProjectModal = closeEditProjectModal;
window.sendTeamInvitation = sendTeamInvitation;
window.addNewMember = sendTeamInvitation; // backward compat for HTML onclick
window.deleteMember = deleteMember;
window.acceptInvitation = acceptInvitation;
window.declineInvitation = declineInvitation;
window.openChat = openChat;
window.renderInbox = renderInbox;
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
window.filterInbox = filterInbox;
window.markAllInboxRead = markAllInboxRead;
window.clearAllInbox = clearAllInbox;
window.sendChatMessage = sendChatMessage;
window.saveProfile = saveProfile;
window.handleAvatarUpload = handleAvatarUpload;

window.closeNewTaskModal = () => document.getElementById("modalBackdrop")?.classList.add("hidden");
window.openNewProjectModal = () => {
  refreshProjectMemberOptions();
  document.getElementById("projectModalBackdrop")?.classList.remove("hidden");
};
window.closeNewProjectModal = () => document.getElementById("projectModalBackdrop")?.classList.add("hidden");
window.openNewMemberModal = () => {
  resetMemberModal();
  document.getElementById("memberModalBackdrop")?.classList.remove("hidden");
};
window.closeNewMemberModal = () => {
  resetMemberModal();
  document.getElementById("memberModalBackdrop")?.classList.add("hidden");
};
window.openLogoutModal = () => document.getElementById("logoutModalBackdrop")?.classList.remove("hidden");
window.closeLogoutModal = () => document.getElementById("logoutModalBackdrop")?.classList.add("hidden");
window.closeChatView = () => {
  document.getElementById("inboxNotificationsView")?.classList.remove("hidden");
  document.getElementById("inboxChatView")?.classList.add("hidden");
};
window.getCheckedMemberIds = (containerId) => {
  return [...document.querySelectorAll(`#${containerId} input[type=checkbox]:checked`)].map((checkbox) => checkbox.value);
};
window.closeProjectModalOnBackdrop = (event) => {
  if (event.target === event.currentTarget) window.closeNewProjectModal();
};
window.closeEditProjectOnBackdrop = (event) => {
  if (event.target === event.currentTarget) window.closeEditProjectModal();
};
window.closeMemberModalOnBackdrop = (event) => {
  if (event.target === event.currentTarget) window.closeNewMemberModal();
};
window.closeLogoutModalOnBackdrop = (event) => {
  if (event.target === event.currentTarget) window.closeLogoutModal();
};
window.closeModalOnBackdrop = (event) => {
  if (event.target === event.currentTarget) window.closeNewTaskModal();
};

let hasInitialized = false;
let domReady = false;
let authReady = false;

function renderAll() {
  renderSidebarProjects();
  renderTasks();
  renderProjectsGrid();
  renderTeamGrid();
  renderNotes();
  renderSettingsProfile();
}

function bindRailButtons() {
  const railBtns = document.querySelectorAll(".rail-btn");
  railBtns.forEach((btn, index) => {
    const pageMap = {
      0: "pageDashboard",
      1: "pageProjects",
      2: "pageTeam",
      3: "pageNotes",
      4: "pageInbox",
      5: "pageSettings"
    };

    const pageId = pageMap[index];
    if (!pageId) return;

    btn.addEventListener("click", () => {
      navigateToPage(pageId);
      if (pageId === "pageProjects") renderProjectsGrid();
      if (pageId === "pageTeam") renderTeamGrid();
      if (pageId === "pageInbox") {
        renderInbox();
        renderSidebarChatList();
      }
      if (pageId === "pageNotes") renderNotes();
      if (pageId === "pageSettings") renderSettingsProfile();
    });
  });
}

function bindSidebarFilters() {
  document.addEventListener("click", (event) => {
    const labelBtn = event.target.closest(".sidebar-label");
    if (labelBtn) {
      document.querySelectorAll(".sidebar-label").forEach((btn) => btn.classList.remove("active"));
      labelBtn.classList.add("active");
      state.currentLabel = labelBtn.dataset.label;
      if (state.activePageId !== "pageDashboard") navigateToPage("pageDashboard");
      renderTasks();
      return;
    }

    const priorityBtn = event.target.closest(".sidebar-priority");
    if (priorityBtn) {
      document.querySelectorAll(".sidebar-priority").forEach((btn) => btn.classList.remove("active"));
      priorityBtn.classList.add("active");
      state.currentPriority = priorityBtn.dataset.priority;
      if (state.activePageId !== "pageDashboard") navigateToPage("pageDashboard");
      renderTasks();
      return;
    }

    const inboxBtn = event.target.closest(".sidebar-item[data-action='inbox']");
    if (inboxBtn) {
      navigateToPage("pageInbox");
      renderInbox();
      renderSidebarChatList();
    }
  });
}

async function init() {
  if (hasInitialized || !domReady || !authReady) return;
  hasInitialized = true;

  try {
    console.log("Initializing CodeTask Pro...");
    await ensureUserProfile();
    await loadWorkspaceData();
    await loadInvitationsToInbox();
    startGlobalMessageListener();
    startNotificationListener();
    renderAll();
    refreshProjectMemberOptions();
    bindRailButtons();
    bindSidebarFilters();
    document.body.style.display = "block";
  } catch (err) {
    console.error("Failed to initialize workspace data", err);
    hasInitialized = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  domReady = true;
  init();
});

window.addEventListener("auth-ready", () => {
  authReady = true;
  init();
});
