class AppDetailPanel extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <!-- Detail Panel -->
        <div id="detailPanel" class="w-[300px] flex-shrink-0 bg-surface border-l border-white/[0.06] flex flex-col overflow-y-auto hidden">
          <div class="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
            <h2 class="text-[15px] font-bold tracking-tight" id="detailTitle">—</h2>
            <div class="flex gap-1">
              <button class="icon-btn" title="Edit" onclick="editTask()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="icon-btn" title="More" id="closeDetail" onclick="closeDetailPanel()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div class="p-4 flex flex-col gap-4">
            <p class="text-[13px] text-gray-400 leading-relaxed" id="detailDesc">—</p>

            <div>
              <p class="text-[11px] font-semibold tracking-widest uppercase text-gray-600 mb-2">Tags</p>
              <div class="flex flex-wrap gap-1.5" id="detailTags"></div>
            </div>

            <div>
              <p class="text-[11px] font-semibold tracking-widest uppercase text-gray-600 mb-1.5">Notes</p>
              <p class="text-[13px] text-gray-400" id="detailNotes">—</p>
            </div>

            <div>
              <p class="text-[11px] font-semibold tracking-widest uppercase text-gray-600 mb-2">Javascript</p>
              <pre class="code-block text-[12px] font-mono text-cyan leading-relaxed overflow-x-auto" id="detailCode"></pre>
            </div>

            <div>
              <p class="text-[11px] font-semibold tracking-widest uppercase text-gray-600 mb-3">Activity Log</p>
              <div class="flex flex-col gap-2.5" id="detailActivity"></div>
            </div>
          </div>
        </div>
    `;
  }
}
customElements.define('app-detail-panel', AppDetailPanel);
