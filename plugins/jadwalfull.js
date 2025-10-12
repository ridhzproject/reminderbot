import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: 'jadwalfull',
  description: 'Menampilkan jadwal lengkap (foto)',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const imagePath = path.join(__dirname, '..', 'lib', 'jadwalxia.png');
    
    // React with hourglass
    await sock.sendMessage(from, {
      react: { text: '⏳', key: msg.key }
    });
    
    await delay(500);
    
    if (!fs.existsSync(imagePath)) {
      await sock.sendMessage(from, { 
        text: '❌ File jadwal tidak ditemukan!' 
      });
      return;
    }
    
    try {
      await sock.sendMessage(from, {
        image: fs.readFileSync(imagePath),
        caption: '📚 *JADWAL LENGKAP SEKOLAH*'
      });
      
      // React with checkmark
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
    } catch (err) {
      console.error('Error sending image:', err);
      await sock.sendMessage(from, { 
        text: '❌ Gagal mengirim gambar jadwal!' 
      });
    }
  }
};
