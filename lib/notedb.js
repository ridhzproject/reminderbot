import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTE_DB_PATH = path.join(__dirname, 'notedb.json');
const MEDIA_DIR = path.join(__dirname, 'note_media');

let notedb = {
  notes: []
};

// Ensure media directory exists
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

export function initNoteDB() {
  try {
    if (fs.existsSync(NOTE_DB_PATH)) {
      const data = fs.readFileSync(NOTE_DB_PATH, 'utf8');
      notedb = { ...notedb, ...JSON.parse(data) };
      console.log('✓ Note database loaded');
    } else {
      saveNoteDB();
      console.log('✓ Note database created');
    }
  } catch (err) {
    console.error('Note database init error:', err);
  }
}

export function saveNoteDB() {
  try {
    fs.writeFileSync(NOTE_DB_PATH, JSON.stringify(notedb, null, 2));
  } catch (err) {
    console.error('Note database save error:', err);
  }
}

export function getNoteDB() {
  return notedb;
}

// Add note
export function addNote(id, type, content, mediaPath = null) {
  // Check if ID already exists
  const existing = notedb.notes.find(n => n.id === id);
  if (existing) {
    return { success: false, message: 'ID sudah digunakan!' };
  }

  const note = {
    id,
    type, // 'text', 'image', 'video', 'audio', 'document', 'sticker'
    content,
    mediaPath,
    createdAt: new Date().toISOString(),
    createdDate: new Date().toLocaleString('id-ID', { 
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'short'
    })
  };

  notedb.notes.push(note);
  saveNoteDB();
  
  return { success: true, message: 'Note berhasil disimpan!', note };
}

// Get note by ID
export function getNote(id) {
  return notedb.notes.find(n => n.id === id);
}

// Get all notes
export function getAllNotes() {
  return notedb.notes;
}

// Delete note
export function deleteNote(id) {
  const index = notedb.notes.findIndex(n => n.id === id);
  
  if (index === -1) {
    return { success: false, message: 'Note tidak ditemukan!' };
  }

  const note = notedb.notes[index];
  
  // Delete media file if exists
  if (note.mediaPath) {
    const fullPath = path.join(MEDIA_DIR, note.mediaPath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error('Error deleting media file:', err);
      }
    }
  }

  notedb.notes.splice(index, 1);
  saveNoteDB();
  
  return { success: true, message: 'Note berhasil dihapus!', note };
}

// Save media file
export function saveMediaFile(id, buffer, extension) {
  const filename = `${id}_${Date.now()}.${extension}`;
  const filepath = path.join(MEDIA_DIR, filename);
  
  try {
    fs.writeFileSync(filepath, buffer);
    return { success: true, filename };
  } catch (err) {
    console.error('Error saving media file:', err);
    return { success: false, error: err.message };
  }
}

// Get media file path
export function getMediaPath(filename) {
  return path.join(MEDIA_DIR, filename);
}

// Check if media file exists
export function mediaExists(filename) {
  return fs.existsSync(path.join(MEDIA_DIR, filename));
}
