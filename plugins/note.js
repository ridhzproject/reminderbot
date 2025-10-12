import { 
  addNote, 
  getNote, 
  getAllNotes, 
  deleteNote,
  saveMediaFile,
  getMediaPath,
  mediaExists
} from '../lib/notedb.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi helper untuk mendapatkan extension dari mimetype
function getExtension(mimetype) {
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/zip': 'zip'
  };
  return mimeMap[mimetype] || 'bin';
}

// addnote
const addnote = {
  name: 'addnote',
  description: 'Menyimpan note (teks/media)',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, { 
        text: '❌ Gunakan: addnote [id] [teks]\nAtau reply media dengan: addnote [id]' 
      });
    }
    
    try {
      const id = args[0];
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      // React with hourglass
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      await delay(500);
      
      // Check if replying to a media message
      if (quotedMsg) {
        const messageType = Object.keys(quotedMsg)[0];
        
        if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(messageType)) {
          // Download media
          const buffer = await downloadMediaMessage(
            { message: quotedMsg },
            'buffer',
            {},
            {
              logger: { level: 'silent' },
              reuploadRequest: sock.updateMediaMessage
            }
          );
          
          // Get mimetype and extension
          const mimetype = quotedMsg[messageType].mimetype;
          const extension = getExtension(mimetype);
          
          // Save media file
          const saveResult = saveMediaFile(id, buffer, extension);
          
          if (!saveResult.success) {
            return await sock.sendMessage(from, { 
              text: '❌ Gagal menyimpan media: ' + saveResult.error 
            });
          }
          
          // Determine media type
          let type = 'document';
          if (messageType === 'imageMessage') type = 'image';
          else if (messageType === 'videoMessage') type = 'video';
          else if (messageType === 'audioMessage') type = 'audio';
          else if (messageType === 'stickerMessage') type = 'sticker';
          
          // Get caption if exists
          const caption = quotedMsg[messageType].caption || '';
          
          // Add note
          const result = addNote(id, type, caption, saveResult.filename);
          
          if (result.success) {
            await sock.sendMessage(from, { 
              text: `✅ ${result.message}\n\n📌 ID: ${id}\n📁 Type: ${type}\n📅 ${result.note.createdDate}` 
            });
            
            // React with checkmark
            await sock.sendMessage(from, {
              react: { text: '✅', key: msg.key }
            });
          } else {
            await sock.sendMessage(from, { 
              text: '❌ ' + result.message 
            });
          }
          
          return;
        }
      }
      
      // Text note
      const text = args.slice(1).join(' ');
      
      if (!text) {
        return await sock.sendMessage(from, { 
          text: '❌ Teks tidak boleh kosong!' 
        });
      }
      
      const result = addNote(id, 'text', text);
      
      if (result.success) {
        await sock.sendMessage(from, { 
          text: `✅ ${result.message}\n\n📌 ID: ${id}\n📝 Type: text\n📅 ${result.note.createdDate}` 
        });
        
        // React with checkmark
        await sock.sendMessage(from, {
          react: { text: '✅', key: msg.key }
        });
      } else {
        await sock.sendMessage(from, { 
          text: '❌ ' + result.message 
        });
      }
      
    } catch (err) {
      console.error('Error addnote:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan: ' + err.message 
      });
    }
  }
};

// listnote
const listnote = {
  name: 'listnote',
  description: 'Melihat daftar note',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    try {
      // React with hourglass
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      await delay(500);
      
      const notes = getAllNotes();
      
      if (notes.length === 0) {
        return await sock.sendMessage(from, { 
          text: '📋 Belum ada note tersimpan.' 
        });
      }
      
      let text = '📋 *DAFTAR NOTE*\n\n';
      
      notes.forEach((note, i) => {
        const icon = {
          'text': '📝',
          'image': '🖼️',
          'video': '🎥',
          'audio': '🎵',
          'document': '📄',
          'sticker': '🎨'
        }[note.type] || '📎';
        
        text += `${i + 1}. ${icon} *${note.id}*\n`;
        text += `   Type: ${note.type}\n`;
        text += `   📅 ${note.createdDate}\n\n`;
      });
      
      text += `\n💡 Gunakan: .note [id] untuk melihat note`;
      
      await sock.sendMessage(from, { text });
      
      // React with checkmark
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error listnote:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan: ' + err.message 
      });
    }
  }
};

