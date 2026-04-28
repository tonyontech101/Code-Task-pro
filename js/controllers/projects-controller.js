/**
 * projects-controller.js - Logic for the Projects page
 */

import { state } from "../modules/state.js";
import { navigateToPage } from "../modules/navigation.js";
import { formatDate, showToast } from "../modules/utils.js";
import {
  createProjectRecord,
  deleteProjectRecord,
  updateProjectRecord
} from "../modules/data-store.js";
import { renderTasks, renderSidebarProjects } from "./dashboard-controller.js";
import { renderTeamGrid } from "./team-controller.js";

function getStatusBadgeClass(status) {
  const map = {
    active: "bg-green-500/10 text-green-500",
    paused: "bg-amber-500/10 text-amber-500",
    completed: "bg-blue-500/10 text-blue-500"
  };
  return map[status] || "bg-gray-500/10 text-gray-500";
}

function renderMemberChecklist(containerId, selectedIds = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (state.members.length === 0) {
    container.innerHTML = `<p class="text-[12px] text-gray-600 italic">Add team members first to invite them.</p>`;
    return;
  }

  container.innerHTML = state.members.map((member) => `
    <label class="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[12px] text-gray-300">
      <input type="checkbox" value="${member.id}" ${selectedIds.includes(member.id) ? "checked" : ""} />
      <span class="flex-1">${member.name}</span>
      <span class="text-gray-600">${member.role}</span>
    </label>
  `).join("");
}

export function refreshProjectMemberOptions() {
  renderMemberChecklist("newProjectMembers");

  const editProjectId = document.getElementById("editProjectId")?.value;
  if (!editProjectId) return;

  const project = state.projects.find((item) => item.id === editProjectId);
  renderMemberChecklist("editProjectMembers", project?.memberIds || []);
}

export function renderProjectsGrid(highlightName) {
  const grid = document.getElementById("projectsGrid");
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

  grid.innerHTML = state.projects.map((project) => {
    const projectTasks = state.tasks.filter((task) => task.project === project.name);
    const doneCount = projectTasks.filter((task) => task.done).length;
    const taskCount = projectTasks.length;
    const isActive = highlightName === project.name;
    const pctDone = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;
    const projMembers = (project.memberIds || [])
      .map((memberId) => state.members.find((member) => member.id === memberId))
      .filter(Boolean);

    const avatars = projMembers.slice(0, 3).map((member) => {
      const initials = member.name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
      return `<div class="w-7 h-7 -ml-2 first:ml-0 rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[10px] font-bold text-gray-400" title="${member.name}">${initials}</div>`;
    }).join("");

    const extra = projMembers.length > 3
      ? `<div class="w-7 h-7 -ml-2 rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[9px] font-bold text-gray-500">+${projMembers.length - 3}</div>`
      : "";

    return `
      <div class="project-card group bg-elevated border ${isActive ? "border-cyan/40 ring-1 ring-cyan/20" : "border-white/[0.04]"} rounded-2xl p-6 transition-all hover:bg-hover hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/40">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-2.5 rounded-full shadow-lg shadow-black/20" style="background: ${project.color}"></div>
            <h3 class="text-[15px] font-bold text-gray-100 cursor-pointer hover:text-cyan transition-colors" onclick="window.openProjectDashboard('${project.name}')">${project.name}</h3>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(project.status)}">${project.status}</span>
        </div>
        <p class="text-[13px] text-gray-500 leading-relaxed mb-6 line-clamp-2 min-h-[40px]">${project.desc}</p>
        <div class="flex items-center justify-between text-[11px] font-medium mb-2">
          <span class="text-gray-600">${doneCount} of ${taskCount} tasks</span>
          <span class="font-mono" style="color: ${project.color}">${pctDone}%</span>
        </div>
        <div class="h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700" style="width: ${pctDone}%; background: ${project.color}"></div>
        </div>
        <div class="flex items-center justify-between mb-6 pt-4 border-t border-white/[0.03]">
          <div class="flex items-center">${projMembers.length ? `<div class="flex items-center mr-2">${avatars}${extra}</div>` : ""}</div>
          <span class="text-[11px] text-gray-600 font-medium">Created ${formatDate(project.createdAt || project.id)}</span>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-auto">
          <button onclick="window.openEditProjectModal('${project.id}')" class="py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98]">Edit</button>
          <button onclick="window.deleteProject('${project.id}')" class="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98]">Delete</button>
        </div>
      </div>`;
  }).join("");
}

