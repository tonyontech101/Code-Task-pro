import { state } from '../modules/state.js';
import { createNoteRecord, updateNoteRecord, deleteNoteRecord } from '../modules/data-store.js';
import { showToast } from '../modules/utils.js';

function getEl(id) {
  return document.getElementById(id);
}

let _saveDebounceTimer = null;
let _lastPersistId = 0;

async function persistNoteToServer(note) {
  if (!note || !note.id) return;
  const payload = {
    title: note.title || '',
    content: note.content || '',
    scope: note.scope || 'personal',
    color: note.color || 'default',
    tags: note.tags || []
  };

  try {
    await updateNoteRecord(note.id, payload);
    showToast('Note saved', 'success');
  } catch (err) {
    console.error('Failed to persist note', err);
    showToast('Failed to save note', 'error');
  }
}

function schedulePersist(note, delay = 1000) {
  _lastPersistId += 1;
  const thisId = _lastPersistId;
  if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(() => {
    // only persist the latest scheduled id
    if (thisId !== _lastPersistId) return;
    persistNoteToServer(note);
    _saveDebounceTimer = null;
  }, delay);
}

export function renderNotes() {
  const list = getEl('notesSidebarList');
  const editorArea = getEl('noteEditorArea');
  if (!list) return;

  const query = (state.notesSearchQuery || '').toLowerCase();
  const filtered = (state.notes || []).filter(n => {
    if (state.notesFilter && state.notesFilter !== 'all' && n.scope !== state.notesFilter) return false;
    if (!query) return true;
    return (n.title || '').toLowerCase().includes(query) || (n.content || '').toLowerCase().includes(query);
  });

  list.innerHTML = filtered.map(n => {
    const active = state.currentNoteId === n.id ? 'note-card-active' : '';
    return `
      <div class="note-card ${active}" onclick="window.selectNote('${n.id}')">
        <div class="note-card-title">${n.title || 'Untitled'}</div>
        <div class="note-card-body text-[12px] text-gray-500">${(n.content || '').slice(0, 80)}</div>
      </div>`;
  }).join('');

  // Render editor if note selected
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (note && editorArea) {
    // Render color picker
    const colorPicker = getEl('noteColorPicker');
    if (colorPicker) {
      const COLORS = [
        { id: 'default', hex: '#2b2b2b' },
        { id: 'cyan',    hex: '#06b6d4' },
        { id: 'purple',  hex: '#8b5cf6' },
        { id: 'amber',   hex: '#f59e0b' },
        { id: 'green',   hex: '#10b981' },
        { id: 'red',     hex: '#ef4444' },
        { id: 'indigo',  hex: '#6366f1' }
      ];

      colorPicker.innerHTML = COLORS.map(c => {
        const active = note.color === c.id ? 'ring-2 ring-white/20' : '';
        return `<button title="${c.id}" onclick="event.stopPropagation(); window.changeNoteColor('${c.id}')" class="w-6 h-6 rounded-full ${active}" style="background:${c.hex}; border:1px solid rgba(255,255,255,0.06);"></button>`;
      }).join('');
    }

    getEl('noteEditorEmpty')?.classList.add('hidden');
    getEl('noteEditorHeader')?.classList.remove('hidden');
    getEl('noteEditorBody')?.classList.remove('hidden');
    getEl('noteTitleInput').value = note.title || '';
    getEl('noteContentInput').value = note.content || '';
    getEl('noteEditorScope').textContent = note.scope ? (note.scope.charAt(0).toUpperCase() + note.scope.slice(1)) : 'Personal';
    getEl('noteEditorDate').textContent = `Last edited: ${note.updatedAt ? new Date(note.updatedAt).toLocaleString() : 'Just now'}`;
  } else {
    getEl('noteEditorEmpty')?.classList.remove('hidden');
    getEl('noteEditorHeader')?.classList.add('hidden');
    getEl('noteEditorBody')?.classList.add('hidden');
  }
}

export function selectNote(id) {
  state.currentNoteId = id;
  renderNotes();
}

export async function addNote() {
  const payload = { title: '', content: '', scope: 'personal', color: 'default', tags: [] };
  try {
    const created = await createNoteRecord(payload);
    state.notes = state.notes || [];
    // Prepend the newly created record (server id + timestamps)
    state.notes.unshift(created);
    state.currentNoteId = created.id;
    renderNotes();
    showToast('Note created', 'success');
  } catch (err) {
    console.error('Failed to create note', err);
    showToast('Failed to create note', 'error');
  }
}

export function filterNotes(query) {
  state.notesSearchQuery = query || '';
  renderNotes();
}

export function setNotesFilter(filter) {
  state.notesFilter = filter;
  document.querySelectorAll('.note-tab').forEach(t => t.classList.toggle('active', t.dataset.filter === filter));
  renderNotes();
}

export function toggleNotePin() {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;
  note.pinned = !note.pinned;
  note.updatedAt = Date.now();
  renderNotes();
}

export function toggleNoteScope() {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;
  note.scope = note.scope === 'team' ? 'personal' : 'team';
  note.updatedAt = Date.now();
  renderNotes();
}

export async function deleteCurrentNote() {
  if (!confirm('Delete this note?')) return;
  const id = state.currentNoteId;
  try {
    if (id && id.startsWith('note-')) {
      // Local-only id (shouldn't happen after persistence), just remove
      state.notes = state.notes.filter(n => n.id !== id);
    } else if (id) {
      await deleteNoteRecord(id);
      state.notes = state.notes.filter(n => n.id !== id);
    }
    state.currentNoteId = null;
    renderNotes();
    showToast('Note deleted', 'success');
  } catch (err) {
    console.error('Failed to delete note', err);
    showToast('Failed to delete note', 'error');
  }
}

export async function saveNote() {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;
  const titleEl = getEl('noteTitleInput');
  const contentEl = getEl('noteContentInput');
  const updatedPayload = {
    title: titleEl ? titleEl.value : note.title,
    content: contentEl ? contentEl.value : note.content,
    scope: note.scope || 'personal',
    color: note.color || 'default',
    tags: note.tags || []
  };

  // Optimistic local update
  note.title = updatedPayload.title;
  note.content = updatedPayload.content;
  note.updatedAt = Date.now();
  renderNotes();

  if (!note.id) return;
  try {
    await updateNoteRecord(note.id, updatedPayload);
    showToast('Note saved', 'success');
  } catch (err) {
    console.error('Failed to save note', err);
    showToast('Failed to save note', 'error');
  }
}

export async function changeNoteColor(color) {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;
  // Optimistic UI
  note.color = color;
  note.updatedAt = Date.now();
  renderNotes();

  if (!note.id) return;
  try {
    await updateNoteRecord(note.id, { color });
    showToast('Note color updated', 'success');
  } catch (err) {
    console.error('Failed to update note color', err);
    showToast('Failed to update color', 'error');
  }
}

export function promptAddTag() {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;
  const tag = prompt('Add tag');
  if (!tag) return;
  note.tags = note.tags || [];
  if (!note.tags.includes(tag)) note.tags.push(tag);
  note.updatedAt = Date.now();
  renderNotes();
}

export function removeNoteTag(tag) {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;
  note.tags = (note.tags || []).filter(t => t !== tag);
  note.updatedAt = Date.now();
  renderNotes();
}

// Provide default export for legacy imports (if any)
export default {
  renderNotes,
  selectNote,
  addNote,
  filterNotes,
  setNotesFilter,
  toggleNotePin,
  toggleNoteScope,
  deleteCurrentNote,
  saveNote,
  changeNoteColor,
  promptAddTag,
  removeNoteTag
};
