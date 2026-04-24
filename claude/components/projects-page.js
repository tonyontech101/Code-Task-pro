class AppProjectsPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div id="projectsPage" class="flex flex-col flex-1 overflow-hidden bg-base hidden">

        <!-- Header -->
        <div class="flex items-start justify-between px-7 pt-6 pb-4 flex-shrink-0">
          <div>
            <div class="flex items-baseline gap-2">
              <h1 class="text-[20px] font-bold tracking-tight">Projects <span id="projectCount" class="text-[14px] font-medium text-gray-600">(3)</span></h1>
            </div>
            <p class="text-[12.5px] text-gray-600 mt-0.5">Manage all your projects</p>
          </div>
          <button class="flex items-center gap-1.5 px-4 py-2 bg-cyan text-base text-[13.5px] font-semibold rounded-xl hover:opacity-90 transition-all hover:-translate-y-px active:translate-y-0" onclick="openNewProjectModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Project
          </button>
        </div>

        <!-- Projects Grid -->
        <div class="flex-1 overflow-y-auto px-7 pb-6">
          <div id="projectsGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div>
        </div>
      </div>

      <!-- New Project Modal -->
      <div id="projectModalBackdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm hidden z-50 flex items-center justify-center" onclick="closeProjectModalOnBackdrop(event)">
        <div class="bg-elevated border border-white/10 rounded-2xl w-full max-w-md p-6" onclick="event.stopPropagation()">
          <h3 class="text-[16px] font-bold mb-4">New Project</h3>
          <div class="flex flex-col gap-3">
            <input id="newProjectName" type="text" placeholder="Project name..." class="modal-input" />
            <input id="newProjectDesc" type="text" placeholder="Short description..." class="modal-input" />
            <div class="flex gap-3">
              <select id="newProjectColor" class="modal-input flex-1">
                <option value="#00d4c8">Cyan</option>
                <option value="#8b5cf6">Purple</option>
                <option value="#ef4444">Red</option>
                <option value="#f59e0b">Amber</option>
                <option value="#10b981">Green</option>
                <option value="#3b82f6">Blue</option>
              </select>
              <select id="newProjectStatus" class="modal-input flex-1">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 mt-5 justify-end">
            <button class="px-4 py-2 text-[13px] text-gray-400 bg-overlay hover:bg-hover rounded-lg transition-colors" onclick="closeNewProjectModal()">Cancel</button>
            <button class="px-4 py-2 text-[13px] font-semibold text-base bg-cyan rounded-lg hover:opacity-90 transition-opacity" onclick="addNewProject()">Create Project</button>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('app-projects-page', AppProjectsPage);
