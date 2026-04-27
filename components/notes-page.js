class AppNotesPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="flex flex-1 overflow-hidden h-full bg-base">
        <!-- Notes Sidebar -->
        <div class="w-[320px] flex flex-col border-r border-white/[0.04] bg-surface flex-shrink-0">
          <div class="p-5 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h1 class="text-[18px] font-bold tracking-tight text-white">Notes</h1>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan text-base hover:opacity-90 transition-all active:scale-95" onclick="addNote()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
            
            <!-- Search -->
            <div class="relative group">
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input type="text" placeholder="Search notes..." class="w-full bg-overlay border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[13px] outline-none focus:border-cyan/30 transition-all" oninput="filterNotes(this.value)">
            </div>

            <!-- Tabs -->
            <div class="flex items-center gap-1 p-1 bg-overlay rounded-xl">
              <button class="flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all active note-tab" data-filter="all" onclick="setNotesFilter('all')">All</button>
              <button class="flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all text-gray-500 hover:text-gray-300 note-tab" data-filter="personal" onclick="setNotesFilter('personal')">Personal</button>
              <button class="flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all text-gray-500 hover:text-gray-300 note-tab" data-filter="team" onclick="setNotesFilter('team')">Team</button>
            </div>
          </div>

          <!-- Note List -->
          <div class="flex-1 overflow-y-auto px-3 pb-5 custom-scrollbar" id="notesSidebarList">
            <!-- Note cards rendered here -->
          </div>
        </div>

        <!-- Notes Editor -->
        <div class="flex-1 flex flex-col overflow-hidden bg-base relative" id="noteEditorArea">
          <!-- Empty State -->
          <div id="noteEditorEmpty" class="absolute inset-0 flex flex-col items-center justify-center text-center p-10 z-10">
            <div class="w-20 h-20 rounded-3xl bg-overlay flex items-center justify-center mb-6 text-gray-600 border border-white/5 shadow-2xl">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <h2 class="text-[18px] font-bold text-gray-400">No Note Selected</h2>
            <p class="text-[14px] text-gray-600 mt-2 max-w-[280px]">Select a note from the sidebar or create a new one to start writing.</p>
            <button class="mt-8 px-6 py-2.5 bg-overlay border border-white/10 rounded-xl text-[13.5px] font-semibold text-gray-400 hover:text-cyan hover:border-cyan/30 transition-all active:scale-95" onclick="addNote()">
              + Create New Note
            </button>
          </div>

          <!-- Editor Header -->
          <div id="noteEditorHeader" class="hidden flex items-center justify-between px-8 py-4 border-b border-white/[0.04] bg-surface/50 backdrop-blur-md z-20">
            <div class="flex items-center gap-4">
              <div id="noteEditorScope" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-white/10 text-gray-500">Personal</div>
              <div id="noteEditorDate" class="text-[12px] text-gray-600 font-medium">Last edited: Just now</div>
            </div>
            <div class="flex items-center gap-2">
              <button id="notePinBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-overlay border border-white/5 text-gray-500 hover:text-cyan transition-all" onclick="toggleNotePin()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c-3 0-4-1-4-4s-1-4-4-4-4 1-4 4-1 4-4 4c0 3 1 4 4 4s4 1 4 4 1 4 4 4"/></svg>
              </button>
              <button id="noteShareBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-overlay border border-white/5 text-gray-500 hover:text-purple transition-all" onclick="toggleNoteScope()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </button>
              <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all" onclick="deleteCurrentNote()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          <!-- Editor Body -->
          <div id="noteEditorBody" class="hidden flex-1 flex flex-col overflow-y-auto px-8 py-10 custom-scrollbar z-20">
            <input type="text" id="noteTitleInput" placeholder="Note Title" class="w-full bg-transparent border-none outline-none text-[32px] font-bold text-white placeholder:text-gray-800 mb-6" oninput="saveNote()">
            <div class="flex items-center gap-3 mb-8">
              <div id="noteColorPicker" class="flex items-center gap-1.5">
                <!-- Color dots added here -->
              </div>
              <div class="w-px h-3 bg-white/10 mx-1"></div>
              <div id="noteTags" class="flex items-center gap-2">
                <!-- Tags added here -->
              </div>
            </div>
            <textarea id="noteContentInput" placeholder="Start typing your thoughts..." class="flex-1 w-full bg-transparent border-none outline-none text-[15px] leading-relaxed text-gray-300 placeholder:text-gray-700 resize-none font-mono" oninput="saveNote()"></textarea>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('app-notes-page', AppNotesPage);
