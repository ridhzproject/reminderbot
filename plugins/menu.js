import dotenv from 'dotenv';
dotenv.config();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: 'menu',
  description: 'Menampilkan menu bot',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = process.env.BOT_NAME || 'Bot Sekolah';
    const prefix = process.env.PREFIX || '.';
    
    // React with hourglass
    await sock.sendMessage(from, {
      react: { text: '⏳', key: msg.key }
    });
    
    await delay(500);
    
    const menuText = `╭━━━『 *${botName}* 』━━━╮
│
│ 📚 *MENU UTAMA*
│
├─ *Jadwal Sekolah*
│ • ${prefix}jadwal [hari]
│ • ${prefix}jadwalfull
│
├─ *Catatan/Tugas*
│ • ${prefix}addre [teks]
│ • ${prefix}listre
│ • ${prefix}delre [nomor]
│
├─ *Pengingat Harian*
│ • ${prefix}addsubsre [nomor]
│ • ${prefix}listsubsre
│ • ${prefix}delsubsre [nomor]
│ • ${prefix}setsubsre [waktu]
│ • ${prefix}remindernow
│
├─ *Jadwal Sholat*
│ • ${prefix}jadwalsholat
│ • ${prefix}carikota [nama]
│ • ${prefix}setkotasholat [id]
│ • ${prefix}addsubsholat [nomor]
│ • ${prefix}listsubsholat
│ • ${prefix}delsubsholat [nomor]
│
├─ *Pengingat Tidur*
│ • ${prefix}addsubsleep [nomor]
│ • ${prefix}listsubsleep
│ • ${prefix}delsubsleep [nomor]
│
╰━━━━━━━━━━━━━━━━━╯

_Bot ini dibuat untuk memudahkan jadwal dan reminder sekolah_`;

    await sock.sendMessage(from, { text: menuText });
    
    // React with checkmark
    await sock.sendMessage(from, {
      react: { text: '✅', key: msg.key }
    });
  }
};
