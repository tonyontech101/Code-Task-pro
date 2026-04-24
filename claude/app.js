// ── Task Data ──────────────────────────────────────────────────────────────
const tasks = [
  {
    id: 1,
    checked: true,
    priority: 'urgent',
    title: 'Refactor Authentication Module',
    meta: 'Sprint 3 | Enhance API key handling',
    project: 'Auth v1',
    deadline: '2d left',
    overdue: true,
    label: 'backend',
    description: 'Refactor authentication module · Sprint 3 | Enhance API key handling',
    tags: ['urgent', 'wip', 'backend'],
    notes: 'Refactor authentication',
    code: `const togTox = {\n  codeda: ouss..log('t');\n};`,
    activity: [
      { user: 'Alex R.', time: '3 hours ago' },
      { user: 'Alex R.', time: '2 hours ago' },
      { user: 'Alex R.', time: '1 week ago' },
    ],
  },
  {
    id: 2,
    checked: false,
    priority: 'high',
    title: 'Update to OAuth 2.0',
    meta: 'Sprint 3 | Enhance API key handling',
    project: 'Auth v1',
    deadline: '14 Dec',
    overdue: false,
    label: 'wip',
    description: 'Migrate existing auth flow to OAuth 2.0 standard.',
    tags: ['high', 'wip'],
    notes: 'Review OAuth 2.0 spec before starting.',
    code: `// OAuth flow init\nconst client = new OAuthClient(config);`,
    activity: [{ user: 'Alex R.', time: '5 hours ago' }],
  },
  {
    id: 3,
    checked: true,
    priority: 'urgent',
    title: 'Implement JWT validation',
    meta: 'Sprint 3 | Enhance API key handling',
    project: 'Auth v1',
    deadline: '2d left',
    overdue: true,
    label: 'backend',
    description: 'Add JWT token validation middleware to all protected routes.',
    tags: ['urgent', 'backend'],
    notes: 'Use jsonwebtoken library.',
    code: `jwt.verify(token, secret, (err, decoded) => {\n  if (err) return res.sendStatus(403);\n});`,
    activity: [{ user: 'Alex R.', time: '1 day ago' }],
  },
  {
    id: 4,
    checked: false,
    priority: 'high',
    title: 'Debug DB query performance (High)',
    meta: 'Sprint 3 | Enhance API key handling',
    project: 'Core v2.1',
    deadline: '14 Dec',
    overdue: false,
    label: 'wip',
    description: 'Investigate and fix slow DB queries in the dashboard endpoint.',
    tags: ['high', 'wip'],
    notes: 'Run EXPLAIN ANALYZE on slow queries.',
    code: `EXPLAIN ANALYZE\nSELECT * FROM tasks WHERE project_id = $1;`,
    activity: [{ user: 'Alex R.', time: '3 days ago' }],
  },
  {
    id: 5,
    checked: false,
    priority: 'low',
    title: 'Optimize build script (Low)',
    meta: 'Sprint 3 | Enhance API key handling',
    project: 'Core v2.1',
    deadline: '14 Dec',
    overdue: false,
    label: 'wip',
    description: 'Reduce CI build time by parallelizing steps.',
    tags: ['low', 'wip'],
    notes: 'Check GitHub Actions matrix strategy.',
    code: `// Parallel build\nnpm run build:parallel`,
    activity: [{ user: 'Alex R.', time: '1 week ago' }],
  },
  {
    id: 6,
    checked: true,
    priority: 'urgent',
    title: 'API Endpoint documentation',
    meta: 'Sprint 3 | Enhance API key handling',
    project: 'API v1.3',
    deadline: '14 Dec',
    overdue: false,
    label: 'backend',
    description: 'Document all public API endpoints using OpenAPI 3.0.',
    tags: ['urgent', 'backend'],
    notes: 'Use Swagger UI for rendering.',
    code: `openapi: 3.0.0\ninfo:\n  title: CodeTask API`,
    activity: [{ user: 'Alex R.', time: '2 days ago' }],
  },
  {
    id: 7,
    checked: false,
    priority: 'urgent',
    title: 'API Endpoint documentation',
    meta: 'Sprint 3 | Enhance API key handling',
    project: 'API v1.3',
    deadline: '14 Dec',
    overdue: false,
    label: 'wip',
    description: 'Second pass review of API docs for completeness.',
    tags: ['urgent', 'wip'],
    notes: 'Cross-check with Postman collection.',
    code: `// Auto-generate from JSDoc\nnpx swagger-jsdoc -d swaggerDef.js`,
    activity: [{ user: 'Alex R.', time: '4 hours ago' }],
  },
];

