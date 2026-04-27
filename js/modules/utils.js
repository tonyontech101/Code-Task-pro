/**
 * utils.js - General purpose helper functions
 */

export const formatDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const getRoleClass = (role) => {
  const r = role.toLowerCase();
  if (r.includes('lead') || r.includes('pm')) return 'bg-cyan/10 text-cyan';
  if (r.includes('dev')) return 'bg-purple/10 text-purple';
  if (r.includes('design')) return 'bg-amber-500/10 text-amber-500';
  return 'bg-gray-500/10 text-gray-400';
};

export const statusColors = { 
  online: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]", 
  away: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]", 
  offline: "bg-gray-500" 
};

export const getStatusColor = (status) => {
  return status === 'online' ? 'bg-green-500' :
         status === 'away'   ? 'bg-yellow-500' : 'bg-gray-500';
};

export const getContactGradient = (id) => {
  const gradients = {
    sarah:  "from-pink-500 to-purple-600",
    alex:   "from-blue-400 to-cyan-500",
    jamie:  "from-orange-400 to-red-500",
    morgan: "from-green-400 to-emerald-600",
    taylor: "from-violet-400 to-indigo-600",
  };
  return gradients[id] || "from-purple to-cyan";
};

export const showToast = (message, type = 'success') => {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl pointer-events-auto transition-all duration-300 translate-x-full opacity-0 ${
    type === 'success' ? 'bg-cyan/10 border-cyan/20 text-cyan' : 
    type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
    'bg-amber-500/10 border-amber-500/20 text-amber-500'
  }`;
  
  const icon = type === 'success' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' :
               type === 'error' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' :
               '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

  toast.innerHTML = `${icon}<span class="text-[13.5px] font-semibold">${message}</span>`;
  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 10);

  // Remove after 3s
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};
