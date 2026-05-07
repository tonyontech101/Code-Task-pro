/**
 * navigation.js - Page navigation logic
 */

import { state } from './state.js';

export const PAGE_IDS = ["pageDashboard", "pageProjects", "pageTeam", "pageNotes", "pageInbox", "pageSettings"];

export function navigateToPage(pageId) {
  state.activePageId = pageId;

  // Hide all pages
  PAGE_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  // Show target page
  const target = document.getElementById(pageId);
  if (target) target.classList.remove("hidden");

  // Close mobile sidebar on navigation
  document.body.classList.remove('sidebar-open');

  // Sync rail buttons
  const railIndex = PAGE_IDS.indexOf(pageId);
  const railBtns  = document.querySelectorAll(".rail-btn");
  railBtns.forEach(b => b.classList.remove("active"));
  if (railIndex !== -1 && railBtns[railIndex]) railBtns[railIndex].classList.add("active");

  // Toggle sidebar panels
  const defaultSidebar = document.getElementById('sidebarDefaultPanel');
  const inboxSidebar   = document.getElementById('sidebarInboxPanel');
  
  if (defaultSidebar && inboxSidebar) {
    if (pageId === 'pageInbox') {
      defaultSidebar.classList.add('hidden');
      inboxSidebar.classList.remove('hidden');
    } else if (pageId === 'pageNotes' || pageId === 'pageSettings') {
      defaultSidebar.classList.add('hidden');
      inboxSidebar.classList.add('hidden');
    } else {
      defaultSidebar.classList.remove('hidden');
      inboxSidebar.classList.add('hidden');
    }
  }
}
