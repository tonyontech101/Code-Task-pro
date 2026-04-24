class AppTeamPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div id="teamPage" class="flex flex-col flex-1 overflow-hidden bg-base hidden">

        <!-- Header -->
        <div class="flex items-start justify-between px-7 pt-6 pb-4 flex-shrink-0">
          <div>
            <div class="flex items-baseline gap-2">
              <h1 class="text-[20px] font-bold tracking-tight">Team <span id="teamCount" class="text-[14px] font-medium text-gray-600">(4)</span></h1>
            </div>
            <p class="text-[12.5px] text-gray-600 mt-0.5">Manage your team members</p>
          </div>
          <button class="flex items-center gap-1.5 px-4 py-2 bg-cyan text-base text-[13.5px] font-semibold rounded-xl hover:opacity-90 transition-all hover:-translate-y-px active:translate-y-0" onclick="openNewMemberModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Member
          </button>
        </div>

        <!-- Team Grid -->
        <div class="flex-1 overflow-y-auto px-7 pb-6">
          <div id="teamGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div>
        </div>
      </div>

      <!-- Add Member Modal -->
      <div id="memberModalBackdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm hidden z-50 flex items-center justify-center" onclick="closeMemberModalOnBackdrop(event)">
        <div class="bg-elevated border border-white/10 rounded-2xl w-full max-w-md p-6" onclick="event.stopPropagation()">
          <h3 class="text-[16px] font-bold mb-4">Add Team Member</h3>
          <div class="flex flex-col gap-3">
            <input id="newMemberName" type="text" placeholder="Full name..." class="modal-input" />
            <input id="newMemberEmail" type="text" placeholder="Email address..." class="modal-input" />
            <div class="flex gap-3">
              <select id="newMemberRole" class="modal-input flex-1">
                <option value="Developer">Developer</option>
                <option value="Designer">Designer</option>
                <option value="PM">Project Manager</option>
                <option value="DevOps">DevOps</option>
                <option value="QA">QA Engineer</option>
              </select>
              <select id="newMemberStatus" class="modal-input flex-1">
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 mt-5 justify-end">
            <button class="px-4 py-2 text-[13px] text-gray-400 bg-overlay hover:bg-hover rounded-lg transition-colors" onclick="closeNewMemberModal()">Cancel</button>
            <button class="px-4 py-2 text-[13px] font-semibold text-base bg-cyan rounded-lg hover:opacity-90 transition-opacity" onclick="addNewMember()">Add Member</button>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('app-team-page', AppTeamPage);
