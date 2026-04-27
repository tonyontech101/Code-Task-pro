/**
 * main.js - Application entry point
 */

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
  deleteProject 
} from './controllers/projects-controller.js';
import { 
  renderTeamGrid, 
  addNewMember, 
  deleteMember 
} from './controllers/team-controller.js';
import { 
  renderInbox, 
  openChat, 
  renderChatMessages, 
  renderSidebarChatList,
  filterSidebarChats,
  toggleInboxRead,
  dismissInboxItem,
  filterInbox,
  markAllInboxRead,
  clearAllInbox,
  sendChatMessage
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
  sendContactForm
} from './controllers/settings-controller.js';

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
window.addNewMember = addNewMember;
window.deleteMember = deleteMember;
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

// Additional UI helper functions
window.closeNewTaskModal = () => document.getElementById("modalBackdrop")?.classList.add("hidden");
window.openNewProjectModal = () => document.getElementById("projectModalBackdrop")?.classList.remove("hidden");
window.closeNewProjectModal = () => document.getElementById("projectModalBackdrop")?.classList.add("hidden");
window.openNewMemberModal = () => document.getElementById("memberModalBackdrop")?.classList.remove("hidden");
window.closeNewMemberModal = () => document.getElementById("memberModalBackdrop")?.classList.add("hidden");
window.openLogoutModal = () => document.getElementById("logoutModalBackdrop")?.classList.remove("hidden");
window.closeLogoutModal = () => document.getElementById("logoutModalBackdrop")?.classList.add("hidden");
window.closeChatView = () => {
  document.getElementById('inboxNotificationsView')?.classList.remove('hidden');
  document.getElementById('inboxChatView')?.classList.add('hidden');
};
window.getCheckedMemberIds = (containerId) => {
  return [...document.querySelectorAll(`#${containerId} input[type=checkbox]:checked`)].map(cb => Number(cb.value));
};

// Mock data initialization (or fetch from Firebase later)
function init() {
  console.log("Initializing CodeTask Pro...");
  
  // Initial Renders
  renderSidebarProjects();
  renderTasks();
  
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
