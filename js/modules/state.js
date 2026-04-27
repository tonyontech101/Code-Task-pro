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
  chatContacts: [
    { id: "sarah",  name: "Sarah Chen",    role: "Lead Developer",   status: "online",  avatar: "SC", unreadCount: 2 },
    { id: "alex",   name: "Alex Rivera",   role: "UI/UX Designer",   status: "online",  avatar: "AR", unreadCount: 0 },
    { id: "jamie",  name: "Jamie Lee",     role: "DevOps Engineer",  status: "away",    avatar: "JL", unreadCount: 0 },
    { id: "morgan", name: "Morgan Blake",  role: "Project Manager",  status: "online",  avatar: "MB", unreadCount: 0 },
    { id: "taylor", name: "Taylor Kim",    role: "QA Engineer",      status: "offline", avatar: "TK", unreadCount: 0 },
  ],
  chatConversations: {
    sarah: [
      { from: "sarah",  text: "Hey! Have you looked at the auth timeout bug yet?",        time: "10:15 AM", date: "Today" },
      { from: "me",     text: "Yeah, I think it's a token refresh issue. Looking into it now.", time: "10:18 AM", date: "Today" },
      { from: "sarah",  text: "Great. The users on the enterprise plan are seeing it the most.", time: "10:20 AM", date: "Today" },
      { from: "me",     text: "Got it. I'll check the refresh interval config for enterprise tier.", time: "10:22 AM", date: "Today" },
      { from: "sarah",  text: "Perfect. Also, can you review my PR for the rate limiter? 🙏", time: "10:30 AM", date: "Today" },
      { from: "me",     text: "Sure, I'll take a look after lunch.", time: "10:32 AM", date: "Today" },
      { from: "sarah",  text: "Thanks! Let me know if you have questions about the sliding window approach.", time: "10:33 AM", date: "Today" },
    ],
    alex: [
      { from: "alex",   text: "I pushed the new dark mode toggle designs to Figma.",    time: "9:00 AM", date: "Today" },
      { from: "me",     text: "These look amazing! Love the transition animations.",     time: "9:15 AM", date: "Today" },
      { from: "alex",   text: "Thanks! Should I start on the mobile responsive variants?", time: "9:18 AM", date: "Today" },
      { from: "me",     text: "Yes please. Let's prioritize tablet breakpoints first.",  time: "9:22 AM", date: "Today" },
      { from: "alex",   text: "On it. I'll have those ready by EOD.",                   time: "9:25 AM", date: "Today" },
    ],
    jamie: [
      { from: "jamie",  text: "CI/CD pipeline is all set up. Tests running on every push now.", time: "Yesterday", date: "Yesterday" },
      { from: "me",     text: "Awesome work! How's the build time looking?",              time: "Yesterday", date: "Yesterday" },
      { from: "jamie",  text: "Down to 3 min 40s from 8 min. Caching did the trick 🚀",  time: "Yesterday", date: "Yesterday" },
      { from: "me",     text: "That's a massive improvement! Great job.",                 time: "Yesterday", date: "Yesterday" },
    ],
    morgan: [
      { from: "morgan", text: "Sprint review is scheduled for Friday at 3 PM.",           time: "11:00 AM", date: "Today" },
      { from: "me",     text: "Sounds good. Do we have the agenda finalized?",             time: "11:05 AM", date: "Today" },
      { from: "morgan", text: "Almost — just need your update on the auth module.",        time: "11:08 AM", date: "Today" },
      { from: "me",     text: "I'll prepare a quick summary by Thursday.",                time: "11:12 AM", date: "Today" },
      { from: "morgan", text: "Perfect. Also, client demo moved to next Wednesday.",       time: "11:15 AM", date: "Today" },
      { from: "me",     text: "Noted. I'll make sure the staging env is ready.",           time: "11:20 AM", date: "Today" },
    ],
    taylor: [
      { from: "taylor", text: "Found a regression in the file upload module.",             time: "2 days ago", date: "Mon" },
      { from: "me",     text: "Can you create a ticket with the repro steps?",              time: "2 days ago", date: "Mon" },
      { from: "taylor", text: "Already done — CT-892. It's a race condition in the chunked upload.", time: "2 days ago", date: "Mon" },
      { from: "me",     text: "Thanks Taylor, I'll take a look at it.",                    time: "2 days ago", date: "Mon" },
    ],
  },
  
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
};
