import { 
  addSubscriberReminder, 
  getSubscribersReminder, 
  deleteSubscriberReminder,
  setReminderTime,
  getReminderTime
} from '../lib/database.js';
import { sendDailyReminder } from '../lib/reminder.js';

// Plugin addsubsre (default export)
export default {
  name: 'addsubsre',
  description: 'Menambah subscriber reminder',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    let number = args[0];
    
    // Jika tidak ada argument, gunakan nomor pengirim
    if (!number) {
      number = from;
    } else {
      // Format nomor
      number = number.replace(/[^0-9]/g, '');
      if (!number.includes('@')) {
        number = number + '@s.whatsapp.net';
      }
    }
    
    const success = addSubscriberReminder(number);
    
    if (success) {
      await sock.sendMessage(from, { 
        text: '✅ Berhasil subscribe reminder harian!' 
      });
    } else {
      await sock.sendMessage(from, { 
        text: '⚠️ Nomor sudah terdaftar!' 
      });
    }
  }
};

// Plugin listsubsre (named export)
export const listsubsre = {
  name: 'listsubsre',
  description: 'Melihat daftar subscriber reminder',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    try {
      const subscribers = getSubscribersReminder();
      
      if (subscribers.length === 0) {
        return await sock.sendMessage(from, { 
          text: '📋 Belum ada subscriber.' 
        });
      }
      
      let text = '📋 *DAFTAR SUBSCRIBER REMINDER:*\n\n';
      subscribers.forEach((s, i) => {
        text += `${i + 1}. ${s}\n`;
      });
      
      const reminderTime = getReminderTime();
      text += `\n⏰ Waktu pengiriman: ${reminderTime} WIB`;
      
      await sock.sendMessage(from, { text });
    } catch (err) {
      console.error('Error listsubsre:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan saat mengambil data subscriber.' 
      });
    }
  }
};

// Plugin delsubsre (named export)
export const delsubsre = {
  name: 'delsubsre',
  description: 'Menghapus subscriber reminder',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    let number = args[0];
    
    if (!number) {
      number = from;
    } else {
      number = number.replace(/[^0-9]/g, '');
      if (!number.includes('@')) {
        number = number + '@s.whatsapp.net';
      }
    }
    
    const success = deleteSubscriberReminder(number);
    
    if (success) {
      await sock.sendMessage(from, { 
        text: '✅ Berhasil unsubscribe reminder!' 
      });
    } else {
      await sock.sendMessage(from, { 
        text: '❌ Nomor tidak terdaftar!' 
      });
    }
  }
};

// Plugin setsubsre (named export)
export const setsubsre = {
  name: 'setsubsre',
  description: 'Mengatur waktu reminder',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, { 
        text: '❌ Gunakan: setsubsre [waktu]\nContoh: setsubsre 18:45' 
      });
    }
    
    const time = args[0];
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(time)) {
      return await sock.sendMessage(from, { 
        text: '❌ Format waktu salah! Gunakan format HH:MM\nContoh: 18:45' 
      });
    }
    
    setReminderTime(time);
    
    await sock.sendMessage(from, { 
      text: `✅ Waktu reminder berhasil diatur ke ${time} WIB\n\n⚠️ Bot perlu di-restart agar perubahan berlaku.` 
    });
  }
};

// Plugin remindernow (named export)
export const remindernow = {
  name: 'remindernow',
  description: 'Kirim reminder sekarang',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, { 
        text: '⏳ Mengirim reminder ke semua subscriber...' 
      });
      
      await sendDailyReminder(sock);
      
      await sock.sendMessage(from, { 
        text: '✅ Reminder berhasil dikirim!' 
      });
    } catch (err) {
      console.error('Error remindernow:', err);
      await sock.sendMessage(from, { 
        text: '❌ Gagal mengirim reminder: ' + err.message 
      });
    }
  }
};