// note
const note = {
  name: 'note',
  description: 'Melihat note berdasarkan ID',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, { 
        text: '❌ Gunakan: note [id]\nContoh: note tugas1' 
      });
    }
    
    try {
      const id = args[0];
      
      // React with hourglass
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      await delay(500);
      
      const noteData = getNote(id);
      
      if (!noteData) {
        return await sock.sendMessage(from, { 
          text: '❌ Note tidak ditemukan!\n\nGunakan .listnote untuk melihat daftar note.' 
        });
      }
      
      const caption = `📌 *NOTE: ${id}*\n\n📅 ${noteData.createdDate}\n${noteData.content ? '\n📝 ' + noteData.content : ''}`;
      
      // Send based on type
      if (noteData.type === 'text') {
        await sock.sendMessage(from, { text: caption });
      } 
      else if (noteData.type === 'image') {
        const mediaPath = getMediaPath(noteData.mediaPath);
        if (mediaExists(noteData.mediaPath)) {
          await sock.sendMessage(from, {
            image: fs.readFileSync(mediaPath),
            caption: caption
          });
        } else {
          await sock.sendMessage(from, { 
            text: '❌ File media tidak ditemukan!' 
          });
        }
      }
      else if (noteData.type === 'video') {
        const mediaPath = getMediaPath(noteData.mediaPath);
        if (mediaExists(noteData.mediaPath)) {
          await sock.sendMessage(from, {
            video: fs.readFileSync(mediaPath),
            caption: caption
          });
        } else {
          await sock.sendMessage(from, { 
            text: '❌ File media tidak ditemukan!' 
          });
        }
      }
      else if (noteData.type === 'audio') {
        const mediaPath = getMediaPath(noteData.mediaPath);
        if (mediaExists(noteData.mediaPath)) {
          await sock.sendMessage(from, {
            audio: fs.readFileSync(mediaPath),
            mimetype: 'audio/mp4',
            ptt: false
          });
          await sock.sendMessage(from, { text: caption });
        } else {
          await sock.sendMessage(from, { 
            text: '❌ File media tidak ditemukan!' 
          });
        }
      }
      else if (noteData.type === 'sticker') {
        const mediaPath = getMediaPath(noteData.mediaPath);
        if (mediaExists(noteData.mediaPath)) {
          await sock.sendMessage(from, {
            sticker: fs.readFileSync(mediaPath)
          });
          await sock.sendMessage(from, { text: caption });
        } else {
          await sock.sendMessage(from, { 
            text: '❌ File media tidak ditemukan!' 
          });
        }
      }
      else if (noteData.type === 'document') {
        const mediaPath = getMediaPath(noteData.mediaPath);
        if (mediaExists(noteData.mediaPath)) {
          await sock.sendMessage(from, {
            document: fs.readFileSync(mediaPath),
            fileName: noteData.mediaPath,
            caption: caption
          });
        } else {
          await sock.sendMessage(from, { 
            text: '❌ File media tidak ditemukan!' 
          });
        }
      }
      
      // React with checkmark
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error note:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan: ' + err.message 
      });
    }
  }
};

// delnote
const delnote = {
  name: 'delnote',
  description: 'Menghapus note',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, { 
        text: '❌ Gunakan: delnote [id]\nContoh: delnote tugas1' 
      });
    }
    
    try {
      const id = args[0];
      
      // React with hourglass
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      await delay(500);
      
      const result = deleteNote(id);
      
      if (result.success) {
        await sock.sendMessage(from, { 
          text: `✅ ${result.message}\n\n📌 ID: ${id}\n📁 Type: ${result.note.type}` 
        });
        
        // React with checkmark
        await sock.sendMessage(from, {
          react: { text: '✅', key: msg.key }
        });
      } else {
        await sock.sendMessage(from, { 
          text: '❌ ' + result.message 
        });
      }
      
    } catch (err) {
      console.error('Error delnote:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan: ' + err.message 
      });
    }
  }
};

// Export semua
export default addnote;
export { listnote, note, delnote };
