import {
  addSubscriberSleep,
  getSubscribersSleep,
  deleteSubscriberSleep
} from '../lib/database.js';

// Plugin addsubsleep (default export)
export default {
  name: 'addsubsleep',
  description: 'Subscribe reminder tidur',
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
    
    const success = addSubscriberSleep(number);
    
    if (success) {
      await sock.sendMessage(from, { 
        text: '✅ Berhasil subscribe reminder tidur!\n\n⏰ Reminder akan dikirim sekitar jam 21:00-21:35 WIB' 
      });
    } else {
      await sock.sendMessage(from, { 
        text: '⚠️ Nomor sudah terdaftar!' 
      });
    }
  }
};

// Plugin listsubsleep (named export)
export const listsubsleep = {
  name: 'listsubsleep',
  description: 'List subscriber tidur',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    try {
      const subscribers = getSubscribersSleep();
      
      if (subscribers.length === 0) {
        return await sock.sendMessage(from, { 
          text: '📋 Belum ada subscriber.' 
        });
      }
      
      let text = '📋 *DAFTAR SUBSCRIBER TIDUR:*\n\n';
      subscribers.forEach((s, i) => {
        text += `${i + 1}. ${s}\n`;
      });
      text += `\n⏰ Waktu pengiriman: 21:00 - 21:35 WIB`;
      
      await sock.sendMessage(from, { text });
    } catch (err) {
      console.error('Error listsubsleep:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan saat mengambil data subscriber.' 
      });
    }
  }
};

// Plugin delsubsleep (named export)
export const delsubsleep = {
  name: 'delsubsleep',
  description: 'Unsubscribe reminder tidur',
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
    
    const success = deleteSubscriberSleep(number);
    
    if (success) {
      await sock.sendMessage(from, { 
        text: '✅ Berhasil unsubscribe reminder tidur!' 
      });
    } else {
      await sock.sendMessage(from, { 
        text: '❌ Nomor tidak terdaftar!' 
      });
    }
  }
};
