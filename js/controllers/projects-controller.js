/**
 * projects-controller.js - Logic for the Projects page
 */

import { state } from '../modules/state.js';
import { navigateToPage } from '../modules/navigation.js';
import { formatDate, showToast, escapeHtml } from '../modules/utils.js';
import { createProjectRecord, deleteProjectRecord } from '../modules/data-store.js';
import { renderTasks, renderSidebarProjects } from './dashboard-controller.js';

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
    const projMembers = (p.memberIds || []).map(id => state.members.find(m => m.id === id)).filter(Boolean);
    const projectId = JSON.stringify(p.id);
    const projectName = JSON.stringify(p.name);
    
    const avatars = projMembers.slice(0, 3).map(m => {
      const name = m.name || m.email || "Member";
      const ini = name.split(/[\s@]+/).filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2);
      return `<div class="w-7 h-7 -ml-2 first:ml-0 rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[10px] font-bold text-gray-400" title="${escapeHtml(name)}">${escapeHtml(ini)}</div>`;
    }).join('');
    
    const extra = projMembers.length > 3 ? `<div class="w-7 h-7 -ml-2 rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[9px] font-bold text-gray-500">+${projMembers.length-3}</div>` : '';

    return `
      <div class="project-card group bg-elevated border ${isActive ? 'border-cyan/40 ring-1 ring-cyan/20' : 'border-white/[0.04]'} rounded-2xl p-6 transition-all hover:bg-hover hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/40">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-2.5 rounded-full shadow-lg shadow-black/20" style="background: ${p.color}"></div>
            <h3 class="text-[15px] font-bold text-gray-100 cursor-pointer hover:text-cyan transition-colors" onclick="window.openProjectDashboard(${projectName})">${escapeHtml(p.name)}</h3>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(p.status)}">${escapeHtml(p.status)}</span>
        </div>
        <p class="text-[13px] text-gray-500 leading-relaxed mb-6 line-clamp-2 min-h-[40px]">${escapeHtml(p.desc)}</p>
        <div class="flex items-center justify-between text-[11px] font-medium mb-2">
          <span class="text-gray-600">${doneCount} of ${taskCount} tasks</span>
          <span class="font-mono" style="color: ${p.color}">${pctDone}%</span>
        </div>
        <div class="h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700" style="width: ${pctDone}%; background: ${p.color}"></div>
        </div>
        <div class="flex items-center justify-between mb-6 pt-4 border-t border-white/[0.03]">
          <div class="flex items-center">${projMembers.length ? `<div class="flex items-center mr-2">${avatars}${extra}</div>` : ''}</div>
          <span class="text-[11px] text-gray-600 font-medium">Created ${formatDate(p.id)}</span>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-auto">
          <button onclick="window.openEditProjectModal(${projectId})" class="py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98]">Edit</button>
          <button onclick="window.deleteProject(${projectId})" class="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98]">Delete</button>
        </div>
      </div>`;
  }).join('');
}

export function openProjectDashboard(name) {
  state.currentProject = name;
  navigateToPage("pageDashboard");
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

    const project = await createProjectRecord({ name, desc: desc || "No description", color, status, memberIds: mIds });
    state.projects.unshift(project);

    renderSidebarProjects();
    renderProjectsGrid();

    document.getElementById("newProjectName").value = "";
    document.getElementById("newProjectDesc").value = "";
    window.closeNewProjectModal();
    showToast(`Project "${name}" created`);
  } catch (err) {
    showToast("Failed to create project", "error");
    console.error(err);
  }
}

export async function deleteProject(id) {
  try {
    const p = state.projects.find(x => x.id === id);
    if (!p) return;
    if (!confirm(`Delete "${p.name}"? Tasks in this project will become unassigned.`)) return;

    await deleteProjectRecord(id, p.name);
    state.tasks.forEach(t => { if (t.project === p.name) t.project = 'Unassigned'; });
    const idx = state.projects.findIndex(x => x.id === id);
    if (idx !== -1) state.projects.splice(idx, 1);

    if (state.currentProject === p.name) state.currentProject = 'all';

    renderSidebarProjects();
    renderProjectsGrid();
    renderTasks();
    showToast(`Project "${p.name}" deleted`);
  } catch (err) {
    showToast("Failed to delete project", "error");
    console.error(err);
  }
}