// ── State ──────────────────────────────────────────────────────────────────
let selectedTaskId = null;
let currentPage = 'Dashboard';
let activeProjectFilter = 'all';
let activeLabelFilter = 'all';

// ── Projects Data ──────────────────────────────────────────────────────────
const projects = [
  {
    id: 1,
    name: 'Core v2.1',
    description: 'Core platform rewrite with improved performance and new API layer.',
    color: '#00d4c8',
    status: 'active',
    tasks: 9,
    completedTasks: 5,
    members: ['Alex R.', 'Sam K.', 'Mia L.'],
    createdAt: '12 Nov',
  },
  {
    id: 2,
    name: 'API v1.3',
    description: 'REST API versioning, rate limiting, and OAuth 2.0 integration.',
    color: '#8b5cf6',
    status: 'active',
    tasks: 14,
    completedTasks: 8,
    members: ['Alex R.', 'Jordan T.'],
    createdAt: '3 Oct',
  },
  {
    id: 3,
    name: 'Auth v1',
    description: 'Authentication module with JWT, SSO, and multi-factor auth support.',
    color: '#ef4444',
    status: 'paused',
    tasks: 6,
    completedTasks: 6,
    members: ['Alex R.'],
    createdAt: '20 Sep',
  },
];

// ── Team Data ──────────────────────────────────────────────────────────────
const teamMembers = [
  {
    id: 1,
    name: 'Alex Rodriguez',
    email: 'alex.r@codetask.io',
    role: 'Lead Developer',
    status: 'online',
    avatar: 'AR',
    color: '#00d4c8',
    projects: ['Core v2.1', 'API v1.3', 'Auth v1'],
    tasksCompleted: 47,
    joinedAt: '15 Jan',
  },
  {
    id: 2,
    name: 'Sam Kowalski',
    email: 'sam.k@codetask.io',
    role: 'Developer',
    status: 'online',
    avatar: 'SK',
    color: '#8b5cf6',
    projects: ['Core v2.1'],
    tasksCompleted: 23,
    joinedAt: '3 Mar',
  },
  {
    id: 3,
    name: 'Mia Lin',
    email: 'mia.l@codetask.io',
    role: 'Designer',
    status: 'away',
    avatar: 'ML',
    color: '#f59e0b',
    projects: ['Core v2.1'],
    tasksCompleted: 18,
    joinedAt: '12 Apr',
  },
  {
    id: 4,
    name: 'Jordan Torres',
    email: 'jordan.t@codetask.io',
    role: 'DevOps',
    status: 'offline',
    avatar: 'JT',
    color: '#10b981',
    projects: ['API v1.3'],
    tasksCompleted: 31,
    joinedAt: '28 Feb',
  },
];

