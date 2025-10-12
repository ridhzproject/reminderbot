import { 
  addReminder, 
  getReminders, 
  deleteReminder 
} from '../lib/database.js';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: 'addre',
  description: 'Menambah reminder',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, { 
        text: '❌ Gunakan: addre [teks catatan/tugas]' 
      });
    }
    
    // React with hourglass
    await sock.sendMessage(from, {
      react: { text: '⏳', key: msg.key }
    });
    
    await delay(500);
    
    const text = args.join(' ');
    addReminder(text);
    
    await sock.sendMessage(from, { 
      text: '✅ Catatan/tugas berhasil ditambahkan!' 
    });
    
    // React with checkmark
    await sock.sendMessage(from, {
      react: { text: '✅', key: msg.key }
    });
  }
};

export const listre = {
  name: 'listre',
  description: 'Melihat daftar reminder',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    // React with hourglass
    await sock.sendMessage(from, {
      react: { text: '⏳', key: msg.key }
    });
    
    await delay(500);
    
    const reminders = getReminders();
    
    if (reminders.length === 0) {
      await sock.sendMessage(from, { 
        text: '📝 Belum ada catatan/tugas.' 
      });
    } else {
      let text = '📝 *DAFTAR CATATAN/TUGAS:*\n\n';
      reminders.forEach((r, i) => {
        text += `${i + 1}. ${r.text}\n`;
      });
      await sock.sendMessage(from, { text });
    }
    
    // React with checkmark
    await sock.sendMessage(from, {
      react: { text: '✅', key: msg.key }
    });
  }
};

export const delre = {
  name: 'delre',
  description: 'Menghapus reminder',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, { 
        text: '❌ Gunakan: delre [nomor]' 
      });
    }
    
    // React with hourglass
    await sock.sendMessage(from, {
      react: { text: '⏳', key: msg.key }
    });
    
    await delay(500);
    
    const index = parseInt(args[0]);
    
    if (isNaN(index)) {
      return await sock.sendMessage(from, { 
        text: '❌ Nomor tidak valid!' 
      });
    }
    
    const success = deleteReminder(index);
    
    if (success) {
      await sock.sendMessage(from, { 
        text: '✅ Catatan/tugas berhasil dihapus!' 
      });
    } else {
      await sock.sendMessage(from, { 
        text: '❌ Nomor tidak ditemukan!' 
      });
    }
    
    // React with checkmark
    await sock.sendMessage(from, {
      react: { text: '✅', key: msg.key }
    });
  }
};
