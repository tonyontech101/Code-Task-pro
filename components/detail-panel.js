class AppDetailPanel extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <!-- Detail Panel -->
        <div id="detailPanel" class="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto md:w-[320px] flex-shrink-0 bg-surface md:border-l border-white/[0.06] flex flex-col overflow-hidden hidden">
          
          <!-- Panel Header -->
          <div class="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-white/[0.06] bg-elevated/30">
            <div class="flex flex-col gap-0.5">
              <span id="detailStatus" class="text-[10px] font-bold uppercase tracking-widest text-cyan opacity-80 mb-1">Active Task</span>
              <h2 class="text-[16px] font-bold tracking-tight text-gray-100" id="detailTitle">—</h2>
            </div>
            <div class="flex gap-1.5">
              <button class="icon-btn hover:text-cyan transition-colors" title="Edit" onclick="editTask()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="icon-btn hover:text-red-400 transition-colors" id="closeDetail" onclick="closeDetailPanel()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <div class="p-4 md:p-5 flex flex-col gap-5 md:gap-6">
              
              <!-- Metadata Row -->
              <div class="grid grid-cols-2 gap-3 pb-6 border-b border-white/[0.04]">
                <div class="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Priority
                  </p>
                  <span id="detailPriority" class="text-[12px] font-bold text-gray-300">—</span>
                </div>
                <div class="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Due Date
                  </p>
                  <span id="detailDeadline" class="text-[12px] font-bold text-gray-300">—</span>
                </div>
              </div>

              <!-- Description Section -->
              <div>
                <p class="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-2.5">Description</p>
                <p class="text-[13px] text-gray-400 leading-relaxed bg-overlay/40 p-3 rounded-xl border border-white/[0.03]" id="detailDesc">—</p>
              </div>

              <!-- Tags Section -->
              <div>
                <p class="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-2.5">Labels</p>
                <div class="flex flex-wrap gap-1.5" id="detailTags"></div>
              </div>

              <!-- Notes Section -->
              <div>
                <p class="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-2.5">Strategic Notes</p>
                <div class="relative group">
                   <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan/20 to-purple/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                   <div class="relative bg-elevated p-4 rounded-xl border border-white/[0.05]">
                     <p class="text-[13px] text-gray-300 leading-relaxed italic" id="detailNotes">—</p>
                   </div>
                </div>
              </div>

              <!-- Javascript/Code Section -->
              <div>
                <div class="flex items-center justify-between mb-2.5">
                  <p class="text-[11px] font-bold uppercase tracking-widest text-gray-600">Logic Implementation</p>
                  <div class="flex items-center gap-2">
                    <button class="text-gray-600 hover:text-cyan transition-colors" title="Copy Logic" onclick="copyDetailCode(this)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <span class="text-[9px] font-mono text-cyan/50 bg-cyan/5 px-2 py-0.5 rounded border border-cyan/10 uppercase">Code</span>
                  </div>
                </div>
                <div class="rounded-xl overflow-hidden border border-white/[0.06] bg-black/40 shadow-inner">
                  <pre class="p-4 text-[12px] font-mono text-cyan/90 leading-relaxed overflow-x-auto selection:bg-cyan/20" id="detailCode"></pre>
                </div>
              </div>

              <!-- Activity Log -->
              <div class="pb-4">
                <p class="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-4">Development Timeline</p>
                <div class="flex flex-col gap-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-0 before:w-px before:bg-white/[0.06]" id="detailActivity"></div>
              </div>

            </div>
          </div>
        </div>
    `;
  }
}
customElements.define('app-detail-panel', AppDetailPanel);
