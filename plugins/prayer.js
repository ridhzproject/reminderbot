import axios from 'axios';
import moment from 'moment-timezone';
import {
  addSubscriberPrayer,
  getSubscribersPrayer,
  deleteSubscriberPrayer,
  setPrayerKota,
  getPrayerSettings
} from '../lib/database.js';

// jadwalsholat
const jadwalsholat = {
  name: 'jadwalsholat',
  description: 'Melihat jadwal sholat',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    try {
      const settings = getPrayerSettings();
      const today = moment().tz('Asia/Jakarta').format('YYYY/MM/DD');
      
      const response = await axios.get(
        `https://api.myquran.com/v2/sholat/jadwal/${settings.kotaId}/${today}`,
        { timeout: 10000 }
      );
      
      if (!response.data.status) {
        return await sock.sendMessage(from, { 
          text: '❌ Gagal mengambil jadwal sholat!' 
        });
      }
      
      const data = response.data.data;
      const jadwal = data.jadwal;
      
      let text = `🕌 *JADWAL SHOLAT*\n\n`;
      text += `📍 ${data.lokasi}, ${data.daerah}\n`;
      text += `📅 ${jadwal.tanggal}\n\n`;
      text += `🌅 Imsak: ${jadwal.imsak}\n`;
      text += `🌄 Subuh: ${jadwal.subuh}\n`;
      text += `☀️ Terbit: ${jadwal.terbit}\n`;
      text += `🌤️ Dhuha: ${jadwal.dhuha}\n`;
      text += `🌞 Dzuhur: ${jadwal.dzuhur}\n`;
      text += `🌤️ Ashar: ${jadwal.ashar}\n`;
      text += `🌆 Maghrib: ${jadwal.maghrib}\n`;
      text += `🌙 Isya: ${jadwal.isya}\n`;
      
      await sock.sendMessage(from, { text });
    } catch (err) {
      console.error('Prayer schedule error:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan saat mengambil jadwal sholat!\n\nError: ' + err.message 
      });
    }
  }
};

// carikota
const carikota = {
  name: 'carikota',
  description: 'Mencari ID kota',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, { 
        text: '❌ Gunakan: carikota [nama kota]\nContoh: carikota kediri' 
      });
    }
    
    try {
      const kota = args.join(' ').toLowerCase();
      
      await sock.sendMessage(from, { 
        text: '🔍 Mencari kota "' + kota + '"...' 
      });
      
      const response = await axios.get(
        `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(kota)}`,
        { timeout: 10000 }
      );
      
      console.log('Carikota response:', response.data);
      
      if (!response.data || !response.data.status) {
        return await sock.sendMessage(from, { 
          text: '❌ Gagal menghubungi API!' 
        });
      }
      
      if (!response.data.data || response.data.data.length === 0) {
        return await sock.sendMessage(from, { 
          text: `❌ Kota "${kota}" tidak ditemukan!\n\nCoba dengan kata kunci lain.` 
        });
      }
      
      let text = `🔍 *HASIL PENCARIAN KOTA*\n`;
      text += `Kata kunci: "${kota}"\n\n`;
      
      response.data.data.forEach((k, i) => {
        text += `${i + 1}. ${k.lokasi}\n`;
        text += `   📌 ID: ${k.id}\n\n`;
      });
      
      text += `💡 Cara menggunakan:\n`;
      text += `.setkotasholat ${response.data.data[0].id}`;
      
      await sock.sendMessage(from, { text });
    } catch (err) {
      console.error('Search city error:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan!\n\n' + err.message 
      });
    }
  }
};

// setkotasholat
const setkotasholat = {
  name: 'setkotasholat',
  description: 'Mengatur kota untuk jadwal sholat',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, { 
        text: '❌ Gunakan: setkotasholat [id kota]\n\nGunakan .carikota untuk mencari ID kota' 
      });
    }
    
    try {
      const kotaId = args[0];
      const today = moment().tz('Asia/Jakarta').format('YYYY/MM/DD');
      
      const response = await axios.get(
        `https://api.myquran.com/v2/sholat/jadwal/${kotaId}/${today}`,
        { timeout: 10000 }
      );
      
      if (!response.data.status) {
        return await sock.sendMessage(from, { 
          text: '❌ ID kota tidak valid!' 
        });
      }
      
      const data = response.data.data;
      setPrayerKota(kotaId, data.lokasi);
      
      await sock.sendMessage(from, { 
        text: `✅ Kota berhasil diatur!\n\n📍 ${data.lokasi}, ${data.daerah}` 
      });
    } catch (err) {
      console.error('Set city error:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan!\n\n' + err.message 
      });
    }
  }
};

// addsubsholat
const addsubsholat = {
  name: 'addsubsholat',
  description: 'Subscribe reminder sholat',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    try {
      let number = args[0];
      
      if (!number) {
        number = from;
      } else {
        number = number.replace(/[^0-9]/g, '');
        if (!number.includes('@')) {
          number = number + '@s.whatsapp.net';
        }
      }
      
      const success = addSubscriberPrayer(number);
      
      if (success) {
        await sock.sendMessage(from, { 
          text: `✅ Berhasil subscribe reminder sholat!\n\n📱 Nomor: ${number}` 
        });
      } else {
        await sock.sendMessage(from, { 
          text: '⚠️ Nomor sudah terdaftar!' 
        });
      }
    } catch (err) {
      console.error('Error addsubsholat:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan: ' + err.message 
      });
    }
  }
};

// listsubsholat
const listsubsholat = {
  name: 'listsubsholat',
  description: 'List subscriber sholat',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    try {
      const subscribers = getSubscribersPrayer();
      
      if (subscribers.length === 0) {
        return await sock.sendMessage(from, { 
          text: '📋 Belum ada subscriber.' 
        });
      }
      
      let text = '📋 *DAFTAR SUBSCRIBER SHOLAT:*\n\n';
      subscribers.forEach((s, i) => {
        text += `${i + 1}. ${s}\n`;
      });
      
      await sock.sendMessage(from, { text });
    } catch (err) {
      console.error('Error listsubsholat:', err);
      await sock.sendMessage(from, { 
        text: '❌ Terjadi kesalahan: ' + err.message 
      });
    }
  }
};

// delsubsholat
const delsubsholat = {
  name: 'delsubsholat',
  description: 'Unsubscribe reminder sholat',
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
    
    const success = deleteSubscriberPrayer(number);
    
    if (success) {
      await sock.sendMessage(from, { 
        text: '✅ Berhasil unsubscribe reminder sholat!' 
      });
    } else {
      await sock.sendMessage(from, { 
        text: '❌ Nomor tidak terdaftar!' 
      });
    }
  }
};

// Export semua
export default jadwalsholat;
export { carikota, setkotasholat, addsubsholat, listsubsholat, delsubsholat };
