// ─────────────────────────────────────────────────────────────
// app.js  —  Main application logic for CodeTask Pro
// ─────────────────────────────────────────────────────────────

// ── Centralised Data ─────────────────────────────────────────
const projects = [
  { id: 1, name: "Core v2.1",  desc: "Main platform core features",         color: "#00d4c8", status: "active", memberIds: [] },
  { id: 2, name: "API v1.3",   desc: "Public REST API endpoints",           color: "#8b5cf6", status: "active", memberIds: [] },
  { id: 3, name: "Auth v1",    desc: "Authentication & authorisation layer", color: "#ef4444", status: "active", memberIds: [] }
];

const tasks    = [];   // no dummy data — users add their own
const members  = [];   // no dummy data — users add their own

let selectedTaskId  = null;
let currentProject  = "all";
let currentLabel    = "all";
let activePageId    = "pageDashboard";

// ═══════════════════════════════════════════════════════════════
//  PAGE NAVIGATION (shared by rail buttons + sidebar projects)
// ═══════════════════════════════════════════════════════════════
const PAGE_IDS = ["pageDashboard", "pageProjects", "pageTeam"];

function navigateToPage(pageId) {
  activePageId = pageId;

  // Hide all pages
  PAGE_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  // Show target page
  const target = document.getElementById(pageId);
  if (target) target.classList.remove("hidden");

  // Sync rail buttons (0=Dashboard, 1=Projects, 2=Team)
  const railIndex = PAGE_IDS.indexOf(pageId);
  const railBtns  = document.querySelectorAll(".rail-btn");
  railBtns.forEach(b => b.classList.remove("active"));
  if (railBtns[railIndex]) railBtns[railIndex].classList.add("active");
}