// ── Badge HTML ─────────────────────────────────────────────────────────────
function badgeHTML(type) {
  const map = {
    urgent:  ['badge-urgent',  'Urgent'],
    high:    ['badge-high',    'High'],
    low:     ['badge-low',     'Low'],
    wip:     ['badge-wip',     'WIP'],
    backend: ['badge-backend', 'Backend'],
  };
  const [cls, label] = map[type] || ['badge-wip', type];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Render Table ───────────────────────────────────────────────────────────
function getFilteredTasks() {
  let filtered = tasks;
  if (activeProjectFilter !== 'all') {
    filtered = filtered.filter(t => t.project === activeProjectFilter);
  }
  if (activeLabelFilter !== 'all') {
    filtered = filtered.filter(t => t.priority.toLowerCase() === activeLabelFilter || t.label.toLowerCase() === activeLabelFilter);
  }
  return filtered;
}

function renderTasks() {
  const tbody = document.getElementById('taskBody');
  const filtered = getFilteredTasks();
  tbody.innerHTML = filtered.map(t => `
    <tr data-id="${t.id}" class="${selectedTaskId === t.id ? 'selected' : ''}" onclick="selectTask(${t.id})">
      <td>
        <div class="task-cb ${t.checked ? 'checked' : ''}" onclick="event.stopPropagation(); toggleCheck(${t.id})"></div>
      </td>
      <td>${badgeHTML(t.priority)}</td>
      <td>
        <p class="text-[13.5px] font-medium text-gray-100">${t.title}</p>
        <p class="text-[12px] text-gray-600 mt-0.5">${t.meta}</p>
      </td>
      <td>
        <span class="text-[13px] font-medium ${t.overdue ? 'deadline-overdue' : 'text-gray-400'}">${t.deadline}</span>
      </td>
      <td>${badgeHTML(t.label)}</td>
      <td>
        <button class="icon-btn" onclick="event.stopPropagation(); deleteTask(${t.id})" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </td>
    </tr>
  `).join('');
  updateProgressBar();
  updateTaskCount();
}

// ── Update Progress Bar ────────────────────────────────────────────────────
function updateProgressBar() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.checked).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  const progressLabel = document.getElementById('progressLabel');
  const progressPercent = document.getElementById('progressPercent');
  const progressBar = document.getElementById('progressBar');
  
  if (progressLabel) progressLabel.textContent = `${activeProjectFilter === 'all' ? 'All Tasks' : activeProjectFilter}: ${percent}% Complete`;
  if (progressPercent) progressPercent.textContent = `${percent}%`;
  if (progressBar) progressBar.style.width = `${percent}%`;
}

// ── Update Task Count in header ───────────────────────────────────────
function updateTaskCount() {
  const filtered = getFilteredTasks();
  const h1 = document.getElementById('taskAreaTitle');
  const subtitle = document.getElementById('taskAreaSubtitle');
  
  if (h1) h1.innerHTML = `Active Tasks <span class="text-[14px] font-medium text-gray-600">(${filtered.length})</span>`;
  
  if (subtitle) {
    if (activeProjectFilter !== 'all') subtitle.textContent = `Project: ${activeProjectFilter}`;
    else if (activeLabelFilter !== 'all') subtitle.textContent = `Filtered by label: ${activeLabelFilter}`;
    else subtitle.textContent = 'All Tasks';
  }
}

// ── Select Task → show detail panel ────────────────────────────────────────
function selectTask(id) {
  selectedTaskId = id;
  renderTasks();

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('detailTitle').textContent = task.title.length > 22
    ? task.title.slice(0, 22) + '…'
    : task.title;
  document.getElementById('detailDesc').textContent = task.description;
  document.getElementById('detailNotes').textContent = task.notes;
  document.getElementById('detailCode').textContent = task.code;

  const tagsEl = document.getElementById('detailTags');
  tagsEl.innerHTML = task.tags.map(tag => badgeHTML(tag)).join('');

  const actEl = document.getElementById('detailActivity');
  actEl.innerHTML = task.activity.map(a => `
    <div class="flex items-center gap-2.5">
      <div class="w-[7px] h-[7px] rounded-full bg-white/20 flex-shrink-0"></div>
      <span class="text-[12.5px] text-gray-400">${a.user}</span>
      <span class="text-[12px] text-gray-600 ml-auto">${a.time}</span>
    </div>
  `).join('');

  document.getElementById('detailPanel').classList.remove('hidden');
}

function closeDetailPanel() {
  selectedTaskId = null;
  renderTasks();
  document.getElementById('detailPanel').classList.add('hidden');
}

// ── Toggle Checkbox ────────────────────────────────────────────────────────
function toggleCheck(id) {
  const task = tasks.find(t => t.id === id);
  if (task) { task.checked = !task.checked; renderTasks(); }
}

// ── Delete Task ────────────────────────────────────────────────────────────
function deleteTask(id) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) tasks.splice(idx, 1);
  if (selectedTaskId === id) closeDetailPanel();
  else renderTasks();
  updateTaskCount();
}

