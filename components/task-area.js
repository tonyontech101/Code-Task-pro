class AppTaskArea extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <!-- Task Area -->
        <div class="flex flex-col flex-1 overflow-hidden bg-base">

          <!-- Header -->
          <div class="flex items-start justify-between px-7 pt-6 pb-4 flex-shrink-0">
            <div>
              <div class="flex items-baseline gap-2">
                <h1 id="taskAreaTitle" class="text-[20px] font-bold tracking-tight">Active Tasks <span class="text-[14px] font-medium text-gray-600">(9)</span></h1>
              </div>
              <p id="taskAreaSubtitle" class="text-[12.5px] text-gray-600 mt-0.5">Project: Core v2.1</p>
            </div>
            <button class="flex items-center gap-1.5 px-4 py-2 bg-cyan text-base text-[13.5px] font-semibold rounded-xl hover:opacity-90 transition-all hover:-translate-y-px active:translate-y-0" onclick="openNewTaskModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Task
            </button>
          </div>

          <!-- Progress Bar -->
          <div class="mx-7 mb-4 bg-elevated border border-white/[0.06] rounded-xl p-3 flex-shrink-0">
            <div class="flex justify-between items-center mb-2">
              <span id="progressLabel" class="text-[13px] font-medium text-gray-400">Core v2.1: 72% Complete</span>
              <span id="progressPercent" class="text-[13px] font-bold text-cyan font-mono">72%</span>
            </div>
            <div class="h-1.5 bg-overlay rounded-full overflow-hidden">
              <div id="progressBar" class="h-full rounded-full bg-gradient-to-r from-cyan to-blue-500 transition-all duration-700" style="width: 72%"></div>
            </div>
          </div>

          <!-- Task Table -->
          <div class="flex-1 overflow-y-auto px-7 pb-6">
            <table class="w-full border border-white/[0.06] rounded-xl overflow-hidden bg-elevated border-collapse" id="taskTable">
              <thead>
                <tr class="bg-overlay border-b border-white/[0.06]">
                  <th class="w-10 px-3 py-2.5 text-left text-[11px] font-semibold tracking-widest uppercase text-gray-600"></th>
                  <th class="px-3 py-2.5 text-left text-[11px] font-semibold tracking-widest uppercase text-gray-600 w-28">Priority</th>
                  <th class="px-3 py-2.5 text-left text-[11px] font-semibold tracking-widest uppercase text-gray-600">Title</th>
                  <th class="px-3 py-2.5 text-left text-[11px] font-semibold tracking-widest uppercase text-gray-600 w-28">Deadline</th>
                  <th class="px-3 py-2.5 text-left text-[11px] font-semibold tracking-widest uppercase text-gray-600 w-28">Label</th>
                  <th class="w-10 px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody id="taskBody"></tbody>
            </table>
          </div>
        </div>
    `;
  }
}
customElements.define('app-task-area', AppTaskArea);