export function openProjectDashboard(name) {
  state.currentProject = name;
  navigateToPage("pageDashboard");
  renderTasks();
  document.querySelectorAll(".sidebar-project").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.project === name);
  });
}

export function openEditProjectModal(id) {
  const project = state.projects.find((item) => item.id === id);
  if (!project) return;

  document.getElementById("editProjectId").value = project.id;
  document.getElementById("editProjectName").value = project.name;
  document.getElementById("editProjectDesc").value = project.desc || "";
  document.getElementById("editProjectColor").value = project.color || "#00d4c8";
  document.getElementById("editProjectStatus").value = project.status || "active";
  renderMemberChecklist("editProjectMembers", project.memberIds || []);
  document.getElementById("editProjectBackdrop")?.classList.remove("hidden");
}

export function closeEditProjectModal() {
  document.getElementById("editProjectBackdrop")?.classList.add("hidden");
  document.getElementById("editProjectId").value = "";
}

export async function saveEditProject() {
  const id = document.getElementById("editProjectId").value;
  const project = state.projects.find((item) => item.id === id);
  if (!project) return;

  const nextName = document.getElementById("editProjectName").value.trim();
  const nextDesc = document.getElementById("editProjectDesc").value.trim();
  const nextColor = document.getElementById("editProjectColor").value;
  const nextStatus = document.getElementById("editProjectStatus").value;
  const nextMemberIds = window.getCheckedMemberIds("editProjectMembers");

  if (!nextName) {
    showToast("Please enter a project name", "error");
    return;
  }

  if (state.projects.some((item) => item.id !== id && item.name.toLowerCase() === nextName.toLowerCase())) {
    showToast("A project with this name already exists", "error");
    return;
  }

  try {
    await updateProjectRecord(id, {
      name: nextName,
      desc: nextDesc || "No description",
      color: nextColor,
      status: nextStatus,
      memberIds: nextMemberIds
    }, project.name);

    if (project.name !== nextName) {
      state.tasks.forEach((task) => {
        if (task.project === project.name) task.project = nextName;
      });
      if (state.currentProject === project.name) {
        state.currentProject = nextName;
      }
    }

    project.name = nextName;
    project.desc = nextDesc || "No description";
    project.color = nextColor;
    project.status = nextStatus;
    project.memberIds = nextMemberIds;

    closeEditProjectModal();
    renderSidebarProjects();
    renderProjectsGrid(nextName);
    renderTasks();
    renderTeamGrid();
    showToast(`Project "${nextName}" updated`);
  } catch (err) {
    showToast("Failed to update project", "error");
    console.error(err);
  }
}

export async function addNewProject() {
  try {
    const name = document.getElementById("newProjectName").value.trim();
    const desc = document.getElementById("newProjectDesc").value.trim();
    const color = document.getElementById("newProjectColor").value;
    const status = document.getElementById("newProjectStatus").value;
    const memberIds = window.getCheckedMemberIds("newProjectMembers");

    if (!name) {
      showToast("Please enter a project name", "error");
      return;
    }

    if (state.projects.some((project) => project.name.toLowerCase() === name.toLowerCase())) {
      showToast("A project with this name already exists", "error");
      return;
    }

    const project = await createProjectRecord({
      name,
      desc: desc || "No description",
      color,
      status,
      memberIds
    });

    state.projects.push(project);
    renderSidebarProjects();
    renderProjectsGrid();
    renderTeamGrid();

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
    const project = state.projects.find((item) => item.id === id);
    if (!project) return;
    if (!confirm(`Delete "${project.name}"? Tasks in this project will become unassigned.`)) return;

    await deleteProjectRecord(id, project.name);

    state.tasks.forEach((task) => {
      if (task.project === project.name) task.project = "Unassigned";
    });
    state.projects = state.projects.filter((item) => item.id !== id);

    if (state.currentProject === project.name) state.currentProject = "all";

    renderSidebarProjects();
    renderProjectsGrid();
    renderTasks();
    renderTeamGrid();
    showToast(`Project "${project.name}" deleted`);
  } catch (err) {
    showToast("Failed to delete project", "error");
    console.error(err);
  }
}
