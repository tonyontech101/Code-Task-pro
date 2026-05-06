/**
 * projects-controller.js - Logic for the Projects page
 */

import { state } from '../modules/state.js';
import { auth } from '../../config/config.js';
import { navigateToPage } from '../modules/navigation.js';
import { formatDate, showToast, escapeHtml } from '../modules/utils.js';
import { createProjectRecord, deleteProjectRecord, updateProjectRecord, createInboxItem } from '../modules/data-store.js';
import { renderTasks, renderSidebarProjects } from './dashboard-controller.js';

function isOwnProject(project) {
  return !project?.ownerUid || project.ownerUid === auth.currentUser?.uid;
}

function memberLabel(member) {
  return member.name || member.displayName || member.email?.split("@")[0] || "Friend";
}

function renderProjectMemberOptions(containerId, selectedIds = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (state.members.length === 0) {
    container.innerHTML = `<p class="text-[12px] text-gray-600 italic">No team members available.</p>`;
    return;
  }

  const selected = new Set(selectedIds);
  container.innerHTML = state.members.map((member) => {
    const id = String(member.id);
    return `
      <label class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-overlay/40 hover:bg-overlay text-[12px] text-gray-400 cursor-pointer">
        <input type="checkbox" value="${escapeHtml(id)}" ${selected.has(id) ? "checked" : ""} class="accent-cyan" />
        <span class="truncate">${escapeHtml(memberLabel(member))}</span>
      </label>`;
  }).join("");
}

function inlineJsArg(value) {
  return escapeHtml(JSON.stringify(value));
}