// ═══════════════════════════════════════════════════════════════
//  SIDEBAR — dynamic project list
// ═══════════════════════════════════════════════════════════════
function renderSidebarProjects() {
  const list = document.getElementById("sidebarProjects");
  if (!list) return;

  list.innerHTML = `
    <li><button class="sidebar-item sidebar-project active w-full" data-project="all">
      <span class="w-2 h-2 rounded-full bg-cyan flex-shrink-0"></span>All Tasks
    </button></li>
    ${projects.map(p => `
      <li><button class="sidebar-item sidebar-project w-full" data-project="${p.name}">
        <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${p.color}"></span>${p.name}
      </button></li>
    `).join("")}
  `;

  // Re-bind click handlers
  list.querySelectorAll(".sidebar-project").forEach(btn => {
    btn.addEventListener("click", () => {
      // Clear active state
      list.querySelectorAll(".sidebar-project").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const proj = btn.dataset.project;

      if (proj === "all") {
        // "All Tasks" → go to Dashboard
        currentProject = "all";
        navigateToPage("pageDashboard");
        renderTasks();
      } else {
        // Named project → go to Dashboard, filter, and show task input
        currentProject = proj;
        navigateToPage("pageDashboard");
        renderTasks();
        openNewTaskModal();
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
//  PROJECTS PAGE
// ═══════════════════════════════════════════════════════════════
function renderProjectsGrid(highlightName) {
  const grid  = document.getElementById("projectsGrid");
  const count = document.getElementById("projectCount");
  if (!grid) return;

  if (count) count.textContent = `(${projects.length})`;

  const statusBadge = (s) => {
    const map = { active: "badge-low", paused: "badge-high", completed: "badge-urgent" };
    return map[s] || "badge-wip";
  };

  grid.innerHTML = projects.map(p => {
    const taskCount = tasks.filter(t => t.project === p.name).length;
    const doneCount = tasks.filter(t => t.project === p.name && t.done).length;
    const isActive  = highlightName === p.name;
    const pctDone   = taskCount ? Math.round((doneCount/taskCount)*100) : 0;
    const projMembers = (p.memberIds || []).map(id => members.find(m => m.id === id)).filter(Boolean);
    const avatars = projMembers.slice(0, 3).map(m => {
      const ini = m.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      return `<div class="w-6 h-6 -ml-1.5 first:ml-0 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[9px] font-bold text-white border-2 border-elevated" title="${m.name}">${ini}</div>`;
    }).join('');
    const extra = projMembers.length > 3 ? `<span class="text-[10px] text-gray-500 ml-1">+${projMembers.length-3}</span>` : '';

    return `
      <div class="project-card bg-elevated border ${isActive ? 'border-white/30 ring-1 ring-cyan/30' : 'border-white/[0.06]'} rounded-xl p-5 transition-all"
           style="border-top: 3px solid ${p.color}">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-[14px] font-bold cursor-pointer hover:text-cyan transition-colors" onclick="openProjectDashboard('${p.name}')">${p.name}</h3>
          <div class="flex items-center gap-1.5">
            <span class="badge ${statusBadge(p.status)}">${p.status}</span>
            <button class="icon-btn" onclick="openEditProjectModal(${p.id})" title="Edit">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="icon-btn hover:!text-red-400" onclick="deleteProject(${p.id})" title="Delete">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <p class="text-[12px] text-gray-500 mb-3">${p.desc}</p>
        ${projMembers.length ? `<div class="flex items-center mb-3">${avatars}${extra}</div>` : ''}
        <div class="flex items-center justify-between text-[12px] text-gray-500">
          <span>${taskCount} task${taskCount !== 1 ? 's' : ''}</span>
          <span class="font-mono text-cyan">${pctDone}%</span>
        </div>
        <div class="h-1 bg-overlay rounded-full mt-2 overflow-hidden">
          <div class="h-full rounded-full bg-gradient-to-r from-cyan to-blue-500 transition-all duration-500" style="width:${pctDone}%"></div>
        </div>
      </div>`;
  }).join('');
}

/** Click a project card → go to Dashboard filtered to that project */
function openProjectDashboard(name) {
  currentProject = name;
  navigateToPage("pageDashboard");
  renderTasks();

  // Update sidebar active state
  document.querySelectorAll(".sidebar-project").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.project === name);
  });
}

// ═══════════════════════════════════════════════════════════════
//  TASK RENDERING
// ═══════════════════════════════════════════════════════════════
function renderTasks() {
  const tbody = document.getElementById("taskBody");
  if (!tbody) return;

  const filtered = tasks.filter(t => {
    const projMatch  = currentProject === "all" || t.project === currentProject;
    const labelMatch = currentLabel === "all"   || t.label === currentLabel;
    return projMatch && labelMatch;
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
    tbody.innerHTML = filtered.map(t => `
      <tr class="${t.id === selectedTaskId ? 'selected' : ''}" onclick="selectTask(${t.id})">
        <td>
          <div class="task-cb ${t.done ? 'checked' : ''}" onclick="event.stopPropagation(); toggleTask(${t.id})"></div>
        </td>
        <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
        <td class="text-[13.5px] ${t.done ? 'line-through text-gray-600' : 'text-gray-200'} font-medium">${t.title}</td>
        <td class="text-[13px] text-gray-500 font-mono">${t.deadline}</td>
        <td><span class="badge badge-${t.label}">${t.label}</span></td>
        <td>
          <button class="icon-btn" onclick="event.stopPropagation(); deleteTask(${t.id})" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `).join("");
  }

  // Update header
  const title = document.getElementById("taskAreaTitle");
  if (title) {
    title.innerHTML = `Active Tasks <span class="text-[14px] font-medium text-gray-600">(${filtered.length})</span>`;
  }

  const subtitle = document.getElementById("taskAreaSubtitle");
  if (subtitle) {
    subtitle.textContent = currentProject === "all" ? "All Projects" : `Project: ${currentProject}`;
  }

  // Update progress
  const done  = filtered.filter(t => t.done).length;
  const pct   = filtered.length ? Math.round((done / filtered.length) * 100) : 0;
  const bar   = document.getElementById("progressBar");
  const label = document.getElementById("progressLabel");
  const perc  = document.getElementById("progressPercent");
  if (bar)   bar.style.width = pct + "%";
  if (label) label.textContent = `${currentProject === "all" ? "All Projects" : currentProject}: ${pct}% Complete`;
  if (perc)  perc.textContent  = pct + "%";
}

// ═══════════════════════════════════════════════════════════════
//  TASK ACTIONS
// ═══════════════════════════════════════════════════════════════
function toggleTask(id) {
  const t = tasks.find(x => x.id === id);
  if (t) { t.done = !t.done; renderTasks(); }
}

function deleteTask(id) {
  const idx = tasks.findIndex(x => x.id === id);
  if (idx !== -1) {
    tasks.splice(idx, 1);
    if (selectedTaskId === id) closeDetailPanel();
    renderTasks();
  }
}

function selectTask(id) {
  selectedTaskId = id;
  renderTasks();
  showDetailPanel(id);
}

// ═══════════════════════════════════════════════════════════════
//  DETAIL PANEL
// ═══════════════════════════════════════════════════════════════
function showDetailPanel(id) {
  const panel = document.getElementById("detailPanel");
  const t = tasks.find(x => x.id === id);
  if (!panel || !t) return;

  panel.classList.remove("hidden");
  document.getElementById("detailTitle").textContent = t.title;
  document.getElementById("detailDesc").textContent  = t.desc || "No description.";
  document.getElementById("detailNotes").textContent  = t.notes || "—";
  document.getElementById("detailCode").textContent   = t.code || "// no code snippet";

  document.getElementById("detailTags").innerHTML = (t.tags || []).map(tag =>
    `<span class="badge badge-wip">${tag}</span>`
  ).join("");

  document.getElementById("detailActivity").innerHTML = (t.activity || []).map(a => `
    <div class="flex items-start gap-2">
      <div class="w-1.5 h-1.5 rounded-full bg-cyan mt-1.5 flex-shrink-0"></div>
      <div>
        <p class="text-[12.5px] text-gray-300">${a.text}</p>
        <p class="text-[11px] text-gray-600">${a.time}</p>
      </div>
    </div>
  `).join("");
}

function closeDetailPanel() {
  const panel = document.getElementById("detailPanel");
  if (panel) panel.classList.add("hidden");
  selectedTaskId = null;
  renderTasks();
}

function editTask() {
  if (selectedTaskId) alert("Edit functionality coming soon!");
}

// ═══════════════════════════════════════════════════════════════
//  NEW TASK MODAL
// ═══════════════════════════════════════════════════════════════
function openNewTaskModal() {
  // Populate project selector dynamically
  const sel = document.getElementById("newTaskProject");
  if (sel) {
    sel.innerHTML = projects.map(p =>
      `<option value="${p.name}" ${p.name === currentProject ? 'selected' : ''}>${p.name}</option>`
    ).join("");
  }
  document.getElementById("modalBackdrop").classList.remove("hidden");
}

function closeNewTaskModal() {
  document.getElementById("modalBackdrop").classList.add("hidden");
}

function closeModalOnBackdrop(e) {
  if (e.target === e.currentTarget) closeNewTaskModal();
}

function addNewTask() {
  const title    = document.getElementById("newTaskTitle").value.trim();
  const meta     = document.getElementById("newTaskMeta").value.trim();
  const priority = document.getElementById("newTaskPriority").value;
  const label    = document.getElementById("newTaskLabel").value;
  const deadline = document.getElementById("newTaskDeadline").value.trim();
  const project  = document.getElementById("newTaskProject")?.value
                 || (currentProject !== "all" ? currentProject : projects[0]?.name || "Unassigned");

  if (!title) return alert("Please enter a task title.");

  tasks.unshift({
    id: Date.now(),
    title,
    priority,
    label,
    deadline: deadline || "—",
    project,
    done: false,
    desc: meta || "",
    notes: "",
    code: "",
    tags: [label],
    activity: [{ text: "Just created", time: "now" }]
  });

  // Clear inputs
  document.getElementById("newTaskTitle").value    = "";
  document.getElementById("newTaskMeta").value     = "";
  document.getElementById("newTaskDeadline").value = "";

  closeNewTaskModal();
  renderTasks();
}

// ═══════════════════════════════════════════════════════════════
//  NEW PROJECT MODAL
// ═══════════════════════════════════════════════════════════════
function renderMemberCheckboxes(containerId, selectedIds) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (members.length === 0) {
    el.innerHTML = '<p class="text-[12px] text-gray-600 italic">Add team members first to invite them.</p>';
    return;
  }
  el.innerHTML = members.map(m => {
    const checked = (selectedIds || []).includes(m.id) ? 'checked' : '';
    const ini = m.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    return `<label class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-hover cursor-pointer transition-colors">
      <input type="checkbox" value="${m.id}" ${checked} class="accent-cyan w-3.5 h-3.5" />
      <div class="w-6 h-6 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[9px] font-bold text-white">${ini}</div>
      <span class="text-[12.5px] text-gray-300">${m.name}</span>
      <span class="text-[11px] text-gray-600 ml-auto">${m.role}</span>
    </label>`;
  }).join('');
}

function getCheckedMemberIds(containerId) {
  return [...document.querySelectorAll(`#${containerId} input[type=checkbox]:checked`)].map(cb => Number(cb.value));
}

function openNewProjectModal() {
  renderMemberCheckboxes('newProjectMembers', []);
  document.getElementById("projectModalBackdrop").classList.remove("hidden");
}

function closeNewProjectModal() {
  document.getElementById("projectModalBackdrop").classList.add("hidden");
}

function closeProjectModalOnBackdrop(e) {
  if (e.target === e.currentTarget) closeNewProjectModal();
}

function addNewProject() {
  const name   = document.getElementById("newProjectName").value.trim();
  const desc   = document.getElementById("newProjectDesc").value.trim();
  const color  = document.getElementById("newProjectColor").value;
  const status = document.getElementById("newProjectStatus").value;
  const mIds   = getCheckedMemberIds('newProjectMembers');

  if (!name) return alert("Please enter a project name.");
  if (projects.find(p => p.name === name)) return alert("Project already exists.");

  projects.push({ id: Date.now(), name, desc: desc || "No description", color, status, memberIds: mIds });

  renderSidebarProjects();
  renderProjectsGrid();
  initSidebarLabels();

  document.getElementById("newProjectName").value = "";
  document.getElementById("newProjectDesc").value = "";
  closeNewProjectModal();
}

// ═══════════════════════════════════════════════════════════════
//  EDIT PROJECT MODAL
// ═══════════════════════════════════════════════════════════════
function openEditProjectModal(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;

  document.getElementById('editProjectId').value   = id;
  document.getElementById('editProjectName').value = p.name;
  document.getElementById('editProjectDesc').value = p.desc;
  document.getElementById('editProjectColor').value = p.color;
  document.getElementById('editProjectStatus').value = p.status;
  renderMemberCheckboxes('editProjectMembers', p.memberIds || []);
  document.getElementById('editProjectBackdrop').classList.remove('hidden');
}

function closeEditProjectModal() {
  document.getElementById('editProjectBackdrop').classList.add('hidden');
}

function closeEditProjectOnBackdrop(e) {
  if (e.target === e.currentTarget) closeEditProjectModal();
}

function saveEditProject() {
  const id     = Number(document.getElementById('editProjectId').value);
  const p      = projects.find(x => x.id === id);
  if (!p) return;

  const newName = document.getElementById('editProjectName').value.trim();
  if (!newName) return alert('Project name is required.');

  const oldName = p.name;
  p.name      = newName;
  p.desc      = document.getElementById('editProjectDesc').value.trim() || 'No description';
  p.color     = document.getElementById('editProjectColor').value;
  p.status    = document.getElementById('editProjectStatus').value;
  p.memberIds = getCheckedMemberIds('editProjectMembers');

  // Update tasks that referenced the old name
  if (oldName !== newName) {
    tasks.forEach(t => { if (t.project === oldName) t.project = newName; });
    if (currentProject === oldName) currentProject = newName;
  }

  renderSidebarProjects();
  renderProjectsGrid();
  renderTasks();
  initSidebarLabels();
  closeEditProjectModal();
}

// ═══════════════════════════════════════════════════════════════
//  DELETE PROJECT
// ═══════════════════════════════════════════════════════════════
function deleteProject(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Delete "${p.name}"? Tasks in this project will become unassigned.`)) return;

  tasks.forEach(t => { if (t.project === p.name) t.project = 'Unassigned'; });
  const idx = projects.findIndex(x => x.id === id);
  if (idx !== -1) projects.splice(idx, 1);

  if (currentProject === p.name) currentProject = 'all';

  renderSidebarProjects();
  renderProjectsGrid();
  renderTasks();
  initSidebarLabels();
}

// ═══════════════════════════════════════════════════════════════
//  ADD MEMBER MODAL
// ═══════════════════════════════════════════════════════════════
function openNewMemberModal() {
  document.getElementById("memberModalBackdrop").classList.remove("hidden");
}

function closeNewMemberModal() {
  document.getElementById("memberModalBackdrop").classList.add("hidden");
}

function closeMemberModalOnBackdrop(e) {
  if (e.target === e.currentTarget) closeNewMemberModal();
}

function addNewMember() {
  const name   = document.getElementById("newMemberName").value.trim();
  const email  = document.getElementById("newMemberEmail").value.trim();
  const role   = document.getElementById("newMemberRole").value;
  const status = document.getElementById("newMemberStatus").value;

  if (!name || !email) return alert("Please fill in all fields.");

  members.push({ id: Date.now(), name, email, role, status });
  renderTeamGrid();

  // Clear & close
  document.getElementById("newMemberName").value  = "";
  document.getElementById("newMemberEmail").value = "";
  closeNewMemberModal();
}

// ═══════════════════════════════════════════════════════════════
//  TEAM PAGE
// ═══════════════════════════════════════════════════════════════
function renderTeamGrid() {
  const grid  = document.getElementById("teamGrid");
  const count = document.getElementById("teamCount");
  if (!grid) return;

  if (count) count.textContent = `(${members.length})`;

  // Update stats
  const online  = members.filter(m => m.status === "online").length;
  const away    = members.filter(m => m.status === "away").length;
  const offline = members.filter(m => m.status === "offline").length;

  const statOnline  = document.getElementById("statOnline");
  const statAway    = document.getElementById("statAway");
  const statOffline = document.getElementById("statOffline");
  if (statOnline)  statOnline.textContent  = `${online} Online`;
  if (statAway)    statAway.textContent    = `${away} Away`;
  if (statOffline) statOffline.textContent = `${offline} Offline`;

  const statusColors = { online: "bg-green-500", away: "bg-yellow-500", offline: "bg-gray-500" };

  if (members.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="text-gray-600">
          <svg class="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p class="text-[13px] mb-1">No team members yet</p>
          <p class="text-[11.5px] text-gray-700">Click <span class="text-cyan font-semibold">Add Member</span> to get started</p>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = members.map(m => {
    const initials = m.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    return `
      <div class="team-card bg-elevated border border-white/[0.06] rounded-xl p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[12px] font-bold text-white">${initials}</div>
          <div>
            <h3 class="text-[13.5px] font-semibold">${m.name}</h3>
            <p class="text-[11.5px] text-gray-500">${m.email}</p>
          </div>
          <div class="ml-auto w-2.5 h-2.5 rounded-full ${statusColors[m.status] || 'bg-gray-500'}"></div>
        </div>
        <span class="badge badge-wip">${m.role}</span>
      </div>`;
  }).join("");
}

// ═══════════════════════════════════════════════════════════════
//  SIDEBAR INIT (labels, rail buttons)
// ═══════════════════════════════════════════════════════════════
function initSidebarLabels() {
  document.querySelectorAll(".sidebar-label").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-label").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentLabel = btn.dataset.label;

      // If not already on Dashboard, switch to it
      if (activePageId !== "pageDashboard") {
        navigateToPage("pageDashboard");
      }
      renderTasks();
    });
  });
}

function initRailButtons() {
  const railBtns = document.querySelectorAll(".rail-btn");
  const pageMap  = { 0: "pageDashboard", 1: "pageProjects", 2: "pageTeam" };

  railBtns.forEach((btn, i) => {
    if (i >= 3 || !pageMap[i]) return; // only first 3 are page switches
    btn.addEventListener("click", () => {
      navigateToPage(pageMap[i]);

      // When switching to projects page, render the grid
      if (pageMap[i] === "pageProjects") renderProjectsGrid();
      if (pageMap[i] === "pageTeam")     renderTeamGrid();

      // Reset sidebar project highlight to "All Tasks" when going to Dashboard via rail
      if (pageMap[i] === "pageDashboard") {
        currentProject = "all";
        document.querySelectorAll(".sidebar-project").forEach(b => b.classList.remove("active"));
        const allBtn = document.querySelector('.sidebar-project[data-project="all"]');
        if (allBtn) allBtn.classList.add("active");
        renderTasks();
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  // Small delay to let Web Components render their innerHTML
  setTimeout(() => {
    renderSidebarProjects();
    initSidebarLabels();
    initRailButtons();
    renderTasks();
    renderProjectsGrid();
    renderTeamGrid();
  }, 50);
});
