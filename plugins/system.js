import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import archiver from 'archiver';
import dotenv from 'dotenv';

dotenv.config();

// Helper function untuk format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
}

// Helper function untuk format memory
function formatMemory(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Fungsi untuk mengecek apakah user adalah owner
function isOwner(msg) {
  const ownerNumber = process.env.OWNER_NUMBER;
  if (!ownerNumber) {
    console.error("OWNER_NUMBER is not set in .env file.");
    return false;
  }
  const senderJid = msg.key.remoteJid;
  const senderNumber = senderJid.split('@')[0];
  return senderNumber === ownerNumber;
}


// COMMAND: .stats
const stats = {
  name: 'stats',
  description: 'Menampilkan status dan informasi bot',
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    // React with clock
    await sock.sendMessage(from, { react: { text: '📊', key: msg.key } });
    
    const startTime = Date.now();
    
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpu = os.cpus()[0];
    
    const latency = Date.now() - startTime;
    
    const statsText = `╭━━━『 *BOT STATS* 』━━━╮
│
├─ 💻 *Server Info*
│  • *OS*: ${os.type()} ${os.release()}
│  • *Platform*: ${os.platform()}
│  • *CPU*: ${cpu.model}
│  • *RAM*: ${formatMemory(usedMem)} / ${formatMemory(totalMem)}
│  • *Uptime*: ${formatUptime(os.uptime())}
│
├─ 🤖 *Bot Info*
│  • *Node.js*: ${process.version}
│  • *Bot Version*: 2.0.0
│  • *Prefix*: ${process.env.PREFIX || '.'}
│  • *Owner*: ${process.env.OWNER_NUMBER || 'Not Set'}
│
├─ ⚡ *Speed*
│  • *Response*: ${latency} ms
│
╰━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(from, { text: statsText });
  }
};


// COMMAND: .backup
const backup = {
  name: 'backup',
  description: 'Membuat backup seluruh file bot',
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    if (!isOwner(msg)) {
      return sock.sendMessage(from, { text: '❌ Perintah ini hanya untuk owner.' });
    }

    await sock.sendMessage(from, { text: '⏳ Sedang membuat file backup... Mohon tunggu.' });

    const outputFileName = `backup-${new Date().toISOString().slice(0, 10)}.zip`;
    const outputPath = path.join(process.cwd(), outputFileName);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Level kompresi tertinggi
    });

    output.on('close', async () => {
      console.log(`Backup created: ${outputFileName} (${archive.pointer()} total bytes)`);
      
      await sock.sendMessage(from, {
        document: { stream: fs.createReadStream(outputPath) },
        mimetype: 'application/zip',
        fileName: outputFileName
      });
      
      // Hapus file zip setelah dikirim
      await fs.unlink(outputPath);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(err);
      } else {
        throw err;
      }
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    // Menambahkan semua file dan folder kecuali yang dikecualikan
    archive.glob('**/*', {
      cwd: process.cwd(),
      ignore: [
        'node_modules/**',
        'package-lock.json',
        '.npm/**',
        'auth_info/**', // Folder sesi, sebaiknya jangan di-backup
        outputFileName // Jangan backup file itu sendiri
      ]
    });

    await archive.finalize();
  }
};


// COMMAND: .edit
const edit = {
  name: 'edit',
  description: 'Mengedit file bot (khusus owner)',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    if (!isOwner(msg)) {
      return sock.sendMessage(from, { text: '❌ Perintah ini hanya untuk owner.' });
    }

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: `Penggunaan salah.\nContoh: \n\n.edit plugins/menu.js [teks baru]`
      });
    }

    const filePath = args[0];
    const newContent = args.slice(1).join(' ');
    const fullPath = path.join(process.cwd(), filePath);

    try {
      // Cek apakah file ada
      await fs.access(fullPath);
      
      // Tulis konten baru ke file
      await fs.writeFile(fullPath, newContent, 'utf8');
      
      await sock.sendMessage(from, { text: `✅ Berhasil mengedit file: ${filePath}` });
      console.log(`File ${filePath} has been edited by owner.`);

    } catch (error) {
      if (error.code === 'ENOENT') {
        await sock.sendMessage(from, { text: `❌ Gagal: File tidak ditemukan di path "${filePath}".` });
      } else {
        console.error('File edit error:', error);
        await sock.sendMessage(from, { text: `❌ Terjadi kesalahan saat mengedit file: ${error.message}` });
      }
    }
  }
};


export { stats, backup, edit };

