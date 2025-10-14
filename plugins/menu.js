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

    // React dengan emoji jam pasir
    await sock.sendMessage(from, {
      react: { text: '⏳', key: msg.key }
    });

    await delay(500);

    const menuText = `
╭━━━〔 *${botName}* 〕━━━╮
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
├─ *Note (Simpan Teks/Media)*
│ • ${prefix}addnote [id] [teks]
│ • ${prefix}listnote
│ • ${prefix}note [id]
│ • ${prefix}delnote [id]
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
├─ *Google Drive*
│ • ${prefix}gdrive
│ • ${prefix}gupload [balas media/dokumen]
│ • ${prefix}glist
│ • ${prefix}gview [file_id]
│ • ${prefix}gdownload [file_id]
│ • ${prefix}gmkdir [nama_folder]
│ • ${prefix}gdelete [file_id]
│ • ${prefix}gsearch [keyword]
│ • ${prefix}gaddfolder [folder_id] [nama]
│ • ${prefix}gfolders
│ • ${prefix}gsetfolder [nomor]
│ • ${prefix}gremovefolder [nomor]
│
├─ *MEDIA & TOOLS*
│ • ${prefix}ytsearch [query]
│ • ${prefix}ytmp3 [url]
│ • ${prefix}tiktok [url]
│ • ${prefix}instagram [url]
│ • ${prefix}uploadimage [reply gambar]
│
├─ *System & Owner*
│ • ${prefix}stats
│ • ${prefix}backup
│ • ${prefix}edit [file] [teks]
│
╰━━━━━━━━━━━━━━━━━━━━╯
_Bot ini dibuat untuk memudahkan jadwal dan reminder sekolah_
`;

    await sock.sendMessage(from, { text: menuText });

    // React dengan emoji centang
    await sock.sendMessage(from, {
      react: { text: '✅', key: msg.key }
    });
  }
};
