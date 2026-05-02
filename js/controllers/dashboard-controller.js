/**
 * dashboard-controller.js - Logic for the main dashboard (tasks)
 */

import { state } from '../modules/state.js';
import { navigateToPage } from '../modules/navigation.js';
import { showToast, escapeHtml, playNotifSound } from '../modules/utils.js';
import { createTaskRecord, deleteTaskRecord, updateTaskRecord, createInboxItem } from '../modules/data-store.js';

function getTaskKey(task) {
  return `${task.ownerUid || "local"}:${task.id}`;
}

function findTaskByKey(key) {
  return state.tasks.find(task => getTaskKey(task) === key || task.id === key);
}

export function renderTasks() {
  const tbody = document.getElementById("taskBody");
  if (!tbody) return;

  const filtered = state.tasks.filter(t => {
    const projMatch     = state.currentProject  === "all" || t.project  === state.currentProject;
    const labelMatch    = state.currentLabel    === "all" || t.label    === state.currentLabel;
    const priorityMatch = state.currentPriority === "all" || t.priority === state.currentPriority;
    
    // Search filter
    const search = (state.tasksSearchQuery || "").toLowerCase();
    const searchMatch = !search || 
      t.title.toLowerCase().includes(search) || 
      (t.label && t.label.toLowerCase().includes(search)) ||
      (t.desc && t.desc.toLowerCase().includes(search));

    return projMatch && labelMatch && priorityMatch && searchMatch;
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
    tbody.innerHTML = filtered.map(t => {
      const rawKey = getTaskKey(t);
      const safeKey = escapeHtml(rawKey);
      const readOnly = Boolean(t.readOnly);
      return `
      <tr class="${rawKey === state.selectedTaskId ? 'selected' : ''}" onclick="window.selectTask(&quot;${safeKey}&quot;)">
        <td>
          <div class="task-cb ${t.done ? 'checked' : ''} ${readOnly ? 'opacity-40 cursor-not-allowed' : ''}" ${readOnly ? 'title="Shared task"' : `onclick="event.stopPropagation(); window.toggleTask(&quot;${safeKey}&quot;)"`}></div>
        </td>
        <td><span class="badge badge-${escapeHtml(t.priority)}">${escapeHtml(t.priority)}</span></td>
        <td class="text-[13.5px] ${t.done ? 'line-through text-gray-600' : 'text-gray-200'} font-medium">
          ${escapeHtml(t.title)}
          ${readOnly ? '<span class="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-cyan/10 text-cyan font-bold uppercase align-middle">Shared</span>' : ''}
        </td>
        <td class="text-[13px] text-gray-500 font-mono">${escapeHtml(t.deadline)}</td>
        <td><span class="badge badge-${escapeHtml(t.label)}">${escapeHtml(t.label)}</span></td>
        <td>
          ${readOnly ? '<span class="text-[11px] text-gray-700 font-bold">View</span>' : `<button class="icon-btn" onclick="event.stopPropagation(); window.deleteTask(&quot;${safeKey}&quot;)" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>`}
        </td>
      </tr>
    `;
    }).join("");
  }

  // Update headers and progress
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

  const done  = filtered.filter(t => t.done).length;
  const pct   = filtered.length ? Math.round((done / filtered.length) * 100) : 0;
  const bar   = document.getElementById("progressBar");
  const label = document.getElementById("progressLabel");
  const perc  = document.getElementById("progressPercent");
  if (bar)   bar.style.width = pct + "%";
  if (label) label.textContent = `${state.currentProject === "all" ? "All Projects" : state.currentProject}: ${pct}% Complete`;
  if (perc)  perc.textContent  = pct + "%";
}

export async function toggleTask(id) {
  const t = findTaskByKey(id);
  if (t?.readOnly) {
    showToast("Shared project tasks are view-only", "warning");
    return;
  }
  if (t) { 
    const nextDone = !t.done;
    t.done = nextDone;
    if (nextDone && state.soundEnabled) {
      playNotifSound();
    }
    renderTasks();
    try {
      await updateTaskRecord(t.id, { done: nextDone });
    } catch (err) {
      t.done = !nextDone;
      renderTasks();
      showToast("Failed to update task", "error");
      console.error(err);
    }
  }
}

export async function deleteTask(id) {
  try {
    const idx = state.tasks.findIndex(x => getTaskKey(x) === id || x.id === id);
    if (idx !== -1) {
      const task = state.tasks[idx];
      if (task.readOnly) {
        showToast("Shared project tasks are view-only", "warning");
        return;
      }
      await deleteTaskRecord(task.id);
      
      // Notify members if it belongs to a project
      if (task.project && task.project !== "Unassigned") {
        const project = state.projects.find(p => p.name === task.project);
        if (project && project.memberIds && project.memberIds.length > 0) {
          project.memberIds.forEach(mId => {
            const member = state.members.find(m => String(m.id) === String(mId));
            if (member && member.uid) {
              createInboxItem(member.uid, {
                type: "task",
                icon: "task",
                title: "Task removed",
                body: `Task "${task.title}" was deleted from project "${task.project}"`,
                project: task.project,
                time: "Just now"
              }).catch(console.error);
            }
          });
        }
      }
      
      state.tasks.splice(idx, 1);
      if (state.selectedTaskId === id || state.selectedTaskId === getTaskKey(task)) window.closeDetailPanel();
      renderTasks();
      showToast(`Task "${task.title}" deleted`);
    }
  } catch (err) {
    showToast("Failed to delete task", "error");
    console.error(err);
  }
}

export function selectTask(id) {
  const task = findTaskByKey(id);
  state.selectedTaskId = task ? getTaskKey(task) : id;
  renderTasks();
  window.showDetailPanel(state.selectedTaskId);
}

export function renderSidebarProjects() {
  const list = document.getElementById("sidebarProjects");
  if (!list) return;

  let projectsHtml = state.projects.map(p => `
    <li><button class="sidebar-item sidebar-project ${state.currentProject === p.name ? 'active' : ''} w-full" data-project="${escapeHtml(p.name)}">
      <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${escapeHtml(p.color)}"></span>${escapeHtml(p.name)}
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
    <li><button class="sidebar-item sidebar-project ${state.currentProject === 'all' ? 'active' : ''} w-full" data-project="all">
      <span class="w-2 h-2 rounded-full bg-cyan flex-shrink-0"></span>All Tasks
    </button></li>
    ${projectsHtml}
  `;

  // Bind clicks
  list.querySelectorAll(".sidebar-project").forEach(btn => {
    btn.addEventListener("click", () => {
      list.querySelectorAll(".sidebar-project").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const proj = btn.dataset.project;
      state.currentProject = proj;
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

  // Clear fields
  document.getElementById("newTaskTitle").value    = "";
  document.getElementById("newTaskMeta").value     = "";
  document.getElementById("newTaskDeadline").value = "";
  document.getElementById("newTaskNotes").value    = "";
  document.getElementById("newTaskCode").value     = "";

  // Populate project selector
  const sel = document.getElementById("newTaskProject");
  if (sel) {
    sel.innerHTML = state.projects.map(p =>
      `<option value="${escapeHtml(p.name)}" ${p.name === state.currentProject ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
    ).join("");
  }
  document.getElementById("modalBackdrop")?.classList.remove("hidden");
}

export async function addNewTask() {
  try {
    const title    = document.getElementById("newTaskTitle").value.trim();
    const meta     = document.getElementById("newTaskMeta").value.trim();
    const priority = document.getElementById("newTaskPriority").value;
    const label    = document.getElementById("newTaskLabel").value;
    const deadline = document.getElementById("newTaskDeadline").value.trim();
    const notes    = document.getElementById("newTaskNotes").value.trim();
    const code     = document.getElementById("newTaskCode").value.trim();
    const project  = document.getElementById("newTaskProject")?.value
                   || (state.currentProject !== "all" ? state.currentProject : state.projects[0]?.name || "Unassigned");

    if (!title) {
      showToast("Please enter a task title", "error");
      return;
    }

    // Date validation
    if (deadline) {
      const d = new Date(deadline);
      if (isNaN(d.getTime())) {
        showToast("Invalid deadline date", "error");
        return;
      }
    }

    await createTaskRecord({
      title,
      priority,
      label,
      deadline: deadline || "—",
      project,
      projectId: state.projects.find(p => p.name === project)?.id || null,
      done: false,
      desc: meta || "",
      notes: notes || "",
      code: code || "",
      tags: [label],
      activity: [{ text: "Just created", time: "now" }]
    });

    window.closeNewTaskModal();
    showToast(`Task created successfully`);
  } catch (err) {
    showToast("Failed to create task", "error");
    console.error(err);
  }
}

export function showDetailPanel(id) {
  const panel = document.getElementById("detailPanel");
  const t = findTaskByKey(id);
  if (!panel || !t) return;

  panel.classList.remove("hidden");
  
  const statusEl = document.getElementById("detailStatus");
  if (statusEl) {
    statusEl.textContent = t.done ? "Completed Task" : "Active Task";
    statusEl.className = t.done 
      ? "text-[10px] font-bold uppercase tracking-widest text-green-500 opacity-80 mb-1"
      : "text-[10px] font-bold uppercase tracking-widest text-cyan opacity-80 mb-1";
  }

  document.getElementById("detailTitle").textContent = t.title;
  document.getElementById("detailDeadline").textContent = t.deadline || "-";
  document.getElementById("detailDesc").textContent  = t.desc || "No description provided.";
  document.getElementById("detailNotes").textContent  = t.notes || "No notes available.";
  document.getElementById("detailCode").textContent   = t.code || "// No code snippet.";

  const prioEl = document.getElementById("detailPriority");
  if (prioEl) {
    prioEl.textContent = t.priority.charAt(0).toUpperCase() + t.priority.slice(1);
    prioEl.className = `text-[12px] font-bold badge-${t.priority}`;
  }

  document.getElementById("detailTags").innerHTML = (t.tags || []).map(tag =>
    `<span class="badge badge-wip">${tag}</span>`
  ).join("");

  renderActivityTimeline(t);
}

function renderActivityTimeline(task) {
  const container = document.getElementById("detailActivity");
  if (!container) return;

  if (!task.activity || task.activity.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-gray-600 italic ml-6">No activity recorded</p>`;
    return;
  }

  container.innerHTML = task.activity.map(act => `
    <div class="flex gap-4 relative">
      <div class="w-[15px] h-[15px] rounded-full bg-surface border-2 border-white/[0.1] z-10 flex-shrink-0 mt-0.5"></div>
      <div class="flex flex-col">
        <span class="text-[12.5px] text-gray-300 font-medium">${act.text}</span>
        <span class="text-[10px] text-gray-600 uppercase font-bold tracking-tight">${act.time}</span>
      </div>
    </div>
  `).join("");
}

export function copyDetailCode(btn) {
  const codeEl = document.getElementById("detailCode");
  if (!codeEl) return;

  const text = codeEl.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const originalSvg = btn.innerHTML;
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00d4c8" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
    setTimeout(() => { btn.innerHTML = originalSvg; }, 2000);
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
}

export function closeDetailPanel() {
  document.getElementById("detailPanel")?.classList.add("hidden");
  state.selectedTaskId = null;
  renderTasks();
}
