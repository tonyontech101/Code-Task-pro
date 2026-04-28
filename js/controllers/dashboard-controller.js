/**
 * dashboard-controller.js - Logic for the main dashboard (tasks)
 */

import { state } from "../modules/state.js";
import { navigateToPage } from "../modules/navigation.js";
import { showToast } from "../modules/utils.js";
import {
  createTaskRecord,
  deleteTaskRecord,
  updateTaskRecord
} from "../modules/data-store.js";

export function renderTasks() {
  const tbody = document.getElementById("taskBody");
  if (!tbody) return;

  const filtered = state.tasks.filter((task) => {
    const projMatch = state.currentProject === "all" || task.project === state.currentProject;
    const labelMatch = state.currentLabel === "all" || task.label === state.currentLabel;
    const priorityMatch = state.currentPriority === "all" || task.priority === state.currentPriority;
    return projMatch && labelMatch && priorityMatch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-16">
          <div class="text-gray-600">
            <svg class="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <p class="text-[13px] mb-1">No tasks yet</p>
            <p class="text-[11.5px] text-gray-700">Click <span class="text-cyan font-semibold">New Task</span> to get started</p>
          </div>
        </td>
      </tr>`;
  } else {
    tbody.innerHTML = filtered.map((task) => `
      <tr class="${task.id === state.selectedTaskId ? "selected" : ""}" onclick="window.selectTask('${task.id}')">
        <td>
          <div class="task-cb ${task.done ? "checked" : ""}" onclick="event.stopPropagation(); window.toggleTask('${task.id}')"></div>
        </td>
        <td><span class="badge badge-${task.priority}">${task.priority}</span></td>
        <td class="text-[13.5px] ${task.done ? "line-through text-gray-600" : "text-gray-200"} font-medium">${task.title}</td>
        <td class="text-[13px] text-gray-500 font-mono">${task.deadline}</td>
        <td><span class="badge badge-${task.label}">${task.label}</span></td>
        <td>
          <button class="icon-btn" onclick="event.stopPropagation(); window.deleteTask('${task.id}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `).join("");
  }

  updateDashboardMeta(filtered);
}

function updateDashboardMeta(filtered) {
  const title = document.getElementById("taskAreaTitle");
  if (title) {
    title.innerHTML = `Active Tasks <span class="text-[14px] font-medium text-gray-600">(${filtered.length})</span>`;
  }

  const subtitle = document.getElementById("taskAreaSubtitle");
  if (subtitle) {
    subtitle.textContent = state.currentProject === "all" ? "All Projects" : `Project: ${state.currentProject}`;
  }

  const done = filtered.filter((task) => task.done).length;
  const pct = filtered.length ? Math.round((done / filtered.length) * 100) : 0;
  const bar = document.getElementById("progressBar");
  const label = document.getElementById("progressLabel");
  const perc = document.getElementById("progressPercent");
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = `${state.currentProject === "all" ? "All Projects" : state.currentProject}: ${pct}% Complete`;
  if (perc) perc.textContent = `${pct}%`;
}

export async function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  const nextDone = !task.done;
  const nextActivity = [
    { text: nextDone ? "Marked complete" : "Marked active", time: "now" },
    ...(task.activity || [])
  ];

  try {
    await updateTaskRecord(id, {
      done: nextDone,
      activity: nextActivity
    });

    task.done = nextDone;
    task.activity = nextActivity;
    renderTasks();
  } catch (err) {
    showToast("Failed to update task", "error");
    console.error(err);
  }
}

export async function deleteTask(id) {
  try {
    const idx = state.tasks.findIndex((item) => item.id === id);
    if (idx === -1) return;

    const task = state.tasks[idx];
    await deleteTaskRecord(id);
    state.tasks.splice(idx, 1);
    if (state.selectedTaskId === id) window.closeDetailPanel();
    renderTasks();
    showToast(`Task "${task.title}" deleted`);
  } catch (err) {
    showToast("Failed to delete task", "error");
    console.error(err);
  }
}

export function selectTask(id) {
  state.selectedTaskId = id;
  renderTasks();
  window.showDetailPanel(id);
}

export function renderSidebarProjects() {
  const list = document.getElementById("sidebarProjects");
  if (!list) return;

  let projectsHtml = state.projects.map((project) => `
    <li><button class="sidebar-item sidebar-project w-full" data-project="${project.name}">
      <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${project.color}"></span>${project.name}
    </button></li>
  `).join("");

  if (state.projects.length === 0) {
    projectsHtml = `
      <li class="px-2 py-3 mt-1 text-center border border-dashed border-white/10 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group" onclick="window.openNewProjectModal()">
        <p class="text-[11px] text-gray-500 group-hover:text-cyan transition-colors font-medium">No projects yet</p>
        <p class="text-[10px] text-gray-600 group-hover:text-gray-400 mt-0.5">Click to create</p>
      </li>
    `;
  }

  list.innerHTML = `
    <li><button class="sidebar-item sidebar-project active w-full" data-project="all">
      <span class="w-2 h-2 rounded-full bg-cyan flex-shrink-0"></span>All Tasks
    </button></li>
    ${projectsHtml}
  `;

  list.querySelectorAll(".sidebar-project").forEach((btn) => {
    btn.addEventListener("click", () => {
      list.querySelectorAll(".sidebar-project").forEach((item) => item.classList.remove("active"));
      btn.classList.add("active");
      state.currentProject = btn.dataset.project;
      navigateToPage("pageDashboard");
      renderTasks();
    });
  });
}

