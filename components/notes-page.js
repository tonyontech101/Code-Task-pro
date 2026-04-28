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
          
          <!-- Subtle Background Mesh -->
          <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div class="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-cyan/5 blur-[120px] rounded-full mix-blend-screen"></div>
            <div class="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-purple/5 blur-[120px] rounded-full mix-blend-screen"></div>
          </div>

          <!-- Empty State -->
          <div id="noteEditorEmpty" class="absolute inset-0 flex flex-col items-center justify-center text-center p-10 z-10">
            <div class="relative mb-8">
              <div class="absolute inset-0 bg-gradient-to-tr from-cyan/20 to-purple/20 blur-xl rounded-full"></div>
              <div class="relative w-24 h-24 rounded-[2rem] bg-elevated/80 backdrop-blur-xl flex items-center justify-center text-gray-500 border border-white/10 shadow-2xl">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
            </div>
            <h2 class="text-[18px] font-bold text-gray-400">No Note Selected</h2>
            <p class="text-[14px] text-gray-600 mt-2 max-w-[280px]">Select a note from the sidebar or create a new one to start writing.</p>
            <button class="mt-8 px-6 py-2.5 bg-overlay border border-white/10 rounded-xl text-[13.5px] font-semibold text-gray-400 hover:text-cyan hover:border-cyan/30 hover:bg-cyan/5 hover:shadow-[0_0_20px_rgba(0,212,200,0.15)] transition-all duration-300 active:scale-95" onclick="addNote()">
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
            
            <!-- Markdown/Rich Text Toolbar -->
            <div class="flex items-center gap-1 mb-6 p-1 bg-elevated/50 backdrop-blur-md border border-white/5 rounded-xl w-fit shadow-sm">
              <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-all" title="Bold">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
              </button>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-all" title="Italic">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
              </button>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-all" title="Strikethrough">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
              </button>
              <div class="w-px h-4 bg-white/10 mx-1.5"></div>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-all" title="List">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-all" title="Checklist">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </button>
              <div class="w-px h-4 bg-white/10 mx-1.5"></div>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-all" title="Code Block">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </button>
            </div>

            <textarea id="noteContentInput" placeholder="Start typing your thoughts..." class="flex-1 w-full bg-transparent border-none outline-none text-[15px] leading-[1.8] text-gray-300 placeholder:text-gray-700 resize-none font-sans" oninput="saveNote()"></textarea>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('app-notes-page', AppNotesPage);
