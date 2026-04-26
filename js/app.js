// ─────────────────────────────────────────────────────────────
// app.js  —  Main application logic for CodeTask Pro
// ─────────────────────────────────────────────────────────────

// ── Centralised Data ─────────────────────────────────────────
const projects = [];

const tasks    = [];   // no dummy data — users add their own
const members  = [];   // no dummy data — users add their own

let selectedTaskId  = null;
let currentProject  = "all";
let currentLabel    = "all";
let currentPriority = "all";
let activePageId    = "pageDashboard";

// ── Chat Data ────────────────────────────────────────────────
let activeChatContactId = null;

const chatContacts = [
  { id: "sarah",  name: "Sarah Chen",    role: "Lead Developer",   status: "online",  avatar: "SC" },
  { id: "alex",   name: "Alex Rivera",   role: "UI/UX Designer",   status: "online",  avatar: "AR" },
  { id: "jamie",  name: "Jamie Lee",     role: "DevOps Engineer",  status: "away",    avatar: "JL" },
  { id: "morgan", name: "Morgan Blake",  role: "Project Manager",  status: "online",  avatar: "MB" },
  { id: "taylor", name: "Taylor Kim",    role: "QA Engineer",      status: "offline", avatar: "TK" },
];

const chatConversations = {
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
};

