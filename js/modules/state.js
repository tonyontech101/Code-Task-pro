/**
 * state.js - Centralized state management for CodeTask Pro
 */

// Notes no longer seeded from static dummy data; Firestore provides real records.

export const state = {
  projects: [],
  tasks: [],
  members: [],
  pendingInvitations: [],
  notes: [],
  
  // UI State
  selectedTaskId: null,
  currentProject: "all",
  currentLabel: "all",
  currentPriority: "all",
  activePageId: "pageDashboard",
  
  // Chat Data
  activeChatContactId: null,
  chatConversations: {},
  chatLastCount: {},
  chatUnread: {},
  pendingLocalMessages: {},
  
  // Inbox State
  inboxItems: [],
  dbNotifications: [],
  inboxFilter: "all",
  
  // Notes State
  currentNoteId: null,
  notesFilter: "all",
  notesSearchQuery: "",
};
