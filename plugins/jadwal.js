import { getJadwal, formatJadwal } from '../lib/jadwal.js';
import moment from 'moment-timezone';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: 'jadwal',
  description: 'Menampilkan jadwal sekolah',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    // React with hourglass
    await sock.sendMessage(from, {
      react: { text: '⏳', key: msg.key }
    });
    
    await delay(500);
    
    let hari = args[0] || '';
    
    // Jika tidak ada argument, gunakan hari ini
    if (!hari) {
      const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
      const today = moment().tz('Asia/Jakarta');
      hari = days[today.day()];
    } else {
      hari = hari.toLowerCase();
    }
    
    const jadwal = getJadwal(hari);
    
    if (!jadwal) {
      await sock.sendMessage(from, {
        react: { text: '❌', key: msg.key }
      });
      return await sock.sendMessage(from, { 
        text: '❌ Hari tidak valid! Gunakan: senin, selasa, rabu, kamis, jumat, sabtu, minggu' 
      });
    }
    
    const text = formatJadwal(hari, jadwal);
    await sock.sendMessage(from, { text });
    
    // React with checkmark
    await sock.sendMessage(from, {
      react: { text: '✅', key: msg.key }
    });
  }
};
