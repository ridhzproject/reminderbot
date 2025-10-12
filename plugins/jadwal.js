import { getJadwal, formatJadwal } from '../lib/jadwal.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: 'jadwal',
  description: 'Menampilkan jadwal sekolah',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    let hari = args[0] || '';
    
    // Jika tidak ada argument, gunakan hari ini
    if (!hari) {
      const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
      const today = new Date();
      hari = days[today.getDay()];
    }
    
    const jadwal = getJadwal(hari);
    
    if (!jadwal) {
      return await sock.sendMessage(from, { 
        text: '❌ Hari tidak valid! Gunakan: senin, selasa, rabu, kamis, jumat, sabtu, minggu' 
      });
    }
    
    const text = formatJadwal(hari, jadwal);
    await sock.sendMessage(from, { text });
  }
};
