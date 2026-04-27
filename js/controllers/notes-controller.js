/**
 * notes-controller.js - Logic for the Notes page
 */

import { state } from '../modules/state.js';

export function renderNotes() {
  const sidebarList = document.getElementById("notesSidebarList");
  if (!sidebarList) return;

  let filtered = state.notes;
  if (state.notesFilter !== "all") filtered = filtered.filter(n => n.scope === state.notesFilter);
  if (state.notesSearchQuery) {
    const q = state.notesSearchQuery.toLowerCase();
    filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  filtered.sort((a, b) => (a.pinned === b.pinned ? b.id - a.id : a.pinned ? -1 : 1));

  if (filtered.length === 0) {
    sidebarList.innerHTML = `<div class="flex flex-col items-center justify-center py-10 text-center px-4"><p class="text-[12px] text-gray-600 font-medium italic">No notes found</p></div>`;
    return;
  }

  sidebarList.innerHTML = filtered.map(n => `
    <div class="note-card ${state.currentNoteId === n.id ? 'active' : ''}" onclick="window.selectNote(${n.id})">
      <div class="note-card-status" style="background: ${n.color}"></div>
      <div class="flex items-center justify-between gap-2 mb-1">
        <h4 class="note-card-title truncate flex-1">${n.title || 'Untitled Note'}</h4>
        <div class="flex items-center gap-1 opacity-60">
          ${n.pinned ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00d4c8" stroke-width="3"><path d="M21 10c-3 0-4-1-4-4s-1-4-4-4-4 1-4 4-1 4-4 4c0 3 1 4 4 4s4 1 4 4 1 4 4 4"/></svg>' : ''}
          ${n.scope === 'team' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' : ''}
        </div>
      </div>
      <p class="note-card-preview line-clamp-2">${n.content.substring(0, 80)}...</p>
      <div class="note-card-footer">
        <span class="note-card-date">${n.date}</span>
        <div class="flex gap-1">${(n.tags || []).map(t => `<span class="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-500 font-mono uppercase tracking-widest">${t}</span>`).join('')}</div>
      </div>
    </div>
  `).join("");
}

export function selectNote(id) {
  state.currentNoteId = id;
  const note = state.notes.find(n => n.id === id);
  if (!note) return;

  const titleInput = document.getElementById("noteTitleInput");
  const contentInput = document.getElementById("noteContentInput");
  if (titleInput) titleInput.value = note.title;
  if (contentInput) contentInput.value = note.content;

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
  if (dateLabel) dateLabel.textContent = `Last edited: ${note.date}`;

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
        ${t}
        <svg class="note-tag-remove" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" onclick="window.removeNoteTag('${t}')"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
    `).join("") + `
      <button class="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-gray-500 hover:text-cyan transition-all" onclick="window.promptAddTag()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    `;
  }
}

export function changeNoteColor(color) {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (note) {
    note.color = color;
    renderNotes();
    renderEditorDetails(note);
  }
}

export function promptAddTag() {
  const tag = prompt("Enter new tag:");
  if (tag) {
    const note = state.notes.find(n => n.id === state.currentNoteId);
    if (note) {
      if (!note.tags) note.tags = [];
      if (!note.tags.includes(tag.toLowerCase())) {
        note.tags.push(tag.toLowerCase());
        renderNotes();
        renderEditorDetails(note);
      }
    }
  }
}

export function removeNoteTag(tag) {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (note && note.tags) {
    note.tags = note.tags.filter(t => t !== tag);
    renderNotes();
    renderEditorDetails(note);
  }
}

export function addNote() {
  const newNote = {
    id: Date.now(),
    title: "",
    content: "",
    date: "Just now",
    color: "#00d4c8",
    pinned: false,
    scope: "personal",
    tags: []
  };
  state.notes.unshift(newNote);
  selectNote(newNote.id);
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
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;

  const titleInput = document.getElementById("noteTitleInput");
  const contentInput = document.getElementById("noteContentInput");
  
  note.title = titleInput.value;
  note.content = contentInput.value;
  note.date = "Just now";
  
  renderNotes();
}

export function toggleNotePin() {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (note) {
    note.pinned = !note.pinned;
    renderNotes();
    renderEditorDetails(note);
  }
}

export function toggleNoteScope() {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (note) {
    note.scope = note.scope === "personal" ? "team" : "personal";
    renderNotes();
    renderEditorDetails(note);
  }
}

export function deleteCurrentNote() {
  if (!confirm("Delete this note?")) return;
  state.notes = state.notes.filter(n => n.id !== state.currentNoteId);
  state.currentNoteId = null;
  
  document.getElementById("noteEditorHeader")?.classList.add("hidden");
  document.getElementById("noteEditorBody")?.classList.add("hidden");
  document.getElementById("noteEditorEmpty")?.classList.remove("hidden");
  
  renderNotes();
}
