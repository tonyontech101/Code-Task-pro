class AppHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <!-- Top Nav -->
      <header class="flex items-center gap-3 md:gap-4 h-14 px-3 md:px-5 bg-surface border-b border-white/[0.06] flex-shrink-0">
        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="md:hidden icon-btn mr-0.5" title="Toggle Menu" onclick="document.body.classList.toggle('sidebar-open')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="hidden sm:block flex-shrink-0">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#00d4c8" opacity="0.9"/>
            <path d="M2 17l10 5 10-5" stroke="#8b5cf6" stroke-width="2" fill="none"/>
            <path d="M2 12l10 5 10-5" stroke="#00d4c8" stroke-width="2" fill="none" opacity="0.6"/>
          </svg>
          <span class="text-[15px] font-bold tracking-tight">CodeFlow</span>
        </div>

        <div class="search-bar hidden md:flex items-center gap-2 flex-1 max-w-md h-[34px] px-3 bg-elevated border border-white/[0.06] rounded-xl text-gray-500">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search tasks, labels..." class="flex-1 bg-transparent border-none outline-none text-[13.5px] text-gray-100 placeholder-gray-600 font-sans" />
          <kbd class="text-[10px] text-gray-600 bg-overlay border border-white/10 rounded px-1.5 py-0.5 font-mono">\u2318K</kbd>
        </div>

        <div class="flex items-center gap-2 ml-auto flex-shrink-0 cursor-pointer hover:opacity-80 transition-all min-w-0" onclick="navigateToPage('pageSettings'); setSettingsTab('notifications');">
          <div id="userAvatar" class="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">—</div>
          <span id="userName" class="text-[13.5px] font-medium text-gray-400 truncate max-w-[120px] hidden sm:inline">Loading...</span>
        </div>
      </header>
    `;

    // Search functionality
    const searchInput = this.querySelector('.search-bar input');
    if (searchInput) {
      (async () => {
        const { state } = await import('../js/modules/state.js');
        const { debounce } = await import('../js/modules/performance.js');
        const { renderTasks } = await import('../js/controllers/dashboard-controller.js');
        const { navigateToPage } = await import('../js/modules/navigation.js');

        const handleSearch = debounce((e) => {
          state.tasksSearchQuery = e.target.value;
          if (state.activePageId !== 'pageDashboard') {
            navigateToPage('pageDashboard');
          }
          renderTasks();
        }, 300);

        searchInput.addEventListener('input', handleSearch);
      })();
    }

    // Listen for auth-ready event to update user info
    window.addEventListener("auth-ready", async (e) => {
      const { escapeHtml } = await import('../js/modules/utils.js');
      const user = e.detail.user;
      const name = user.displayName || user.email || "User";
      const initials = name.split(/[\s@]/)
        .filter(Boolean)
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const avatarEl = document.getElementById("userAvatar");
      const nameEl   = document.getElementById("userName");

      if (avatarEl) {
        if (user.photoURL) {
          avatarEl.innerHTML = `<img src="${escapeHtml(user.photoURL)}" class="w-full h-full rounded-full object-cover" onerror="this.outerHTML = '<div class=\\'w-full h-full rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[13px] font-bold text-white\\'>${initials}</div>';" />`;
          avatarEl.classList.remove('bg-gradient-to-br', 'from-purple', 'to-cyan');
        } else {
          avatarEl.textContent = initials;
          avatarEl.classList.add('bg-gradient-to-br', 'from-purple', 'to-cyan');
        }
      }
      if (nameEl) nameEl.textContent = name.split("@")[0];
    });
  }
}
customElements.define('app-header', AppHeader);