export function renderProjectsGrid(highlightName) {
  const grid  = document.getElementById("projectsGrid");
  const count = document.getElementById("projectCount");
  if (!grid) return;

  if (count) count.textContent = `(${state.projects.length})`;

  if (state.projects.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-20 bg-elevated/50 border border-dashed border-white/10 rounded-2xl">
        <div class="text-gray-600">
          <svg class="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <p class="text-[15px] font-semibold text-gray-400 mb-1">No projects yet</p>
          <p class="text-[13px] text-gray-600">Click <span class="text-cyan font-bold cursor-pointer hover:underline" onclick="window.openNewProjectModal()">New Project</span> to get started</p>
        </div>
      </div>`;
    return;
  }

  const statusBadgeClass = (s) => {
    const map = { active: "bg-green-500/10 text-green-500", paused: "bg-amber-500/10 text-amber-500", completed: "bg-blue-500/10 text-blue-500" };
    return map[s] || "bg-gray-500/10 text-gray-500";
  };

  grid.innerHTML = state.projects.map(p => {
    const pTasks = state.tasks.filter(t => t.project === p.name);
    const doneCount = pTasks.filter(t => t.done).length;
    const taskCount = pTasks.length;
    const isActive  = highlightName === p.name;
    const pctDone   = taskCount ? Math.round((doneCount/taskCount)*100) : 0;
    const isProjectCompleted = taskCount > 0 && doneCount === taskCount;
    const projMembers = (p.memberIds || []).map(id => state.members.find(m => m.id === id)).filter(Boolean);
    const projectId = inlineJsArg(p.id);
    const projectName = inlineJsArg(p.name);
    const ownerName = p.ownerName || p.ownerEmail?.split("@")[0] || (p.ownerUid ? "Project owner" : "You");
    
    const avatars = projMembers.slice(0, 3).map(m => {
      const name = m.name || m.email || "Member";
      const ini = name.split(/[\s@]+/).filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2);
      return `<div class="w-7 h-7 -ml-2 first:ml-0 rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[10px] font-bold text-gray-400" title="${escapeHtml(name)}">${escapeHtml(ini)}</div>`;
    }).join('');
    
    const extra = projMembers.length > 3 ? `<div class="w-7 h-7 -ml-2 rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[9px] font-bold text-gray-500">+${projMembers.length-3}</div>` : '';

    return `
      <div class="project-card group bg-elevated border ${isActive ? 'border-cyan/40 ring-1 ring-cyan/20' : 'border-white/[0.04]'} rounded-xl p-5 transition-all hover:bg-hover hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/40 cursor-pointer" onclick="window.openProjectDashboard(${projectName})">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="flex items-start gap-3 min-w-0">
            <div class="w-9 h-9 rounded-lg bg-overlay border border-white/[0.06] flex items-center justify-center flex-shrink-0">
              <span class="w-2.5 h-2.5 rounded-full shadow-lg shadow-black/20" style="background: ${p.color}"></span>
            </div>
            <div class="min-w-0 pt-0.5">
              <h3 class="text-[15px] font-bold text-gray-100 group-hover:text-cyan transition-colors truncate">${escapeHtml(p.name)}</h3>
              <p class="text-[12px] text-gray-600 truncate">Owner <span class="text-gray-400 font-semibold">${escapeHtml(ownerName)}</span></p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            ${isProjectCompleted ? '<span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan/10 text-cyan border border-cyan/20">Project Completed</span>' : ''}
            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(p.status)}">${escapeHtml(p.status)}</span>
          </div>
        </div>

        <p class="text-[13px] text-gray-500 leading-relaxed mb-5 line-clamp-2 min-h-[40px]">${escapeHtml(p.desc)}</p>

        <div class="grid grid-cols-3 gap-2 mb-5">
          <div class="rounded-lg bg-overlay/70 border border-white/[0.04] px-3 py-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-600">Tasks</p>
            <p class="text-[16px] font-bold text-gray-100 font-mono mt-0.5">${taskCount}</p>
          </div>
          <div class="rounded-lg bg-overlay/70 border border-white/[0.04] px-3 py-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-600">Done</p>
            <p class="text-[16px] font-bold text-green-400 font-mono mt-0.5">${doneCount}</p>
          </div>
          <div class="rounded-lg bg-overlay/70 border border-white/[0.04] px-3 py-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-600">Members</p>
            <p class="text-[16px] font-bold text-cyan font-mono mt-0.5">${projMembers.length}</p>
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] font-medium mb-2">
          <span class="text-gray-600">Progress</span>
          <span class="font-mono" style="color: ${p.color}">${pctDone}%</span>
        </div>
        <div class="h-1.5 bg-white/5 rounded-full mb-5 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700" style="width: ${pctDone}%; background: ${p.color}"></div>
        </div>

        <div class="flex items-center justify-between mb-5 pt-4 border-t border-white/[0.03]">
          <div class="flex items-center min-h-7">${projMembers.length ? `<div class="flex items-center mr-2">${avatars}${extra}</div>` : '<span class="text-[11px] text-gray-600 italic">No members</span>'}</div>
          <span class="text-[11px] text-gray-600 font-medium">Created ${formatDate(p.createdAt || p.id)}</span>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-auto">
          <button onclick="event.stopPropagation(); window.openEditProjectModal(${projectId})" class="py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[13px] font-semibold rounded-lg transition-all active:scale-[0.98]">Edit</button>
          <button onclick="event.stopPropagation(); window.deleteProject(${projectId})" class="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-semibold rounded-lg transition-all active:scale-[0.98]">Delete</button>
        </div>
      </div>`;
  }).join('');
}

export function openProjectDashboard(name) {
  state.currentProject = name;
  navigateToPage("pageDashboard");
  renderSidebarProjects();
  renderTasks();
  document.querySelectorAll(".sidebar-project").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.project === name);
  });
}

export async function addNewProject() {
  try {
    const name   = document.getElementById("newProjectName").value.trim();
    const desc   = document.getElementById("newProjectDesc").value.trim();
    const color  = document.getElementById("newProjectColor").value;
    const status = document.getElementById("newProjectStatus").value;
    const mIds   = window.getCheckedMemberIds('newProjectMembers');

    if (!name) {
      showToast("Please enter a project name", "error");
      return;
    }
    
    if (state.projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      showToast("A project with this name already exists", "error");
      return;
    }

    await createProjectRecord({ name, desc: desc || "No description", color, status, memberIds: mIds });

    // Notify members
    mIds.forEach(mId => {
      const member = state.members.find(m => String(m.id) === String(mId));
      if (member && member.uid) {
        createInboxItem(member.uid, {
          type: "project",
          icon: "project",
          title: "Added to project",
          body: `You were added to project "${name}" by ${auth.currentUser?.displayName || "a friend"}`,
          project: name
        }).catch(console.error);
      }
    });

    document.getElementById("newProjectName").value = "";
    document.getElementById("newProjectDesc").value = "";
    window.closeNewProjectModal();
    showToast(`Project "${name}" created`);
  } catch (err) {
    showToast("Failed to create project", "error");
    console.error(err);
  }
}

export function prepareNewProjectModal() {
  renderProjectMemberOptions("newProjectMembers");
  document.getElementById("projectModalBackdrop")?.classList.remove("hidden");
}

export function closeEditProjectModal() {
  document.getElementById("editProjectBackdrop")?.classList.add("hidden");
}

export function openEditProjectModal(id) {
  const project = state.projects.find((item) => item.id === id);
  if (!project) {
    showToast("Project not found", "error");
    return;
  }

  if (!isOwnProject(project)) {
    showToast("Only the project owner can edit this project", "error");
    return;
  }

  document.getElementById("editProjectId").value = project.id;
  document.getElementById("editProjectName").value = project.name || "";
  document.getElementById("editProjectDesc").value = project.desc || "";
  document.getElementById("editProjectColor").value = project.color || "#00d4c8";
  document.getElementById("editProjectStatus").value = project.status || "active";
  renderProjectMemberOptions("editProjectMembers", project.memberIds || []);
  document.getElementById("editProjectBackdrop")?.classList.remove("hidden");
}

export async function saveEditProject() {
  const id = document.getElementById("editProjectId")?.value;
  const project = state.projects.find((item) => item.id === id);
  if (!project) {
    showToast("Project not found", "error");
    return;
  }

  if (!isOwnProject(project)) {
    showToast("Only the project owner can edit this project", "error");
    return;
  }

  const name = document.getElementById("editProjectName").value.trim();
  const desc = document.getElementById("editProjectDesc").value.trim();
  const color = document.getElementById("editProjectColor").value;
  const status = document.getElementById("editProjectStatus").value;
  const memberIds = window.getCheckedMemberIds("editProjectMembers");

  if (!name) {
    showToast("Please enter a project name", "error");
    return;
  }

  const duplicate = state.projects.some((item) => (
    item.id !== id && item.name.toLowerCase() === name.toLowerCase()
  ));
  if (duplicate) {
    showToast("A project with this name already exists", "error");
    return;
  }

  try {
    const previousName = project.name;
    await updateProjectRecord(id, {
      name,
      desc: desc || "No description",
      color,
      status,
      memberIds
    }, previousName);

    closeEditProjectModal();
    window.renderTeamGrid?.();
    showToast(`Project "${name}" updated`);
  } catch (err) {
    showToast("Failed to update project", "error");
    console.error(err);
  }
}

export async function deleteProject(id) {
  try {
    const p = state.projects.find(x => x.id === id);
    if (!p) return;
    if (!isOwnProject(p)) {
      showToast("Only the project owner can delete this project", "error");
      return;
    }
    if (!confirm(`Delete "${p.name}"? Tasks in this project will become unassigned.`)) return;

    const membersToNotify = (p.memberIds || []).map(id => state.members.find(m => String(m.id) === String(id))).filter(Boolean);
    
    await deleteProjectRecord(id, p.name);

    // Notify members
    membersToNotify.forEach(member => {
      if (member.uid) {
        createInboxItem(member.uid, {
          type: "project",
          icon: "project",
          title: "Project deleted",
          body: `Project "${p.name}" was deleted by ${auth.currentUser?.displayName || "the owner"}`,
          project: p.name,
          time: "Just now"
        }).catch(console.error);
      }
    });

    if (state.currentProject === p.name) state.currentProject = 'all';

    showToast(`Project "${p.name}" deleted`);
  } catch (err) {
    showToast("Failed to delete project", "error");
    console.error(err);
  }
}
