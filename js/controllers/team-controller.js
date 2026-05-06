/**
 * team-controller.js - Logic for the Team page
 */

import { state } from '../modules/state.js';
import { auth } from '../../config/config.js';
import { formatDate, getRoleClass, statusColors, showToast, escapeHtml } from '../modules/utils.js';
import { deleteMemberRecord, findUserByEmail, sendProjectInvitation } from '../modules/data-store.js';
import { renderProjectsGrid } from './projects-controller.js';
import { renderSidebarProjects } from './dashboard-controller.js';

function memberName(member) {
  return member.name || member.displayName || member.email?.split("@")[0] || "Friend";
}

function memberInitials(member) {
  return memberName(member).split(/[\s@]+/)
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "FR";
}

function inlineJsArg(value) {
  return escapeHtml(JSON.stringify(value));
}

function ownedProjects() {
  const uid = auth.currentUser?.uid;
  return state.projects.filter(project => !project.ownerUid || project.ownerUid === uid);
}

function getMemberProjects(member) {
  return state.projects.filter(project => {
    const memberIds = project.memberIds || [];
    const projectIds = member.projectIds || [];
    return memberIds.includes(member.id) || projectIds.includes(project.id) || projectIds.includes(project.sourceProjectId);
  });
}

function getMemberTaskCount(member, projects) {
  const projectNames = new Set(projects.map(project => project.name));
  const projectIds = new Set(projects.flatMap(project => [project.id, project.sourceProjectId].filter(Boolean)));

  return state.tasks.filter(task => {
    return projectNames.has(task.project) || projectIds.has(task.projectId) || projectIds.has(task.sourceProjectId);
  }).length;
}

