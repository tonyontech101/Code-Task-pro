// ─────────────────────────────────────────────────────────────
// app.js  —  Main application logic for CodeTask Pro
// ─────────────────────────────────────────────────────────────

// ── Task Data ────────────────────────────────────────────────
const tasks = [
  { id: 1, title: "Refactor auth middleware", priority: "urgent", label: "backend", deadline: "26 Apr", project: "Auth v1", done: false, desc: "Rewrite the JWT validation layer to support refresh tokens.", notes: "Coordinate with security team.", code: "app.use(authMiddleware());", tags: ["security", "api"], activity: [{ text: "Created by Alex", time: "2h ago" }, { text: "Assigned to Sarah", time: "1h ago" }] },
  { id: 2, title: "Build dashboard widgets", priority: "high", label: "wip", deadline: "28 Apr", project: "Core v2.1", done: false, desc: "Create reusable chart components for the analytics dashboard.", notes: "Use lightweight charting library.", code: "const chart = new Chart(ctx);", tags: ["ui", "charts"], activity: [{ text: "Created by Sarah", time: "5h ago" }] },
  { id: 3, title: "API rate limiting", priority: "urgent", label: "backend", deadline: "25 Apr", project: "API v1.3", done: false, desc: "Implement per-user rate limits on all public endpoints.", notes: "Redis-backed token bucket.", code: "rateLimit({ max: 100 })", tags: ["api", "security"], activity: [{ text: "Created by Alex", time: "1d ago" }] },
  { id: 4, title: "Fix responsive nav", priority: "low", label: "wip", deadline: "30 Apr", project: "Core v2.1", done: true, desc: "Navigation breaks on screens below 768px.", notes: "", code: "", tags: ["ui", "mobile"], activity: [{ text: "Completed by Mike", time: "3h ago" }] },
  { id: 5, title: "Database migration v3", priority: "high", label: "backend", deadline: "27 Apr", project: "Core v2.1", done: false, desc: "Migrate user table to support multi-tenant architecture.", notes: "Backup before running.", code: "ALTER TABLE users ADD tenant_id;", tags: ["database", "migration"], activity: [{ text: "Created by Alex", time: "2d ago" }] },
  { id: 6, title: "Setup CI/CD pipeline", priority: "high", label: "backend", deadline: "29 Apr", project: "Core v2.1", done: false, desc: "Configure GitHub Actions for automated testing and deployment.", notes: "", code: "jobs:\n  build:\n    runs-on: ubuntu-latest", tags: ["devops", "ci"], activity: [{ text: "Created by Sarah", time: "12h ago" }] },
  { id: 7, title: "Update API docs", priority: "low", label: "wip", deadline: "2 May", project: "API v1.3", done: false, desc: "Refresh Swagger/OpenAPI documentation for v1.3 endpoints.", notes: "", code: "", tags: ["docs", "api"], activity: [{ text: "Created by Mike", time: "6h ago" }] },
  { id: 8, title: "OAuth2 Google integration", priority: "urgent", label: "backend", deadline: "26 Apr", project: "Auth v1", done: false, desc: "Add Google OAuth2 social login flow.", notes: "Use Firebase Auth provider.", code: "signInWithPopup(auth, provider)", tags: ["auth", "oauth"], activity: [{ text: "Created by Alex", time: "4h ago" }] },
  { id: 9, title: "Performance audit", priority: "low", label: "wip", deadline: "5 May", project: "Core v2.1", done: false, desc: "Run Lighthouse audit and fix critical performance issues.", notes: "Target score > 90.", code: "", tags: ["perf", "audit"], activity: [{ text: "Created by Sarah", time: "1d ago" }] }
];

let selectedTaskId = null;
let currentProject = "all";
let currentLabel   = "all";

