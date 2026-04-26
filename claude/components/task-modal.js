class AppTaskModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <!-- New Task Modal -->
      <div id="modalBackdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm hidden z-50 flex items-center justify-center" onclick="closeModalOnBackdrop(event)">
        <div class="bg-elevated border border-white/10 rounded-2xl w-full max-w-md p-6" onclick="event.stopPropagation()">
          <h3 class="text-[16px] font-bold mb-4" id="taskModalTitle">New Task</h3>
          <div class="flex flex-col gap-3">
            <input id="newTaskTitle" type="text" placeholder="Task title..." class="modal-input" />
            <input id="newTaskMeta" type="text" placeholder="Sprint / Group (e.g. Sprint 3 | Feature X)" class="modal-input" />
            <div class="flex gap-3">
              <select id="newTaskPriority" class="modal-input flex-1">
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
              <select id="newTaskLabel" class="modal-input flex-1">
                <option value="backend">Backend</option>
                <option value="wip">WIP</option>
              </select>
            </div>
            <select id="newTaskProject" class="modal-input">
              <!-- populated dynamically by openNewTaskModal() -->
            </select>
            <input id="newTaskDeadline" type="text" placeholder="Deadline (e.g. 14 Dec)" class="modal-input" />
            <textarea id="newTaskNotes" placeholder="Strategic Notes..." class="modal-input min-h-[80px] py-3"></textarea>
            <textarea id="newTaskCode" placeholder="Logical Implementation (JS code)..." class="modal-input min-h-[100px] py-3 font-mono text-[12px]"></textarea>
          </div>
          <div class="flex gap-2 mt-5 justify-end">
            <button class="px-4 py-2 text-[13px] text-gray-400 bg-overlay hover:bg-hover rounded-lg transition-colors" onclick="closeNewTaskModal()">Cancel</button>
            <button class="px-4 py-2 text-[13px] font-semibold text-base bg-cyan rounded-lg hover:opacity-90 transition-opacity" id="taskModalSubmit" onclick="addNewTask()">Create Task</button>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('app-task-modal', AppTaskModal);