// ── Update Task Count in header ─────────────────────────────────────────────
function updateTaskCount() {
  const h1 = document.querySelector('h1');
  if (h1) h1.innerHTML = `Active Tasks <span class="text-[14px] font-medium text-gray-600">(${tasks.length})</span>`;
}

// ── New Task Modal ─────────────────────────────────────────────────────────
function openNewTaskModal() {
  document.getElementById('modalBackdrop').classList.remove('hidden');
  setTimeout(() => document.getElementById('newTaskTitle').focus(), 50);
}
function closeNewTaskModal() {
  document.getElementById('modalBackdrop').classList.add('hidden');
  ['newTaskTitle','newTaskMeta','newTaskDeadline'].forEach(id => document.getElementById(id).value = '');
}
function closeModalOnBackdrop(e) {
  if (e.target === document.getElementById('modalBackdrop')) closeNewTaskModal();
}
function addNewTask() {
  const title    = document.getElementById('newTaskTitle').value.trim();
  const meta     = document.getElementById('newTaskMeta').value.trim() || 'Sprint 3 | Enhance API key handling';
  const priority = document.getElementById('newTaskPriority').value;
  const label    = document.getElementById('newTaskLabel').value;
  const deadline = document.getElementById('newTaskDeadline').value.trim() || '14 Dec';
  if (!title) { document.getElementById('newTaskTitle').focus(); return; }

  const newTask = {
    id: Date.now(),
    checked: false,
    priority,
    title,
    meta,
    deadline,
    overdue: false,
    label,
    description: `${title} · ${meta}`,
    tags: [priority, label],
    notes: '',
    code: `// New task: ${title}`,
    activity: [{ user: 'Alex R.', time: 'Just now' }],
  };
  tasks.unshift(newTask);
  renderTasks();
  updateTaskCount();
  closeNewTaskModal();
}

// ── Keyboard shortcuts ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeNewTaskModal();
    closeDetailPanel();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.querySelector('.search-bar input').focus();
  }
});

// ── Edit Task ────────────────────────────────────────────────────────────────
function editTask() {
  if (!selectedTaskId) return;
  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task) return;
  const newTitle = prompt('Edit task title:', task.title);
  if (newTitle !== null && newTitle.trim() !== '') {
    task.title = newTitle.trim();
    renderTasks();
    selectTask(selectedTaskId);
  }
}

// ── Sidebar Interactions ───────────────────────────────────────────────────
function setupSidebar() {
  // Icon Rail buttons
  const railBtns = document.querySelectorAll('.rail-btn');
  railBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.title === 'Logout') {
        alert('Logging out...');
        return;
      }
      railBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // If navigating to Dashboard, also switch to it with current filters
      if (btn.title === 'Inbox') {
        navigateTo('Dashboard');
        // Reset filters and show all
        activeProjectFilter = 'all';
        activeLabelFilter = 'all';
        resetSidebarActive();
        renderTasks();
        return;
      }
      navigateTo(btn.title);
    });
  });

  // Project sidebar items
  document.querySelectorAll('.sidebar-project').forEach(btn => {
    btn.addEventListener('click', () => {
      // Highlight this project item
      document.querySelectorAll('.sidebar-project').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Set project filter
      activeProjectFilter = btn.dataset.project;
      activeLabelFilter = 'all';
      // Clear label active states
      document.querySelectorAll('.sidebar-label').forEach(b => b.classList.remove('active'));
      // Switch to dashboard
      const railBtns = document.querySelectorAll('.rail-btn');
      railBtns.forEach(b => b.classList.remove('active'));
      const dashBtn = [...railBtns].find(b => b.title === 'Dashboard');
      if (dashBtn) dashBtn.classList.add('active');
      navigateTo('Dashboard');
      renderTasks();
    });
  });

  // Label sidebar items
  document.querySelectorAll('.sidebar-label').forEach(btn => {
    btn.addEventListener('click', () => {
      // Highlight this label item
      document.querySelectorAll('.sidebar-label').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Set label filter
      activeLabelFilter = btn.dataset.label;
      // Switch to dashboard
      const railBtns = document.querySelectorAll('.rail-btn');
      railBtns.forEach(b => b.classList.remove('active'));
      const dashBtn = [...railBtns].find(b => b.title === 'Dashboard');
      if (dashBtn) dashBtn.classList.add('active');
      navigateTo('Dashboard');
      renderTasks();
    });
  });

  // Inbox button
  document.querySelectorAll('.sidebar-inbox').forEach(btn => {
    btn.addEventListener('click', () => {
      // Navigate to Dashboard and reset filters
      activeProjectFilter = 'all';
      activeLabelFilter = 'all';
      resetSidebarActive();
      const railBtns = document.querySelectorAll('.rail-btn');
      railBtns.forEach(b => b.classList.remove('active'));
      const inboxRail = [...railBtns].find(b => b.title === 'Inbox');
      if (inboxRail) inboxRail.classList.add('active');
      navigateTo('Dashboard');
      renderTasks();
      // Decrement inbox badge
      const badge = document.getElementById('inboxBadge');
      if (badge) {
        let count = parseInt(badge.textContent) || 0;
        if (count > 0) count--;
        badge.textContent = count;
        if (count === 0) badge.style.display = 'none';
      }
    });
  });
}

