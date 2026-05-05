/**
 * notes-controller.js - Logic for the Notes page
 */

import { state } from '../modules/state.js';
import { createNoteRecord, deleteNoteRecord, updateNoteRecord, createInboxItem } from '../modules/data-store.js';
import { auth } from '../../config/config.js';
import { escapeHtml, formatDate, showToast, timeAgo } from '../modules/utils.js';

const NOTE_SAVE_DELAY_MS = 500;
const noteSaveTimers = new Map();
let isCreatingNote = false;

function uniqueNotes(notes) {
  const byKey = new Map();
  notes.forEach(note => {
    const key = `${note.storage || note.scope || "note"}:${note.teamNoteId || note.id}`;
    byKey.set(key, note);
  });
  return [...byKey.values()];
}

function findNote(id) {
  return uniqueNotes(state.notes).find(note => String(note.id) === String(id));
}

function getNoteTime(note) {
  const value = note.updatedAt || note.createdAt || note.id || 0;
  if (typeof value === "object" && typeof value?.seconds === "number") return value.seconds * 1000;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getNoteDateLabel(note) {
  return note.date || formatDate(note.updatedAt || note.createdAt);
}

function getCreatorName(note) {
  return note.creatorName || note.ownerName || "Unknown";
}

function getNoteMetaLabel(note) {
  return `${timeAgo(note.updatedAt || note.createdAt)} · ${getCreatorName(note)}`;
}

function inlineJsArg(value) {
  return escapeHtml(JSON.stringify(value));
}

function persistNote(id, payload, immediate = false) {
  const key = String(id);
  if (noteSaveTimers.has(key)) {
    clearTimeout(noteSaveTimers.get(key));
    noteSaveTimers.delete(key);
  }

  const save = () => updateNoteRecord(id, payload)
    .then((updates) => {
      const note = findNote(id);
      if (note) Object.assign(note, updates);
    })
    .catch((err) => {
      showToast("Failed to save note", "error");
      console.error(err);
    });

  if (immediate) return save();

  noteSaveTimers.set(key, setTimeout(() => {
    noteSaveTimers.delete(key);
    save();
  }, NOTE_SAVE_DELAY_MS));
}

export function renderNotes() {
  const sidebarList = document.getElementById("notesSidebarList");
  if (!sidebarList) return;

  let filtered = uniqueNotes(state.notes);
  if (state.notesFilter !== "all") filtered = filtered.filter(n => n.scope === state.notesFilter);
  if (state.notesSearchQuery) {
    const q = state.notesSearchQuery.toLowerCase();
    filtered = filtered.filter(n => String(n.title || "").toLowerCase().includes(q) || String(n.content || "").toLowerCase().includes(q));
  }

  filtered.sort((a, b) => (a.pinned === b.pinned ? getNoteTime(b) - getNoteTime(a) : a.pinned ? -1 : 1));

  if (filtered.length === 0) {
    sidebarList.innerHTML = `<div class="flex flex-col items-center justify-center py-10 text-center px-4"><p class="text-[12px] text-gray-600 font-medium italic">No notes found</p></div>`;
    return;
  }

  sidebarList.innerHTML = filtered.map(n => {
    const noteId = inlineJsArg(String(n.id));
    const title = String(n.title || "");
    const content = String(n.content || "");
    return `
    <div class="note-card ${String(state.currentNoteId) === String(n.id) ? 'active' : ''}" onclick='window.selectNote(${noteId})'>
      <div class="note-card-status" style="background: ${escapeHtml(n.color || "#00d4c8")}"></div>
      <div class="flex items-center justify-between gap-2 mb-1">
        <h4 class="note-card-title truncate flex-1">${escapeHtml(title || 'Untitled Note')}</h4>
        <div class="flex items-center gap-1 opacity-60">
          ${n.pinned ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00d4c8" stroke-width="3"><path d="M21 10c-3 0-4-1-4-4s-1-4-4-4-4 1-4 4-1 4-4 4c0 3 1 4 4 4s4 1 4 4 1 4 4 4"/></svg>' : ''}
          ${n.scope === 'team' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' : ''}
        </div>
      </div>
      <p class="note-card-preview line-clamp-2">${escapeHtml(content.substring(0, 80))}${content.length > 80 ? '...' : ''}</p>
      <div class="note-card-footer">
        <span class="note-card-date">${escapeHtml(getNoteMetaLabel(n))}</span>
        <div class="flex gap-1">${(n.tags || []).map(t => `<span class="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-500 font-mono uppercase tracking-widest">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
    </div>
  `;
  }).join("");
}

export function selectNote(id) {
  state.currentNoteId = id;
  const note = findNote(id);
  if (!note) return;

  const titleInput = document.getElementById("noteTitleInput");
  const contentInput = document.getElementById("noteContentInput");
  if (titleInput) titleInput.value = note.title || "";
  if (contentInput) contentInput.value = note.content || "";

  document.getElementById("noteEditorHeader")?.classList.remove("hidden");
  document.getElementById("noteEditorBody")?.classList.remove("hidden");
  document.getElementById("noteEditorEmpty")?.classList.add("hidden");

  renderNotes();
  renderEditorDetails(note);
}

function renderEditorDetails(note) {
  const colorPicker = document.getElementById("noteColorPicker");
  const tagsList = document.getElementById("noteTags");
  const scopeBadge = document.getElementById("noteEditorScope");
  const dateLabel = document.getElementById("noteEditorDate");
  const pinBtn = document.getElementById("notePinBtn");
  const shareBtn = document.getElementById("noteShareBtn");

  if (pinBtn) {
    pinBtn.classList.toggle('text-cyan', !!note.pinned);
    pinBtn.classList.toggle('bg-cyan/10', !!note.pinned);
    pinBtn.classList.toggle('border-cyan/20', !!note.pinned);
    pinBtn.classList.toggle('text-gray-500', !note.pinned);
  }

  if (shareBtn) {
    shareBtn.classList.toggle('text-purple', note.scope === 'team');
    shareBtn.classList.toggle('bg-purple/10', note.scope === 'team');
    shareBtn.classList.toggle('border-purple/20', note.scope === 'team');
    shareBtn.classList.toggle('text-gray-500', note.scope !== 'team');
  }

  if (scopeBadge) {
    scopeBadge.textContent = note.scope;
    scopeBadge.className = `px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-white/10 ${note.scope === 'team' ? 'text-purple border-purple/20 bg-purple/5' : 'text-gray-500'}`;
  }
  if (dateLabel) dateLabel.textContent = `Last edited: ${getNoteDateLabel(note)} · Created by ${getCreatorName(note)}`;

  if (colorPicker) {
    const colors = ["#00d4c8", "#8b5cf6", "#ef4444", "#f59e0b", "#10b981", "#3b82f6"];
    colorPicker.innerHTML = colors.map(c => `
      <div class="color-dot ${note.color === c ? 'active' : ''}" 
           style="background: ${c}; color: ${c}" 
           onclick="window.changeNoteColor('${c}')"></div>
    `).join("");
  }

  if (tagsList) {
    tagsList.innerHTML = (note.tags || []).map(t => `
      <div class="note-tag">
        ${escapeHtml(t)}
        <svg class="note-tag-remove" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" onclick='window.removeNoteTag(${inlineJsArg(t)})'><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
    `).join("") + `
      <button class="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-gray-500 hover:text-cyan transition-all" onclick="window.promptAddTag()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    `;
  }
}

export function changeNoteColor(color) {
  const note = findNote(state.currentNoteId);
  if (note) {
    note.color = color;
    renderNotes();
    renderEditorDetails(note);
    persistNote(note.id, { color }, true);
  }
}

export function promptAddTag() {
  const tag = prompt("Enter new tag:");
  if (tag) {
    const note = findNote(state.currentNoteId);
    if (note) {
      if (!note.tags) note.tags = [];
      const normalizedTag = tag.trim().toLowerCase();
      if (normalizedTag && !note.tags.includes(normalizedTag)) {
        note.tags.push(normalizedTag);
        renderNotes();
        renderEditorDetails(note);
        persistNote(note.id, { tags: note.tags }, true);
      }
    }
  }
}

export function removeNoteTag(tag) {
  const note = findNote(state.currentNoteId);
  if (note && note.tags) {
    note.tags = note.tags.filter(t => t !== tag);
    renderNotes();
    renderEditorDetails(note);
    persistNote(note.id, { tags: note.tags }, true);
  }
}

export async function addNote() {
  if (isCreatingNote) return;
  isCreatingNote = true;

  const payload = {
    title: "",
    content: "",
    color: "#00d4c8",
    pinned: false,
    scope: "personal",
    tags: []
  };
  try {
    const newNote = await createNoteRecord(payload);
    state.notes = uniqueNotes([newNote, ...state.notes]);
    selectNote(newNote.id);
    showToast("Note created");

    // Notification in inbox
    createInboxItem(auth.currentUser?.uid, {
      type: "note",
      icon: "note",
      title: "New note added",
      body: `A new note "${newNote.title || 'Untitled'}" has been shared in the workspace.`,
      project: null
    }).catch(console.error);
  } catch (err) {
    showToast("Failed to create note", "error");
    console.error(err);
  } finally {
    isCreatingNote = false;
  }
}

export function filterNotes(query) {
  state.notesSearchQuery = query;
  renderNotes();
}

export function setNotesFilter(filter) {
  state.notesFilter = filter;
  document.querySelectorAll('.note-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.filter === filter);
    t.classList.toggle('text-gray-500', t.dataset.filter !== filter);
  });
  renderNotes();
}

export function saveNote() {
  const note = findNote(state.currentNoteId);
  if (!note) return;

  const titleInput = document.getElementById("noteTitleInput");
  const contentInput = document.getElementById("noteContentInput");
  
  note.title = titleInput?.value || "";
  note.content = contentInput?.value || "";
  renderNotes();
  persistNote(note.id, {
    title: note.title,
    content: note.content
  });
}

export function toggleNotePin() {
  const note = findNote(state.currentNoteId);
  if (note) {
    note.pinned = !note.pinned;
    renderNotes();
    renderEditorDetails(note);
    persistNote(note.id, { pinned: note.pinned }, true);
  }
}

export async function toggleNoteScope() {
  const note = findNote(state.currentNoteId);
  if (note) {
    const previousId = note.id;
    const nextScope = note.scope === "personal" ? "team" : "personal";

    try {
      const updates = await updateNoteRecord(note.id, { scope: nextScope });
      const noteIndex = state.notes.findIndex(n => String(n.id) === String(previousId));
      Object.assign(note, updates);
      if (updates.id && String(updates.id) !== String(previousId)) {
        if (noteIndex !== -1) state.notes.splice(noteIndex, 1, note);
        state.currentNoteId = updates.id;
      }
      renderNotes();
      renderEditorDetails(note);
      
      if (nextScope === "team") {
        // Notify all members except current user
        state.members.forEach(member => {
          if (member.uid && member.uid !== auth.currentUser?.uid) {
            createInboxItem(member.uid, {
              type: "mention", // Or a new type 'note'
              icon: "project",
              title: "New shared note",
              body: `${auth.currentUser?.displayName || "A teammate"} shared a new note: "${note.title || "Untitled"}"`,
              project: "Notes"
            }).catch(console.error);
          }
        });
      }
      
      showToast(nextScope === "team" ? "Note shared with team" : "Note moved to personal");
    } catch (err) {
      showToast("Failed to update note sharing", "error");
      console.error(err);
    }
  }
}

export async function deleteCurrentNote() {
  if (!confirm("Delete this note?")) return;
  const noteId = state.currentNoteId;
  try {
    await deleteNoteRecord(noteId);
  } catch (err) {
    showToast("Failed to delete note", "error");
    console.error(err);
    return;
  }

  if (noteSaveTimers.has(String(noteId))) {
    clearTimeout(noteSaveTimers.get(String(noteId)));
    noteSaveTimers.delete(String(noteId));
  }
  state.notes = state.notes.filter(n => String(n.id) !== String(noteId));
  state.currentNoteId = null;
  
  document.getElementById("noteEditorHeader")?.classList.add("hidden");
  document.getElementById("noteEditorBody")?.classList.add("hidden");
  document.getElementById("noteEditorEmpty")?.classList.remove("hidden");
  
  renderNotes();
  showToast("Note deleted");
}