// ═══════════════════════════════════════════════════════════════
//  PAGE NAVIGATION (shared by rail buttons + sidebar projects)
// ═══════════════════════════════════════════════════════════════
const PAGE_IDS = ["pageDashboard", "pageProjects", "pageTeam", "pageInbox", "pageNotes"];

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

  // Sync rail buttons (0=Dashboard, 1=Projects, 2=Team, 4=Inbox)
  const railIndex = PAGE_IDS.indexOf(pageId);
  const railBtns  = document.querySelectorAll(".rail-btn");
  railBtns.forEach(b => b.classList.remove("active"));
  // Map page index to actual rail button index
  const railMap = { 0: 0, 1: 1, 2: 2, 3: 4 };
  const actualRailIdx = railMap[railIndex];
  if (actualRailIdx !== undefined && railBtns[actualRailIdx]) railBtns[actualRailIdx].classList.add("active");

  // Toggle default sidebar vs inbox sidebar
  const defaultSidebar = document.getElementById('sidebarDefaultPanel');
  const inboxSidebar   = document.getElementById('sidebarInboxPanel');
  // Sidebar panels may not exist yet on first load
  if (defaultSidebar && inboxSidebar) {
    if (pageId === 'pageInbox') {
      defaultSidebar.classList.add('hidden');
      inboxSidebar.classList.remove('hidden');
    } else if (pageId === 'pageNotes') {
      defaultSidebar.classList.add('hidden');
      inboxSidebar.classList.add('hidden');
    } else {
      defaultSidebar.classList.remove('hidden');
      inboxSidebar.classList.add('hidden');
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  SIDEBAR — dynamic project list
// ═══════════════════════════════════════════════════════════════
function renderSidebarProjects() {
  const list = document.getElementById("sidebarProjects");
  if (!list) return;

  let projectsHtml = projects.map(p => `
    <li><button class="sidebar-item sidebar-project w-full" data-project="${p.name}">
      <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${p.color}"></span>${p.name}
    </button></li>
  `).join("");

  if (projects.length === 0) {
    projectsHtml = `
      <li class="px-2 py-3 mt-1 text-center border border-dashed border-white/10 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group" onclick="openNewProjectModal()">
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

  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-20 bg-elevated/50 border border-dashed border-white/10 rounded-2xl">
        <div class="text-gray-600">
          <svg class="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <p class="text-[15px] font-semibold text-gray-400 mb-1">No projects yet</p>
          <p class="text-[13px] text-gray-600">Click <span class="text-cyan font-bold cursor-pointer hover:underline" onclick="openNewProjectModal()">New Project</span> to get started</p>
        </div>
      </div>`;
    return;
  }

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const statusBadgeClass = (s) => {
    const map = { 
      active: "bg-green-500/10 text-green-500", 
      paused: "bg-amber-500/10 text-amber-500", 
      completed: "bg-blue-500/10 text-blue-500" 
    };
    return map[s] || "bg-gray-500/10 text-gray-500";
  };

  grid.innerHTML = projects.map(p => {
    const taskCount = tasks.filter(t => t.project === p.name).length;
    const doneCount = tasks.filter(t => t.project === p.name && t.done).length;
    const isActive  = highlightName === p.name;
    const pctDone   = taskCount ? Math.round((doneCount/taskCount)*100) : 0;
    const projMembers = (p.memberIds || []).map(id => members.find(m => m.id === id)).filter(Boolean);
    
    const avatars = projMembers.slice(0, 3).map(m => {
      const ini = m.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      return `<div class="w-7 h-7 -ml-2 first:ml-0 rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[10px] font-bold text-gray-400" title="${m.name}">${ini}</div>`;
    }).join('');
    
    const extra = projMembers.length > 3 ? `<div class="w-7 h-7 -ml-2 rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[9px] font-bold text-gray-500">+${projMembers.length-3}</div>` : '';

    return `
      <div class="project-card group bg-elevated border ${isActive ? 'border-cyan/40 ring-1 ring-cyan/20' : 'border-white/[0.04]'} rounded-2xl p-6 transition-all hover:bg-hover hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/40">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-2.5 rounded-full shadow-lg shadow-black/20" style="background: ${p.color}"></div>
            <h3 class="text-[15px] font-bold text-gray-100 cursor-pointer hover:text-cyan transition-colors" onclick="openProjectDashboard('${p.name}')">${p.name}</h3>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(p.status)}">${p.status}</span>
        </div>

        <!-- Description -->
        <p class="text-[13px] text-gray-500 leading-relaxed mb-6 line-clamp-2 min-h-[40px]">${p.desc}</p>

        <!-- Progress Header -->
        <div class="flex items-center justify-between text-[11px] font-medium mb-2">
          <span class="text-gray-600">${doneCount} of ${taskCount} tasks</span>
          <span class="font-mono" style="color: ${p.color}">${pctDone}%</span>
        </div>

        <!-- Progress Bar -->
        <div class="h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700" style="width: ${pctDone}%; background: ${p.color}"></div>
        </div>

        <!-- Meta -->
        <div class="flex items-center justify-between mb-6 pt-4 border-t border-white/[0.03]">
          <div class="flex items-center">
            ${projMembers.length ? `<div class="flex items-center mr-2">${avatars}${extra}</div>` : ''}
          </div>
          <span class="text-[11px] text-gray-600 font-medium">Created ${formatDate(p.id)}</span>
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-3 mt-auto">
          <button onclick="openEditProjectModal(${p.id})" class="py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98]">Edit</button>
          <button onclick="deleteProject(${p.id})" class="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98]">Delete</button>
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
    const projMatch     = currentProject  === "all" || t.project  === currentProject;
    const labelMatch    = currentLabel    === "all" || t.label    === currentLabel;
    const priorityMatch = currentPriority === "all" || t.priority === currentPriority;
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

  if (members.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-20 bg-elevated/50 border border-dashed border-white/10 rounded-2xl">
        <div class="text-gray-600">
          <svg class="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p class="text-[15px] font-semibold text-gray-400 mb-1">No team members yet</p>
          <p class="text-[13px] text-gray-600">Click <span class="text-cyan font-bold cursor-pointer hover:underline" onclick="openNewMemberModal()">Add Member</span> to get started</p>
        </div>
      </div>`;
    return;
  }

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getRoleClass = (role) => {
    const r = role.toLowerCase();
    if (r.includes('lead') || r.includes('pm')) return 'bg-cyan/10 text-cyan';
    if (r.includes('dev')) return 'bg-purple/10 text-purple';
    if (r.includes('design')) return 'bg-amber-500/10 text-amber-500';
    return 'bg-gray-500/10 text-gray-400';
  };

  const statusColors = { 
    online: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]", 
    away: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]", 
    offline: "bg-gray-500" 
  };

  grid.innerHTML = members.map(m => {
    const initials = m.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const memberProjects = projects.filter(p => (p.memberIds || []).includes(m.id));
    
    // Mock task count if not existing (for redesign fidelity)
    const tasksDone = m.tasksDone || Math.floor(Math.random() * 50);

    return `
      <div class="team-card bg-elevated border border-white/[0.04] rounded-2xl p-6 transition-all hover:bg-hover hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/40">
        <!-- Header -->
        <div class="flex items-start gap-4 mb-5">
          <div class="relative flex-shrink-0">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[15px] font-bold text-white shadow-lg shadow-black/20">${initials}</div>
            <div class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-elevated ${statusColors[m.status] || 'bg-gray-500'}"></div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <h3 class="text-[14.5px] font-bold text-gray-100 truncate">${m.name}</h3>
              <div class="flex items-center gap-2">
                <button class="text-gray-600 hover:text-cyan transition-colors" onclick="editMember(${m.id})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="text-gray-600 hover:text-red-400 transition-colors" onclick="deleteMember(${m.id})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            <p class="text-[12.5px] text-gray-500 truncate">${m.email}</p>
          </div>
        </div>

        <!-- Role & Join Date -->
        <div class="flex items-center justify-between mb-6">
          <span class="px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${getRoleClass(m.role)}">${m.role}</span>
          <span class="text-[11.5px] text-gray-600 font-medium">Joined ${formatDate(m.id)}</span>
        </div>

        <!-- Projects -->
        <div class="mb-6">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2.5">Projects</p>
          <div class="flex flex-wrap gap-2">
            ${memberProjects.length ? memberProjects.map(p => `
              <span class="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[11px] text-gray-400 font-medium">${p.name}</span>
            `).join('') : '<span class="text-[11px] text-gray-600 italic">No projects</span>'}
          </div>
        </div>

        <!-- Footer Stats & Status -->
        <div class="flex items-center justify-between pt-4 border-t border-white/[0.03]">
          <div class="flex items-center gap-1.5 text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-cyan"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span class="text-[12px] font-medium font-mono">${tasksDone} tasks completed</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full ${statusColors[m.status] || 'bg-gray-500'}"></div>
            <span class="text-[12px] font-bold capitalize text-gray-400">${m.status}</span>
          </div>
        </div>
      </div>`;
  }).join("");
}

function deleteMember(id) {
  const m = members.find(x => x.id === id);
  if (!m) return;
  if (!confirm(`Remove ${m.name} from the team?`)) return;

  const idx = members.findIndex(x => x.id === id);
  if (idx !== -1) members.splice(idx, 1);
  
  // Also remove from project member lists
  projects.forEach(p => {
    if (p.memberIds) p.memberIds = p.memberIds.filter(mid => mid !== id);
  });

  renderTeamGrid();
  renderProjectsGrid(); // sync project cards (avatars)
}

function editMember(id) {
  alert("Edit functionality coming soon!");
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

      if (activePageId !== "pageDashboard") {
        navigateToPage("pageDashboard");
      }
      renderTasks();
    });
  });
}

