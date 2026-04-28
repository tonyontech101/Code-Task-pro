import { state } from "../modules/state.js";
import { formatDate, getRoleClass, showToast, statusColors } from "../modules/utils.js";
import { deleteMemberRecord, updateMemberRecord, findUserByEmail, sendInvitation } from "../modules/data-store.js";
import { renderProjectsGrid, refreshProjectMemberOptions } from "./projects-controller.js";
import { auth } from "../../config/config.js";

function fillMemberForm(member) {
  document.getElementById("newMemberName").value = member?.name || "";
  document.getElementById("newMemberEmail").value = member?.email || "";
  document.getElementById("newMemberRole").value = member?.role || "Developer";
}

export function renderTeamGrid() {
  const grid = document.getElementById("teamGrid");
  const count = document.getElementById("teamCount");
  if (!grid) return;

  if (count) count.textContent = `(${state.members.length})`;

  const online = state.members.filter((member) => member.status === "online").length;
  const away = state.members.filter((member) => member.status === "away").length;
  const offline = state.members.filter((member) => member.status === "offline").length;

  const statOnline = document.getElementById("statOnline");
  const statAway = document.getElementById("statAway");
  const statOffline = document.getElementById("statOffline");
  if (statOnline) statOnline.textContent = `${online} Online`;
  if (statAway) statAway.textContent = `${away} Away`;
  if (statOffline) statOffline.textContent = `${offline} Offline`;

  if (state.members.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-20 bg-elevated/50 border border-dashed border-white/10 rounded-2xl">
        <div class="text-gray-600">
          <svg class="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p class="text-[15px] font-semibold text-gray-400 mb-1">No team members yet</p>
          <p class="text-[13px] text-gray-600">Click <span class="text-cyan font-bold cursor-pointer hover:underline" onclick="window.openNewMemberModal()">Invite Member</span> to get started</p>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = state.members.map((member) => {
    const initials = member.name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
    const memberProjects = state.projects.filter((project) => (project.memberIds || []).includes(member.id));
    const tasksDone = state.tasks.filter(t => t.done && t.assignee === member.id).length;

    const avatarHtml = member.photoURL
      ? `<img src="${member.photoURL}" alt="${member.name}" class="w-14 h-14 rounded-full object-cover shadow-lg shadow-black/20">`
      : `<div class="w-14 h-14 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-[16px] font-bold text-white shadow-lg shadow-black/20">${initials}</div>`;

    return `
      <div class="team-card bg-elevated border border-white/[0.04] rounded-2xl p-6 transition-all hover:bg-hover hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/40">
        <div class="flex items-start gap-4 mb-5">
          <div class="relative flex-shrink-0">
            ${avatarHtml}
            <div class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-elevated ${statusColors[member.status] || "bg-gray-500"}"></div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <h3 class="text-[15px] font-bold text-gray-100 truncate">${member.name}</h3>
              <button class="text-gray-600 hover:text-red-400 transition-colors" onclick="window.deleteMember('${member.id}')" title="Remove Member">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            <p class="text-[12px] text-gray-400 font-medium">${member.jobTitle || 'Team Member'}</p>
            <span class="px-2.5 py-0.5 mt-1 inline-block rounded-lg text-[11px] font-bold ${getRoleClass(member.role)}">${member.role}</span>
            <p class="text-[12px] text-gray-500 mt-1 truncate">${member.email}</p>
          </div>
        </div>
        <div class="mb-5">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2.5">Projects</p>
          <div class="flex flex-wrap gap-2">
            ${memberProjects.length ? memberProjects.map((project) => `<span class="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[11px] text-gray-400 font-medium">${project.name}</span>`).join("") : '<span class="text-[11px] text-gray-600 italic">No projects</span>'}
          </div>
        </div>
        <div class="flex items-center justify-between pt-4 border-t border-white/[0.03]">
          <div class="flex items-center gap-1.5 text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-cyan"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span class="text-[12px] font-medium font-mono">${tasksDone} tasks done</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full ${statusColors[member.status] || "bg-gray-500"}"></div>
            <span class="text-[12px] font-bold capitalize text-gray-400">${member.status}</span>
          </div>
        </div>
        <div class="text-[10px] text-gray-600 mt-3 text-right">Joined ${formatDate(member.createdAt || member.id)}</div>
      </div>`;
  }).join("");
}

export async function sendTeamInvitation() {
  const email = document.getElementById("newMemberEmail").value.trim().toLowerCase();
  const role = document.getElementById("newMemberRole").value;

  if (!email) {
    showToast("Please enter an email address", "error");
    return;
  }

  // Prevent self-invite
  if (auth.currentUser && email === auth.currentUser.email) {
    showToast("You cannot invite yourself", "error");
    return;
  }

  try {
    // Look up user by email
    const targetUser = await findUserByEmail(email);
    if (!targetUser) {
      showToast("No user found with that email. They must sign up first.", "error");
      return;
    }

    // Check if already a member
    const isAlreadyMember = state.members.some(m => m.uid === targetUser.uid);
    if (isAlreadyMember) {
      showToast("User is already a member of your team", "error");
      return;
    }

    await sendInvitation(targetUser, role);
    showToast(`Invitation sent to ${email}`);
    fillMemberForm(null);
    window.closeNewMemberModal();
  } catch (err) {
    if (err.message === "DUPLICATE_INVITE") {
      showToast("An invitation is already pending for this user", "error");
    } else {
      showToast("Failed to send invitation", "error");
      console.error(err);
    }
  }
}


export function resetMemberModal() {
  const modal = document.getElementById("memberModalBackdrop");
  if (!modal) return;
  modal.dataset.editingId = "";
  fillMemberForm(null);
  const heading = document.querySelector("#memberModalBackdrop h3");
  if (heading) heading.textContent = "Invite Team Member";
  const btn = document.querySelector("#memberModalBackdrop button[onclick='sendTeamInvitation()']");
  if (btn) btn.textContent = "Send Invitation";
}

export async function deleteMember(id) {
  const member = state.members.find((item) => item.id === id);
  if (!member) return;
  if (!confirm(`Remove ${member.name} from the team?`)) return;

  try {
    await deleteMemberRecord(id);
    state.members = state.members.filter((item) => item.id !== id);
    state.projects.forEach((project) => {
      if (project.memberIds) {
        project.memberIds = project.memberIds.filter((memberId) => memberId !== id);
      }
    });

    renderTeamGrid();
    renderProjectsGrid();
    refreshProjectMemberOptions();
    showToast(`${member.name} removed`);
  } catch (err) {
    showToast("Failed to remove member", "error");
    console.error(err);
  }
}
