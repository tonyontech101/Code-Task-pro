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
  chatContacts: [],
  chatConversations: {},
  
  // Inbox State
  inboxItems: [
    { id: 1, type: "task", icon: "task", title: "New task assigned to you", body: '"Fix authentication timeout bug" was assigned to you by Sarah Chen', project: "Core v2.1", time: "2 min ago", read: false },
    { id: 2, type: "mention", icon: "mention", title: "You were mentioned", body: "Alex Rivera mentioned you in a comment on \"Implement dark mode toggle\"", project: "UI Kit", time: "15 min ago", read: false },
    { id: 3, type: "project", icon: "project", title: "Project milestone reached", body: '"Core v2.1" has reached 75% completion — 3 tasks remaining', project: "Core v2.1", time: "1 hour ago", read: false },
    { id: 4, type: "task", icon: "task", title: "Task completed", body: 'Jamie Lee marked "Set up CI/CD pipeline" as done', project: "DevOps", time: "2 hours ago", read: false },
    { id: 5, type: "system", icon: "system", title: "Weekly summary ready", body: "Your team completed 14 tasks this week — up 23% from last week", project: null, time: "3 hours ago", read: true },
    { id: 6, type: "mention", icon: "mention", title: "Comment reply", body: 'Sarah Chen replied to your comment on "API rate limiting"', project: "Core v2.1", time: "5 hours ago", read: true },
    { id: 7, type: "project", icon: "project", title: "New project created", body: '"Mobile App v1" was created by Alex Rivera — you were added as a member', project: "Mobile App v1", time: "Yesterday", read: true },
    { id: 8, type: "task", icon: "task", title: "Task deadline approaching", body: '"Database migration script" is due tomorrow', project: "Core v2.1", time: "Yesterday", read: true },
    { id: 9, type: "system", icon: "system", title: "System maintenance", body: "Scheduled maintenance on May 1st from 2:00 AM to 4:00 AM UTC", project: null, time: "2 days ago", read: true },
    { id: 10, type: "mention", icon: "mention", title: "You were tagged in a task", body: 'Jamie Lee tagged you in "Write unit tests for auth module"', project: "Core v2.1", time: "3 days ago", read: true },
    { id: 11, type: "task", icon: "task", title: "Priority changed", body: '"Optimize image loading" was changed from Low to Urgent by Sarah Chen', project: "UI Kit", time: "3 days ago", read: true },
    { id: 12, type: "project", icon: "project", title: "Sprint review scheduled", body: 'Sprint review for "Core v2.1" is scheduled for Friday at 3 PM', project: "Core v2.1", time: "4 days ago", read: true },
  ],
  inboxFilter: "all",
  
  // Notes State
  currentNoteId: null,
  notesFilter: "all",
  notesSearchQuery: "",
  tasksSearchQuery: "",
};