// ── Render Tasks ─────────────────────────────────────────────
function renderTasks() {
  const tbody = document.getElementById("taskBody");
  if (!tbody) return;

  const filtered = tasks.filter(t => {
    const projMatch  = currentProject === "all" || t.project === currentProject;
    const labelMatch = currentLabel === "all"   || t.label === currentLabel;
    return projMatch && labelMatch;
  });

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

  // Update count
  const title = document.getElementById("taskAreaTitle");
  if (title) {
    title.innerHTML = `Active Tasks <span class="text-[14px] font-medium text-gray-600">(${filtered.length})</span>`;
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

// ── Task Actions ─────────────────────────────────────────────
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

// ── Detail Panel ─────────────────────────────────────────────
function showDetailPanel(id) {
  const panel = document.getElementById("detailPanel");
  const t = tasks.find(x => x.id === id);
  if (!panel || !t) return;

  panel.classList.remove("hidden");
  document.getElementById("detailTitle").textContent = t.title;
  document.getElementById("detailDesc").textContent  = t.desc || "No description.";
  document.getElementById("detailNotes").textContent  = t.notes || "—";
  document.getElementById("detailCode").textContent   = t.code || "// no code snippet";

  const tagsEl = document.getElementById("detailTags");
  tagsEl.innerHTML = (t.tags || []).map(tag =>
    `<span class="badge badge-wip">${tag}</span>`
  ).join("");

  const actEl = document.getElementById("detailActivity");
  actEl.innerHTML = (t.activity || []).map(a => `
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
  // Placeholder — focus on title for now
  if (selectedTaskId) alert("Edit functionality coming soon!");
}

// ── New Task Modal ───────────────────────────────────────────
function openNewTaskModal() {
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

  if (!title) return alert("Please enter a task title.");

  tasks.unshift({
    id: Date.now(),
    title,
    priority,
    label,
    deadline: deadline || "—",
    project: currentProject === "all" ? "Core v2.1" : currentProject,
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

// ── New Project Modal ────────────────────────────────────────
function openNewProjectModal() {
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

  if (!name) return alert("Please enter a project name.");

  // Add to sidebar
  const list = document.getElementById("sidebarProjects");
  if (list) {
    const li = document.createElement("li");
    li.innerHTML = `<button class="sidebar-item sidebar-project w-full" data-project="${name}"><span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${color}"></span>${name}</button>`;
    list.appendChild(li);
    bindSidebarProject(li.querySelector("button"));
  }

  // Add to projects grid
  const grid = document.getElementById("projectsGrid");
  if (grid) {
    grid.innerHTML += `
      <div class="project-card bg-elevated border border-white/[0.06] rounded-xl p-4 cursor-pointer" style="border-top: 3px solid ${color}">
        <h3 class="text-[14px] font-bold mb-1">${name}</h3>
        <p class="text-[12px] text-gray-500 mb-3">${desc || "No description"}</p>
        <span class="badge badge-wip">${status}</span>
      </div>`;
  }

  // Clear & close
  document.getElementById("newProjectName").value = "";
  document.getElementById("newProjectDesc").value = "";
  closeNewProjectModal();
}

// ── Add Member Modal ─────────────────────────────────────────
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

  const statusColors = { online: "bg-green-500", away: "bg-yellow-500", offline: "bg-gray-500" };
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const grid = document.getElementById("teamGrid");
  if (grid) {
    grid.innerHTML += `
      <div class="team-card bg-elevated border border-white/[0.06] rounded-xl p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[12px] font-bold text-white">${initials}</div>
          <div>
            <h3 class="text-[13.5px] font-semibold">${name}</h3>
            <p class="text-[11.5px] text-gray-500">${email}</p>
          </div>
          <div class="ml-auto w-2.5 h-2.5 rounded-full ${statusColors[status] || 'bg-gray-500'}"></div>
        </div>
        <span class="badge badge-wip">${role}</span>
      </div>`;
  }

  // Clear & close
  document.getElementById("newMemberName").value  = "";
  document.getElementById("newMemberEmail").value = "";
  closeNewMemberModal();
}

// ── Sidebar Navigation ───────────────────────────────────────
function bindSidebarProject(btn) {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sidebar-project").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentProject = btn.dataset.project;
    renderTasks();
  });
}

function initSidebar() {
  // Project filter
  document.querySelectorAll(".sidebar-project").forEach(bindSidebarProject);

  // Label / Priority filter
  document.querySelectorAll(".sidebar-label").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-label").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentLabel = btn.dataset.label;
      renderTasks();
    });
  });

  // Rail buttons (page switching)
  const railBtns   = document.querySelectorAll(".rail-btn");
  const pages      = { 0: "pageDashboard", 1: "pageProjects", 2: "pageTeam" };

  railBtns.forEach((btn, i) => {
    if (i >= 3 || !pages[i]) return; // only first 3 are page switches
    btn.addEventListener("click", () => {
      railBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      Object.values(pages).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
      });
      const target = document.getElementById(pages[i]);
      if (target) target.classList.remove("hidden");
    });
  });
}

// ── Initialise ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Small delay to let Web Components render
  setTimeout(() => {
    initSidebar();
    renderTasks();
  }, 50);
});