export function prepareInviteMemberModal() {
  const select = document.getElementById("newMemberProject");
  if (select) {
    const projects = ownedProjects();
    let options = `<option value="">None (Workspace access only)</option>`;
    if (projects.length > 0) {
      options += projects.map(project => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}</option>`).join("");
    }
    select.innerHTML = options;
    select.disabled = false;
  }

  const submit = document.getElementById("inviteMemberSubmit");
  if (submit) submit.disabled = false;
}

export function renderTeamGrid() {
  const grid  = document.getElementById("teamGrid");
  const count = document.getElementById("teamCount");
  if (!grid) return;

  const members = state.members;
  if (count) count.textContent = `(${members.length})`;

  // Update stats
  const online  = members.filter(m => m.status === "online").length;
  const away    = members.filter(m => m.status === "away").length;
  const offline = members.filter(m => m.status === "offline").length;

  const statOnline  = document.getElementById("statOnline");
  const statAway    = document.getElementById("statAway");
  const statOffline = document.getElementById("statOffline");
  const statTotalTasks = document.getElementById("statTotalTasks");
  if (statOnline)  statOnline.textContent  = `${online} Online`;
  if (statAway)    statAway.textContent    = `${away} Away`;
  if (statOffline) statOffline.textContent = `${offline} Offline`;
  if (statTotalTasks) {
    const totalAssigned = members.reduce((sum, member) => {
      const projects = getMemberProjects(member);
      return sum + getMemberTaskCount(member, projects);
    }, 0);
    statTotalTasks.innerHTML = `<span class="font-bold text-cyan font-mono">${totalAssigned}</span> project tasks`;
  }

  if (members.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500 mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h3 class="text-gray-300 font-bold">No friends yet</h3>
        <p class="text-gray-500 text-[13px] mt-1 max-w-[240px]">Invite your friends to collaborate on projects and chat in real-time.</p>
        <button class="mt-4 px-6 py-2 bg-cyan/10 hover:bg-cyan/20 text-cyan text-[13px] font-bold rounded-lg transition-all" onclick="window.openNewMemberModal()">Invite Friend</button>
      </div>`;
    return;
  }

  grid.innerHTML = members.map(m => {
    const name = memberName(m);
    const initials = memberInitials(m);
    const memberProjects = getMemberProjects(m);
    const taskCount = getMemberTaskCount(m, memberProjects);
    const joinedAt = m.joinedAt || m.createdAt;
    const status = m.status === "online" ? "online" : "offline";
    const memberId = inlineJsArg(m.id);
    const avatar = m.photoURL
      ? `<img src="${escapeHtml(m.photoURL)}" alt="" class="w-12 h-12 rounded-full object-cover border border-white/10" />`
      : `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[15px] font-bold text-white shadow-lg shadow-black/20">${escapeHtml(initials)}</div>`;

    return `
      <div class="team-card bg-elevated border border-white/[0.04] rounded-2xl p-6 transition-all hover:bg-hover hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/40">
        <div class="flex items-start gap-4 mb-5">
          <div class="relative flex-shrink-0">
            ${avatar}
            <div class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-elevated ${statusColors[status] || 'bg-gray-500'}"></div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <h3 class="text-[14.5px] font-bold text-gray-100 truncate">${escapeHtml(name)}</h3>
              <div class="flex items-center gap-2">
                <button class="text-gray-600 hover:text-red-400 transition-colors" onclick="window.deleteMember(${memberId})" title="Remove friend">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            <p class="text-[12.5px] text-gray-500 truncate">${escapeHtml(m.email || "")}</p>
          </div>
        </div>
        <div class="flex items-center justify-between mb-6">
          <span class="px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${getRoleClass(m.role || "Member")}">${escapeHtml(m.role || "Member")}</span>
          <span class="text-[11.5px] text-gray-600 font-medium">Joined ${formatDate(joinedAt)}</span>
        </div>
        <div class="mb-6">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2.5">Projects</p>
          <div class="flex flex-wrap gap-2">
            ${memberProjects.length ? memberProjects.map(p => `<span class="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[11px] text-gray-400 font-medium">${escapeHtml(p.name)}</span>`).join('') : '<span class="text-[11px] text-gray-600 italic">No projects</span>'}
          </div>
        </div>
        <div class="flex items-center justify-between pt-4 border-t border-white/[0.03]">
          <div class="flex items-center gap-1.5 text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-cyan"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span class="text-[12px] font-medium font-mono">${taskCount} project tasks</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full ${statusColors[status] || 'bg-gray-500'}"></div>
            <span class="text-[12px] font-bold capitalize text-gray-400">${status}</span>
          </div>
        </div>
      </div>`;
  }).join("");
}

export async function addNewMember() {
  const email = document.getElementById("newMemberEmail").value.trim();
  const role = document.getElementById("newMemberRole").value;
  const projectId = document.getElementById("newMemberProject").value;

  if (!email) {
    showToast("Please enter an existing user's email", "error");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast("Enter a valid email address", "error");
    return;
  }

  try {
    let targetUser = null;
    try {
      targetUser = await findUserByEmail(email);
    } catch (lookupErr) {
      console.warn("Profile lookup skipped; sending email-targeted invite.", lookupErr);
    }
    targetUser = targetUser || { email };

    await sendProjectInvitation(targetUser, projectId, role);

    document.getElementById("newMemberEmail").value = "";
    showToast("Invitation sent to friend");
    closeNewMemberModal();
  } catch (err) {
    console.error(err);
    showToast(err.message === "USER_NOT_FOUND" ? "User not found" : "Failed to invite friend", "error");
  }
}

export async function deleteMember(id) {
  const m = state.members.find(x => x.id === id);
  if (!m) return;
  if (!confirm("Are you sure you want to remove this friend from your workspace?")) return;
  if (!confirm(`Remove ${memberName(m)} from every project in your workspace?`)) return;

  try {
    await deleteMemberRecord(id);

    const idx = state.members.findIndex(x => x.id === id);
    if (idx !== -1) state.members.splice(idx, 1);
    
    state.projects.forEach(p => {
      if (p.memberIds) p.memberIds = p.memberIds.filter(mid => mid !== id);
    });

    renderTeamGrid();
    renderProjectsGrid();
    renderSidebarProjects();
    showToast(`${memberName(m)} removed`);
  } catch (err) {
    showToast("Failed to remove friend", "error");
    console.error(err);
  }
}