// Helper to reset sidebar active states
function resetSidebarActive() {
  document.querySelectorAll('.sidebar-project').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.sidebar-label').forEach(b => b.classList.remove('active'));
  const allProjectBtn = document.querySelector('.sidebar-project[data-project="all"]');
  if (allProjectBtn) allProjectBtn.classList.add('active');
}

// ── Page Navigation ───────────────────────────────────────────────────────
function navigateTo(page) {
  currentPage = page;

  // All page containers
  const pages = ['pageDashboard', 'pageProjects', 'pageTeam'];
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  if (page === 'Projects') {
    document.getElementById('pageProjects').classList.remove('hidden');
    renderProjects();
  } else if (page === 'Team') {
    document.getElementById('pageTeam').classList.remove('hidden');
    renderTeam();
  } else {
    // Dashboard or any other page defaults to task view
    document.getElementById('pageDashboard').classList.remove('hidden');
  }
}

// ── Render Projects ───────────────────────────────────────────────────────
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const countEl = document.getElementById('projectCount');
  if (countEl) countEl.textContent = `(${projects.length})`;

  grid.innerHTML = projects.map(p => {
    const percent = p.tasks === 0 ? 0 : Math.round((p.completedTasks / p.tasks) * 100);
    const statusMap = {
      active:    ['bg-green-500/15 text-green-400', 'Active'],
      paused:    ['bg-yellow-500/15 text-yellow-400', 'Paused'],
      completed: ['bg-blue-500/15 text-blue-400', 'Completed'],
    };
    const [statusCls, statusLabel] = statusMap[p.status] || statusMap.active;

    const memberAvatars = p.members.slice(0, 3).map((m, i) => {
      const initials = m.split(' ').map(w => w[0]).join('');
      return `<div class="w-[26px] h-[26px] rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[10px] font-bold text-gray-400 ${i > 0 ? '-ml-2' : ''}" title="${m}">${initials}</div>`;
    }).join('');
    const extraMembers = p.members.length > 3 ? `<div class="w-[26px] h-[26px] rounded-full bg-overlay border-2 border-elevated flex items-center justify-center text-[9px] font-bold text-gray-500 -ml-2">+${p.members.length - 3}</div>` : '';

    return `
      <div class="project-card bg-elevated border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all cursor-pointer group" onclick="selectProject(${p.id})">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-3 h-3 rounded-full flex-shrink-0" style="background: ${p.color}"></div>
            <h3 class="text-[15px] font-semibold text-gray-100 group-hover:text-white transition-colors">${p.name}</h3>
          </div>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCls}">${statusLabel}</span>
        </div>
        <p class="text-[12.5px] text-gray-500 leading-relaxed mb-4">${p.description}</p>
        
        <div class="mb-4">
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-[11.5px] text-gray-500">${p.completedTasks} of ${p.tasks} tasks</span>
            <span class="text-[11.5px] font-bold font-mono" style="color: ${p.color}">${percent}%</span>
          </div>
          <div class="h-1 bg-overlay rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700" style="width: ${percent}%; background: ${p.color}"></div>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center">${memberAvatars}${extraMembers}</div>
          <span class="text-[11px] text-gray-600">Created ${p.createdAt}</span>
        </div>

        <div class="flex gap-2 mt-4 pt-3 border-t border-white/[0.06]">
          <button class="flex-1 text-[12px] font-medium text-gray-400 bg-overlay hover:bg-hover rounded-lg py-1.5 transition-colors" onclick="event.stopPropagation(); editProject(${p.id})">Edit</button>
          <button class="flex-1 text-[12px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg py-1.5 transition-colors" onclick="event.stopPropagation(); deleteProject(${p.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Select Project → switch to dashboard with that project ────────────────
function selectProject(id) {
  const project = projects.find(p => p.id === id);
  if (!project) return;
  // Switch back to dashboard
  const railBtns = document.querySelectorAll('.rail-btn');
  railBtns.forEach(b => b.classList.remove('active'));
  const dashBtn = [...railBtns].find(b => b.title === 'Dashboard');
  if (dashBtn) dashBtn.classList.add('active');
  navigateTo('Dashboard');
}

// ── Edit Project ──────────────────────────────────────────────────────────
function editProject(id) {
  const project = projects.find(p => p.id === id);
  if (!project) return;
  const newName = prompt('Edit project name:', project.name);
  if (newName !== null && newName.trim() !== '') {
    project.name = newName.trim();
    renderProjects();
  }
}

// ── Delete Project ────────────────────────────────────────────────────────
function deleteProject(id) {
  const idx = projects.findIndex(p => p.id === id);
  if (idx !== -1) {
    if (confirm(`Delete project "${projects[idx].name}"?`)) {
      projects.splice(idx, 1);
      renderProjects();
    }
  }
}

// ── New Project Modal ─────────────────────────────────────────────────────
function openNewProjectModal() {
  document.getElementById('projectModalBackdrop').classList.remove('hidden');
  setTimeout(() => document.getElementById('newProjectName').focus(), 50);
}
function closeNewProjectModal() {
  document.getElementById('projectModalBackdrop').classList.add('hidden');
  ['newProjectName', 'newProjectDesc'].forEach(id => document.getElementById(id).value = '');
}
function closeProjectModalOnBackdrop(e) {
  if (e.target === document.getElementById('projectModalBackdrop')) closeNewProjectModal();
}
function addNewProject() {
  const name   = document.getElementById('newProjectName').value.trim();
  const desc   = document.getElementById('newProjectDesc').value.trim() || 'New project description.';
  const color  = document.getElementById('newProjectColor').value;
  const status = document.getElementById('newProjectStatus').value;
  if (!name) { document.getElementById('newProjectName').focus(); return; }

  projects.push({
    id: Date.now(),
    name,
    description: desc,
    color,
    status,
    tasks: 0,
    completedTasks: 0,
    members: ['Alex R.'],
    createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  });
  renderProjects();
  closeNewProjectModal();
}

// ── Render Team ───────────────────────────────────────────────────────────
function renderTeam() {
  const grid = document.getElementById('teamGrid');
  if (!grid) return;

  const countEl = document.getElementById('teamCount');
  if (countEl) countEl.textContent = `(${teamMembers.length})`;

  // Update stats bar
  const online = teamMembers.filter(m => m.status === 'online').length;
  const away = teamMembers.filter(m => m.status === 'away').length;
  const offline = teamMembers.filter(m => m.status === 'offline').length;
  const totalTasks = teamMembers.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const statOnline = document.getElementById('statOnline');
  const statAway = document.getElementById('statAway');
  const statOffline = document.getElementById('statOffline');
  const statTotal = document.getElementById('statTotalTasks');
  if (statOnline) statOnline.textContent = `${online} Online`;
  if (statAway) statAway.textContent = `${away} Away`;
  if (statOffline) statOffline.textContent = `${offline} Offline`;
  if (statTotal) statTotal.innerHTML = `<span class="font-bold text-cyan font-mono">${totalTasks}</span> total tasks completed`;

  grid.innerHTML = teamMembers.map(m => {
    const statusMap = {
      online:  ['bg-green-500', 'Online'],
      away:    ['bg-yellow-500', 'Away'],
      offline: ['bg-gray-500', 'Offline'],
    };
    const [dotCls, statusLabel] = statusMap[m.status] || statusMap.offline;

    const projectBadges = m.projects.map(p => 
      `<span class="text-[11px] font-medium text-gray-400 bg-overlay border border-white/[0.06] rounded-md px-2 py-0.5">${p}</span>`
    ).join('');

    return `
      <div class="team-card bg-elevated border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all cursor-default group">
        <div class="flex items-start gap-3.5 mb-4">
          <div class="relative flex-shrink-0">
            <div class="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white" style="background: ${m.color}">${m.avatar}</div>
            <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-elevated ${dotCls}" title="${statusLabel}"></div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[14px] font-semibold text-gray-100 truncate">${m.name}</h3>
            <p class="text-[12px] text-gray-500 truncate">${m.email}</p>
          </div>
          <div class="flex gap-1">
            <button class="icon-btn" onclick="editMember(${m.id})" title="Edit">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="icon-btn" onclick="removeMember(${m.id})" title="Remove">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 mb-3">
          <span class="text-[12px] font-semibold px-2.5 py-1 rounded-md" style="background: ${m.color}20; color: ${m.color}">${m.role}</span>
          <span class="text-[11px] text-gray-600 ml-auto">Joined ${m.joinedAt}</span>
        </div>

        <div class="mb-3">
          <p class="text-[11px] font-semibold tracking-widest uppercase text-gray-600 mb-1.5">Projects</p>
          <div class="flex flex-wrap gap-1.5">${projectBadges || '<span class="text-[11px] text-gray-600">No projects</span>'}</div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div class="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-600"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span class="text-[12px] text-gray-400"><span class="font-bold text-gray-300">${m.tasksCompleted}</span> tasks completed</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-2 h-2 rounded-full ${dotCls}"></div>
            <span class="text-[11px] text-gray-500">${statusLabel}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Edit Member ───────────────────────────────────────────────────────────
function editMember(id) {
  const member = teamMembers.find(m => m.id === id);
  if (!member) return;
  const newName = prompt('Edit member name:', member.name);
  if (newName !== null && newName.trim() !== '') {
    member.name = newName.trim();
    member.avatar = newName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    renderTeam();
  }
}

// ── Remove Member ─────────────────────────────────────────────────────────
function removeMember(id) {
  const idx = teamMembers.findIndex(m => m.id === id);
  if (idx !== -1) {
    if (confirm(`Remove "${teamMembers[idx].name}" from the team?`)) {
      teamMembers.splice(idx, 1);
      renderTeam();
    }
  }
}

// ── New Member Modal ──────────────────────────────────────────────────────
function openNewMemberModal() {
  document.getElementById('memberModalBackdrop').classList.remove('hidden');
  setTimeout(() => document.getElementById('newMemberName').focus(), 50);
}
function closeNewMemberModal() {
  document.getElementById('memberModalBackdrop').classList.add('hidden');
  ['newMemberName', 'newMemberEmail'].forEach(id => document.getElementById(id).value = '');
}
function closeMemberModalOnBackdrop(e) {
  if (e.target === document.getElementById('memberModalBackdrop')) closeNewMemberModal();
}
function addNewMember() {
  const name   = document.getElementById('newMemberName').value.trim();
  const email  = document.getElementById('newMemberEmail').value.trim() || `${name.toLowerCase().replace(/\s/g, '.')}@codetask.io`;
  const role   = document.getElementById('newMemberRole').value;
  const status = document.getElementById('newMemberStatus').value;
  if (!name) { document.getElementById('newMemberName').focus(); return; }

  const colors = ['#00d4c8', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
  teamMembers.push({
    id: Date.now(),
    name,
    email,
    role,
    status,
    avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    color: colors[Math.floor(Math.random() * colors.length)],
    projects: [],
    tasksCompleted: 0,
    joinedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  });
  renderTeam();
  closeNewMemberModal();
}

// ── Init ───────────────────────────────────────────────────────────────────
renderTasks();
setupSidebar();