function initSidebarPriority() {
  document.querySelectorAll(".sidebar-priority").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-priority").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentPriority = btn.dataset.priority;

      if (activePageId !== "pageDashboard") {
        navigateToPage("pageDashboard");
      }
      renderTasks();
    });
  });
}

function initRailButtons() {
  const railBtns = document.querySelectorAll(".rail-btn");
  const pageMap  = { 0: "pageDashboard", 1: "pageProjects", 2: "pageTeam", 3: "pageNotes", 4: "pageInbox" };

  railBtns.forEach((btn, i) => {
    if (i >= 6 || !pageMap[i]) return; // skip non-page buttons (Settings=5)
    btn.addEventListener("click", () => {
      navigateToPage(pageMap[i]);

      // When switching to projects page, render the grid
      if (pageMap[i] === "pageProjects") renderProjectsGrid();
      if (pageMap[i] === "pageTeam")     renderTeamGrid();
      if (pageMap[i] === "pageInbox")    { renderInbox(); renderSidebarChatList(); }
      if (pageMap[i] === "pageNotes")    renderNotes();

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
//  INBOX
// ═══════════════════════════════════════════════════════════════
let inboxItems = [
  {
    id: 1,
    type: "task",
    icon: "task",
    title: "New task assigned to you",
    body: '"Fix authentication timeout bug" was assigned to you by Sarah Chen',
    project: "Core v2.1",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    type: "mention",
    icon: "mention",
    title: "You were mentioned",
    body: "Alex Rivera mentioned you in a comment on \"Implement dark mode toggle\"",
    project: "UI Kit",
    time: "15 min ago",
    read: false,
  },
  {
    id: 3,
    type: "project",
    icon: "project",
    title: "Project milestone reached",
    body: '"Core v2.1" has reached 75% completion — 3 tasks remaining',
    project: "Core v2.1",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 4,
    type: "task",
    icon: "task",
    title: "Task completed",
    body: 'Jamie Lee marked "Set up CI/CD pipeline" as done',
    project: "DevOps",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 5,
    type: "system",
    icon: "system",
    title: "Weekly summary ready",
    body: "Your team completed 14 tasks this week — up 23% from last week",
    project: null,
    time: "3 hours ago",
    read: true,
  },
  {
    id: 6,
    type: "mention",
    icon: "mention",
    title: "Comment reply",
    body: 'Sarah Chen replied to your comment on "API rate limiting"',
    project: "Core v2.1",
    time: "5 hours ago",
    read: true,
  },
  {
    id: 7,
    type: "project",
    icon: "project",
    title: "New project created",
    body: '"Mobile App v1" was created by Alex Rivera — you were added as a member',
    project: "Mobile App v1",
    time: "Yesterday",
    read: true,
  },
  {
    id: 8,
    type: "task",
    icon: "task",
    title: "Task deadline approaching",
    body: '"Database migration script" is due tomorrow',
    project: "Core v2.1",
    time: "Yesterday",
    read: true,
  },
  {
    id: 9,
    type: "system",
    icon: "system",
    title: "System maintenance",
    body: "Scheduled maintenance on May 1st from 2:00 AM to 4:00 AM UTC",
    project: null,
    time: "2 days ago",
    read: true,
  },
  {
    id: 10,
    type: "mention",
    icon: "mention",
    title: "You were tagged in a task",
    body: 'Jamie Lee tagged you in "Write unit tests for auth module"',
    project: "Core v2.1",
    time: "3 days ago",
    read: true,
  },
  {
    id: 11,
    type: "task",
    icon: "task",
    title: "Priority changed",
    body: '"Optimize image loading" was changed from Low to Urgent by Sarah Chen',
    project: "UI Kit",
    time: "3 days ago",
    read: true,
  },
  {
    id: 12,
    type: "project",
    icon: "project",
    title: "Sprint review scheduled",
    body: 'Sprint review for "Core v2.1" is scheduled for Friday at 3 PM',
    project: "Core v2.1",
    time: "4 days ago",
    read: true,
  },
];

let inboxFilter = "all";

function getInboxIcon(type) {
  const icons = {
    task:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    mention: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>`,
    project: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    system:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };
  return icons[type] || icons.system;
}

function getInboxIconColor(type) {
  const colors = {
    task:    "inbox-icon-task",
    mention: "inbox-icon-mention",
    project: "inbox-icon-project",
    system:  "inbox-icon-system",
  };
  return colors[type] || colors.system;
}

function renderInbox() {
  const list  = document.getElementById("inboxList");
  const count = document.getElementById("inboxCount");
  if (!list) return;

  const filtered = inboxFilter === "all"
    ? inboxItems
    : inboxFilter === "unread"
      ? inboxItems.filter(n => !n.read)
      : inboxItems.filter(n => n.type === inboxFilter);

  if (count) count.textContent = `(${filtered.length})`;

  // Update sidebar badge
  const unreadCount = inboxItems.filter(n => !n.read).length;
  const badge = document.getElementById("inboxBadge");
  if (badge) badge.textContent = unreadCount;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="inbox-empty">
        <div class="inbox-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
        </div>
        <p class="text-[14px] text-gray-500 font-medium mt-4">All caught up!</p>
        <p class="text-[12.5px] text-gray-600 mt-1">No ${inboxFilter === 'all' ? '' : inboxFilter + ' '}notifications to show</p>
      </div>`;
    return;
  }

  // Group by time sections
  const today = [];
  const earlier = [];
  filtered.forEach(item => {
    if (item.time.includes('min') || item.time.includes('hour')) {
      today.push(item);
    } else {
      earlier.push(item);
    }
  });

  let html = '';

  if (today.length > 0) {
    html += `<div class="inbox-section-label">Today</div>`;
    html += today.map(item => renderInboxItem(item)).join('');
  }

  if (earlier.length > 0) {
    html += `<div class="inbox-section-label" style="margin-top: 8px;">Earlier</div>`;
    html += earlier.map(item => renderInboxItem(item)).join('');
  }

  list.innerHTML = html;
}

function renderInboxItem(item) {
  return `
    <div class="inbox-item ${item.read ? '' : 'inbox-item-unread'}" onclick="toggleInboxRead(${item.id})">
      <div class="inbox-item-icon ${getInboxIconColor(item.type)}">
        ${getInboxIcon(item.type)}
      </div>
      <div class="inbox-item-content">
        <div class="inbox-item-header">
          <span class="inbox-item-title">${item.title}</span>
          <span class="inbox-item-time">${item.time}</span>
        </div>
        <p class="inbox-item-body">${item.body}</p>
        ${item.project ? `<span class="inbox-item-project">${item.project}</span>` : ''}
      </div>
      ${!item.read ? '<div class="inbox-unread-dot"></div>' : ''}
      <button class="inbox-item-dismiss icon-btn" onclick="event.stopPropagation(); dismissInboxItem(${item.id})" title="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
}

function filterInbox(filter) {
  inboxFilter = filter;
  document.querySelectorAll('.inbox-tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`.inbox-tab[data-filter="${filter}"]`);
  if (btn) btn.classList.add('active');
  renderInbox();
}

function toggleInboxRead(id) {
  const item = inboxItems.find(n => n.id === id);
  if (item) {
    item.read = !item.read;
    renderInbox();
  }
}

function markAllInboxRead() {
  inboxItems.forEach(n => n.read = true);
  renderInbox();
}

function dismissInboxItem(id) {
  inboxItems = inboxItems.filter(n => n.id !== id);
  renderInbox();
}

function clearAllInbox() {
  if (!confirm('Clear all notifications?')) return;
  inboxItems = [];
  renderInbox();
}

function initInboxSidebar() {
  const inboxBtn = document.querySelector('.sidebar-inbox');
  if (inboxBtn) {
    inboxBtn.addEventListener('click', () => {
      navigateToPage('pageInbox');
      renderInbox();
      renderSidebarChatList();
    });
  }
}

// ═══════════════════════════════════════════════════════════════
//  CHAT SYSTEM
// ═══════════════════════════════════════════════════════════════
function getContactGradient(id) {
  const gradients = {
    sarah:  "from-pink-500 to-purple-600",
    alex:   "from-blue-400 to-cyan-500",
    jamie:  "from-orange-400 to-red-500",
    morgan: "from-green-400 to-emerald-600",
    taylor: "from-violet-400 to-indigo-600",
  };
  return gradients[id] || "from-purple to-cyan";
}

function getStatusColor(status) {
  return status === 'online' ? 'bg-green-500' :
         status === 'away'   ? 'bg-yellow-500' : 'bg-gray-500';
}

function getLastMessage(contactId) {
  const msgs = chatConversations[contactId];
  if (!msgs || msgs.length === 0) return { text: "No messages yet", time: "" };
  const last = msgs[msgs.length - 1];
  const prefix = last.from === "me" ? "You: " : "";
  return { text: prefix + last.text, time: last.time };
}

function getUnreadChatCount(contactId) {
  // Simulate unread: contacts with recent messages where last msg is not from "me"
  const msgs = chatConversations[contactId];
  if (!msgs || msgs.length === 0) return 0;
  const last = msgs[msgs.length - 1];
  if (last.from === "me") return 0;
  if (last.date === "Today") return contactId === activeChatContactId ? 0 : Math.floor(Math.random() * 3) + 1;
  return 0;
}

// Memoize unread counts so they don't change on re-render
const _unreadCache = {};
function getCachedUnreadCount(contactId) {
  if (!(contactId in _unreadCache)) {
    const msgs = chatConversations[contactId];
    if (!msgs || msgs.length === 0) { _unreadCache[contactId] = 0; return 0; }
    const last = msgs[msgs.length - 1];
    if (last.from === "me" || last.date !== "Today") { _unreadCache[contactId] = 0; return 0; }
    _unreadCache[contactId] = contactId === 'sarah' ? 2 : contactId === 'morgan' ? 3 : 0;
  }
  if (contactId === activeChatContactId) _unreadCache[contactId] = 0;
  return _unreadCache[contactId];
}



function openChat(contactId) {
  activeChatContactId = contactId;
  _unreadCache[contactId] = 0;

  // Switch views
  const notifView = document.getElementById('inboxNotificationsView');
  const chatView  = document.getElementById('inboxChatView');
  if (notifView) notifView.classList.add('hidden');
  if (chatView)  chatView.classList.remove('hidden');

  // Update header
  const contact = chatContacts.find(c => c.id === contactId);
  if (!contact) return;

  const headerAvatar = document.getElementById('chatHeaderAvatar');
  const headerName   = document.getElementById('chatHeaderName');
  const headerStatus = document.getElementById('chatHeaderStatus');

  if (headerAvatar) {
    headerAvatar.className = `chat-header-avatar bg-gradient-to-br ${getContactGradient(contactId)}`;
    headerAvatar.textContent = contact.avatar;
  }
  if (headerName) headerName.textContent = contact.name;
  if (headerStatus) {
    headerStatus.textContent = contact.status.charAt(0).toUpperCase() + contact.status.slice(1);
    headerStatus.className = `chat-header-status chat-status-${contact.status}`;
  }

  renderChatMessages();
  renderSidebarChatList();

  // Focus input
  setTimeout(() => {
    const input = document.getElementById('chatInput');
    if (input) input.focus();
  }, 100);
}

function closeChatView() {
  activeChatContactId = null;
  const notifView = document.getElementById('inboxNotificationsView');
  const chatView  = document.getElementById('inboxChatView');
  if (notifView) notifView.classList.remove('hidden');
  if (chatView)  chatView.classList.add('hidden');
  renderSidebarChatList();
}

function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container || !activeChatContactId) return;

  const msgs = chatConversations[activeChatContactId] || [];
  const contact = chatContacts.find(c => c.id === activeChatContactId);

  if (msgs.length === 0) {
    container.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <p class="text-[14px] text-gray-500 font-medium mt-3">Start a conversation</p>
        <p class="text-[12.5px] text-gray-600 mt-1">Send a message to ${contact ? contact.name : 'this person'}</p>
      </div>`;
    return;
  }

  // Group messages by date
  let currentDate = '';
  let html = '';

  msgs.forEach((msg, i) => {
    if (msg.date !== currentDate) {
      currentDate = msg.date;
      html += `<div class="chat-date-divider"><span>${msg.date}</span></div>`;
    }

    const isMe = msg.from === 'me';
    const showAvatar = !isMe && (i === 0 || msgs[i-1].from !== msg.from || msgs[i-1].date !== msg.date);

    html += `
      <div class="chat-msg ${isMe ? 'chat-msg-me' : 'chat-msg-them'}">
        ${!isMe ? `
          <div class="chat-msg-avatar-col">
            ${showAvatar ? `<div class="chat-msg-avatar bg-gradient-to-br ${getContactGradient(activeChatContactId)}">${contact.avatar}</div>` : '<div class="chat-msg-avatar-spacer"></div>'}
          </div>
        ` : ''}
        <div class="chat-msg-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}">
          <p class="chat-msg-text">${msg.text}</p>
          <span class="chat-msg-time">${msg.time}</span>
        </div>
      </div>`;
  });

  container.innerHTML = html;

  // Scroll to bottom
  const scrollContainer = document.getElementById('chatMessagesContainer');
  if (scrollContainer) {
    requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    });
  }
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input || !activeChatContactId) return;

  const text = input.value.trim();
  if (!text) return;

  // Add message
  if (!chatConversations[activeChatContactId]) {
    chatConversations[activeChatContactId] = [];
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  chatConversations[activeChatContactId].push({
    from: 'me',
    text: text,
    time: timeStr,
    date: 'Today'
  });

  input.value = '';
  renderChatMessages();

  // Simulate reply after a short delay
  simulateReply(activeChatContactId);
}

function simulateReply(contactId) {
  const contact = chatContacts.find(c => c.id === contactId);
  if (!contact || contact.status === 'offline') return;

  const replies = [
    "Got it, thanks! 👍",
    "Sounds good, I'll take a look.",
    "Perfect, let's sync up on this later.",
    "Makes sense. I'll update the ticket.",
    "Great idea! Let me think about it.",
    "On it! Will update you shortly.",
    "Thanks for the heads up! 🙌",
    "Agreed. Let's discuss in standup.",
    "Nice catch! I'll fix that right away.",
    "Sure thing, I'll handle it.",
  ];

  const delay = 1500 + Math.random() * 2500;

  setTimeout(() => {
    if (!chatConversations[contactId]) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    chatConversations[contactId].push({
      from: contactId,
      text: replies[Math.floor(Math.random() * replies.length)],
      time: timeStr,
      date: 'Today'
    });

    // Only re-render if still viewing this chat
    if (activeChatContactId === contactId) {
      renderChatMessages();
    }
    renderSidebarChatList();
  }, delay);
}

function startNewChat() {
  // Switch to contact search in the sidebar
  const searchInput = document.getElementById('sidebarChatSearch');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
  sidebarChatSearch = '';
  renderSidebarChatList();
}

// ═══════════════════════════════════════════════════════════════
//  SIDEBAR CHAT LIST (teammate panel in sidebar)
// ═══════════════════════════════════════════════════════════════
let sidebarChatSearch = "";

function renderSidebarChatList() {
  const list = document.getElementById('sidebarChatList');
  if (!list) return;

  let contacts = chatContacts;
  if (sidebarChatSearch) {
    const q = sidebarChatSearch.toLowerCase();
    contacts = contacts.filter(c => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q));
  }

  if (contacts.length === 0) {
    list.innerHTML = `
      <div class="px-2 py-6 text-center">
        <p class="text-[11.5px] text-gray-600">No teammates found</p>
      </div>`;
    return;
  }

  list.innerHTML = contacts.map(c => {
    const lastMsg = getLastMessage(c.id);
    const unread = getCachedUnreadCount(c.id);
    const isActive = c.id === activeChatContactId;

    return `
      <button class="sidebar-chat-contact ${isActive ? 'sidebar-chat-active' : ''}" onclick="openChat('${c.id}')">
        <div class="sidebar-chat-avatar-wrap">
          <div class="sidebar-chat-avatar bg-gradient-to-br ${getContactGradient(c.id)}">${c.avatar}</div>
          <div class="sidebar-chat-status-dot ${getStatusColor(c.status)}"></div>
        </div>
        <div class="sidebar-chat-info">
          <div class="sidebar-chat-name-row">
            <span class="sidebar-chat-name">${c.name}</span>
            ${unread > 0 ? `<span class="sidebar-chat-unread">${unread}</span>` : ''}
          </div>
          <span class="sidebar-chat-preview">${lastMsg.text}</span>
        </div>
      </button>`;
  }).join('');
}

function filterSidebarChats(query) {
  sidebarChatSearch = query;
  renderSidebarChatList();
}

// ═══════════════════════════════════════════════════════════════
//  NOTES SYSTEM
// ═══════════════════════════════════════════════════════════════
let notes = [
  {
    id: 1,
    title: "Project Architecture v2",
    content: "// Use a modular approach with Web Components\n// Integration with Firebase for auth\n// Tailwind for rapid UI development\n\n- Sidebar handles navigation\n- Main content area swaps components",
    date: "2 hours ago",
    color: "#00d4c8",
    pinned: true,
    scope: "team",
    tags: ["architecture", "v2"]
  },
  {
    id: 2,
    title: "API Endpoint Ideas",
    content: "GET /api/tasks - Fetch all tasks\nPOST /api/tasks - Create new task\nPATCH /api/tasks/:id - Update task\n\nNeed to implement rate limiting on all POST/PATCH endpoints.",
    date: "Yesterday",
    color: "#8b5cf6",
    pinned: false,
    scope: "personal",
    tags: ["api", "backend"]
  },
  {
    id: 3,
    title: "UI/UX Feedback",
    content: "The dark mode looks great but we need more contrast on the input borders. The cyan accent is perfect. Suggest adding glassmorphism to the modals.",
    date: "2 days ago",
    color: "#ef4444",
    pinned: false,
    scope: "team",
    tags: ["design", "feedback"]
  }
];

let currentNoteId = null;
let notesFilter = "all";
let notesSearchQuery = "";

function renderNotes() {
  const sidebarList = document.getElementById("notesSidebarList");
  if (!sidebarList) return;

  let filtered = notes;
  
  // Apply scope filter
  if (notesFilter !== "all") {
    filtered = filtered.filter(n => n.scope === notesFilter);
  }
  
  // Apply search
  if (notesSearchQuery) {
    const q = notesSearchQuery.toLowerCase();
    filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  // Sort: Pinned first, then by date (simulated)
  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.id - a.id;
  });

  if (filtered.length === 0) {
    sidebarList.innerHTML = `
      <div class="flex flex-col items-center justify-center py-10 text-center px-4">
        <p class="text-[12px] text-gray-600 font-medium italic">No notes found</p>
      </div>`;
    return;
  }

  sidebarList.innerHTML = filtered.map(n => `
    <div class="note-card group p-4 rounded-2xl mb-2 cursor-pointer transition-all border border-transparent ${n.id === currentNoteId ? 'bg-overlay border-white/5 ring-1 ring-white/5' : 'hover:bg-white/[0.02]'}" onclick="selectNote(${n.id})">
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full shadow-sm" style="background: ${n.color}"></div>
          <h3 class="text-[13.5px] font-bold truncate max-w-[160px] ${n.id === currentNoteId ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'} transition-colors">${n.title || 'Untitled Note'}</h3>
        </div>
        <div class="flex items-center gap-1.5">
          ${n.pinned ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="text-cyan"><path d="M21 10c-3 0-4-1-4-4s-1-4-4-4-4 1-4 4-1 4-4 4c0 3 1 4 4 4s4 1 4 4 1 4 4 4"/></svg>' : ''}
          ${n.scope === 'team' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-purple"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' : ''}
        </div>
      </div>
      <p class="text-[11.5px] text-gray-600 line-clamp-2 leading-relaxed mb-2">${n.content || 'No content yet...'}</p>
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-gray-700 uppercase tracking-wider">${n.date}</span>
        <div class="flex gap-1">
          ${(n.tags || []).slice(0, 2).map(t => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-600 font-bold uppercase">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function selectNote(id) {
  currentNoteId = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;

  // UI elements
  const emptyState = document.getElementById("noteEditorEmpty");
  const header = document.getElementById("noteEditorHeader");
  const body = document.getElementById("noteEditorBody");
  
  if (emptyState) emptyState.classList.add("hidden");
  if (header) header.classList.remove("hidden");
  if (body) body.classList.remove("hidden");

  // Populate editor
  document.getElementById("noteTitleInput").value = note.title;
  document.getElementById("noteContentInput").value = note.content;
  document.getElementById("noteEditorDate").textContent = `Last edited: ${note.date}`;
  
  const scopeEl = document.getElementById("noteEditorScope");
  scopeEl.textContent = note.scope === 'team' ? 'Team' : 'Personal';
  scopeEl.className = `px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${note.scope === 'team' ? 'bg-purple/10 border-purple/20 text-purple' : 'bg-white/5 border-white/10 text-gray-500'}`;

  const pinBtn = document.getElementById("notePinBtn");
  pinBtn.className = `w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${note.pinned ? 'bg-cyan/10 border-cyan/20 text-cyan' : 'bg-overlay border-white/5 text-gray-500 hover:text-cyan'}`;

  const shareBtn = document.getElementById("noteShareBtn");
  shareBtn.className = `w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${note.scope === 'team' ? 'bg-purple/10 border-purple/20 text-purple' : 'bg-overlay border-white/5 text-gray-500 hover:text-purple'}`;

  renderColorPicker(note.color);
  renderNoteTags(note.tags);
  renderNotes(); // Refresh sidebar to show active state
}

function renderColorPicker(activeColor) {
  const container = document.getElementById("noteColorPicker");
  if (!container) return;
  const colors = ["#00d4c8", "#8b5cf6", "#ef4444", "#f59e0b", "#10b981", "#3b82f6"];
  container.innerHTML = colors.map(c => `
    <div class="w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-125 ${c === activeColor ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-base scale-110' : ''}" style="background: ${c}" onclick="setNoteColor('${c}')"></div>
  `).join('');
}

function renderNoteTags(tags) {
  const container = document.getElementById("noteTags");
  if (!container) return;
  container.innerHTML = (tags || []).map(t => `
    <span class="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-1.5">
      ${t}
      <button onclick="removeNoteTag('${t}')" class="hover:text-red-400">×</button>
    </span>
  `).join('') + `
    <button class="w-5 h-5 flex items-center justify-center rounded bg-white/5 border border-white/5 text-gray-600 hover:text-cyan transition-colors" onclick="addNoteTag()">+</button>
  `;
}

function addNote() {
  const newNote = {
    id: Date.now(),
    title: "",
    content: "",
    date: "Just now",
    color: "#00d4c8",
    pinned: false,
    scope: "personal",
    tags: []
  };
  notes.unshift(newNote);
  selectNote(newNote.id);
  setTimeout(() => document.getElementById("noteTitleInput").focus(), 100);
}

function saveNote() {
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;

  note.title = document.getElementById("noteTitleInput").value;
  note.content = document.getElementById("noteContentInput").value;
  note.date = "Just now";
  
  document.getElementById("noteEditorDate").textContent = `Last edited: Just now`;
  renderNotes(); // Update sidebar preview
}

function toggleNotePin() {
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;
  note.pinned = !note.pinned;
  selectNote(note.id);
}

function toggleNoteScope() {
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;
  note.scope = note.scope === 'team' ? 'personal' : 'team';
  selectNote(note.id);
}

function setNoteColor(color) {
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;
  note.color = color;
  selectNote(note.id);
}

function deleteCurrentNote() {
  if (!confirm("Are you sure you want to delete this note?")) return;
  notes = notes.filter(n => n.id !== currentNoteId);
  currentNoteId = null;
  
  // UI reset
  document.getElementById("noteEditorEmpty").classList.remove("hidden");
  document.getElementById("noteEditorHeader").classList.add("hidden");
  document.getElementById("noteEditorBody").classList.add("hidden");
  
  renderNotes();
}

function setNotesFilter(filter) {
  notesFilter = filter;
  document.querySelectorAll(".note-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
    btn.classList.toggle("text-gray-500", btn.dataset.filter !== filter);
    btn.classList.toggle("hover:text-gray-300", btn.dataset.filter !== filter);
  });
  renderNotes();
}

function filterNotes(query) {
  notesSearchQuery = query;
  renderNotes();
}

function addNoteTag() {
  const tag = prompt("Enter new tag:");
  if (tag) {
    const note = notes.find(n => n.id === currentNoteId);
    if (note && !note.tags.includes(tag.toLowerCase())) {
      note.tags.push(tag.toLowerCase());
      renderNoteTags(note.tags);
      renderNotes();
    }
  }
}

function removeNoteTag(tag) {
  const note = notes.find(n => n.id === currentNoteId);
  if (note) {
    note.tags = note.tags.filter(t => t !== tag);
    renderNoteTags(note.tags);
    renderNotes();
  }
}

// ═══════════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  // Small delay to let Web Components render their innerHTML
  setTimeout(() => {
    renderSidebarProjects();
    initSidebarLabels();
    initSidebarPriority();
    initRailButtons();
    initInboxSidebar();
    renderTasks();
    renderProjectsGrid();
    renderTeamGrid();
    renderNotes();

    // Set initial inbox badge
    const unreadCount = inboxItems.filter(n => !n.read).length;
    const badge = document.getElementById("inboxBadge");
    if (badge) badge.textContent = unreadCount;
  }, 50);
});
