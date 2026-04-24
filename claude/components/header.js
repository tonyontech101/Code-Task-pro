class AppHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <!-- Top Nav -->
      <header class="flex items-center gap-4 h-14 px-5 bg-surface border-b border-white/[0.06] flex-shrink-0">
        <div class="flex items-center gap-2 flex-shrink-0 min-w-[160px]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#00d4c8" opacity="0.9"/>
            <path d="M2 17l10 5 10-5" stroke="#8b5cf6" stroke-width="2" fill="none"/>
            <path d="M2 12l10 5 10-5" stroke="#00d4c8" stroke-width="2" fill="none" opacity="0.6"/>
          </svg>
          <span class="text-[15px] font-bold tracking-tight">CodeTask <span class="text-cyan">Pro</span></span>
        </div>

        <div class="search-bar flex items-center gap-2 flex-1 max-w-md h-[34px] px-3 bg-elevated border border-white/[0.06] rounded-xl text-gray-500">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search tasks, labels..." class="flex-1 bg-transparent border-none outline-none text-[13.5px] text-gray-100 placeholder-gray-600 font-sans" />
          <kbd class="text-[10px] text-gray-600 bg-overlay border border-white/10 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
        </div>

        <div class="flex items-center gap-2 ml-auto flex-shrink-0">
          <div class="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[11px] font-bold text-white">AR</div>
          <span class="text-[13.5px] font-medium text-gray-400">Alex R.</span>
        </div>
      </header>
    `;
  }
}
customElements.define('app-header', AppHeader);