export function openNewTaskModal() {
  document.getElementById("taskModalTitle").textContent = "New Task";
  const submitBtn = document.getElementById("taskModalSubmit");
  if (submitBtn) {
    submitBtn.textContent = "Create Task";
    submitBtn.onclick = window.addNewTask;
  }

  document.getElementById("newTaskTitle").value = "";
  document.getElementById("newTaskMeta").value = "";
  document.getElementById("newTaskDeadline").value = "";
  document.getElementById("newTaskNotes").value = "";
  document.getElementById("newTaskCode").value = "";

  const select = document.getElementById("newTaskProject");
  if (select) {
    select.innerHTML = state.projects.map((project) =>
      `<option value="${project.name}" ${project.name === state.currentProject ? "selected" : ""}>${project.name}</option>`
    ).join("");
  }

  document.getElementById("modalBackdrop")?.classList.remove("hidden");
}

export async function addNewTask() {
  try {
    const title = document.getElementById("newTaskTitle").value.trim();
    const meta = document.getElementById("newTaskMeta").value.trim();
    const priority = document.getElementById("newTaskPriority").value;
    const label = document.getElementById("newTaskLabel").value;
    const deadline = document.getElementById("newTaskDeadline").value.trim();
    const notes = document.getElementById("newTaskNotes").value.trim();
    const code = document.getElementById("newTaskCode").value.trim();
    const project = document.getElementById("newTaskProject")?.value
      || (state.currentProject !== "all" ? state.currentProject : state.projects[0]?.name || "Unassigned");

    if (!title) {
      showToast("Please enter a task title", "error");
      return;
    }

    if (deadline) {
      const parsed = new Date(deadline);
      if (Number.isNaN(parsed.getTime())) {
        showToast("Invalid deadline date", "error");
        return;
      }
    }

    const newTask = await createTaskRecord({
      title,
      priority,
      label,
      deadline: deadline || "-",
      project,
      done: false,
      desc: meta || "",
      notes: notes || "",
      code: code || "",
      tags: [label],
      activity: [{ text: "Just created", time: "now" }]
    });

    state.tasks.unshift(newTask);
    window.closeNewTaskModal();
    renderTasks();
    showToast("Task created successfully");
  } catch (err) {
    showToast("Failed to create task", "error");
    console.error(err);
  }
}

export function showDetailPanel(id) {
  const panel = document.getElementById("detailPanel");
  const task = state.tasks.find((item) => item.id === id);
  if (!panel || !task) return;

  panel.classList.remove("hidden");

  const statusEl = document.getElementById("detailStatus");
  if (statusEl) {
    statusEl.textContent = task.done ? "Completed Task" : "Active Task";
    statusEl.className = task.done
      ? "text-[10px] font-bold uppercase tracking-widest text-green-500 opacity-80 mb-1"
      : "text-[10px] font-bold uppercase tracking-widest text-cyan opacity-80 mb-1";
  }

  document.getElementById("detailTitle").textContent = task.title;
  document.getElementById("detailDesc").textContent = task.desc || "No description provided.";
  document.getElementById("detailNotes").textContent = task.notes || "No notes available.";
  document.getElementById("detailCode").textContent = task.code || "// No code snippet.";

  const prioEl = document.getElementById("detailPriority");
  if (prioEl) {
    prioEl.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    prioEl.className = `text-[12px] font-bold badge-${task.priority}`;
  }

  document.getElementById("detailTags").innerHTML = (task.tags || []).map((tag) =>
    `<span class="badge badge-wip">${tag}</span>`
  ).join("");

  renderActivityTimeline(task);
}

function renderActivityTimeline(task) {
  const container = document.getElementById("detailActivity");
  if (!container) return;

  if (!task.activity || task.activity.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-gray-600 italic ml-6">No activity recorded</p>`;
    return;
  }

  container.innerHTML = task.activity.map((activity) => `
    <div class="flex gap-4 relative">
      <div class="w-[15px] h-[15px] rounded-full bg-surface border-2 border-white/[0.1] z-10 flex-shrink-0 mt-0.5"></div>
      <div class="flex flex-col">
        <span class="text-[12.5px] text-gray-300 font-medium">${activity.text}</span>
        <span class="text-[10px] text-gray-600 uppercase font-bold tracking-tight">${activity.time}</span>
      </div>
    </div>
  `).join("");
}

export function copyDetailCode(btn) {
  const codeEl = document.getElementById("detailCode");
  if (!codeEl) return;

  navigator.clipboard.writeText(codeEl.textContent).then(() => {
    const originalSvg = btn.innerHTML;
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00d4c8" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
    setTimeout(() => {
      btn.innerHTML = originalSvg;
    }, 2000);
  }).catch((err) => {
    console.error("Failed to copy: ", err);
  });
}

export function closeDetailPanel() {
  document.getElementById("detailPanel")?.classList.add("hidden");
  state.selectedTaskId = null;
  renderTasks();
}
