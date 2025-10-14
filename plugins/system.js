// plugins/system.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Waktu bot dimulai
const botStartTime = Date.now();

/**
 * Format bytes ke ukuran yang mudah dibaca
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format durasi waktu
 */
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

/**
 * Membuat backup dalam format ZIP
 */
async function createBackup() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFileName = `backup-${timestamp}.zip`;
    const backupPath = path.join(__dirname, '..', backupFileName);

    // Eksklusi folder dan file
    const excludes = [
        'node_modules',
        'package-lock.json',
        '.npm',
        '.git',
        'auth_info_baileys',
        '*.zip',
        '*.log'
    ].map(e => `-x "${e}"`).join(' ');

    try {
        // Gunakan zip command (Linux/Mac) atau 7z (Windows alternative)
        const projectRoot = path.join(__dirname, '..');
        const command = process.platform === 'win32'
            ? `powershell Compress-Archive -Path "${projectRoot}\\*" -DestinationPath "${backupPath}" -Force -CompressionLevel Optimal`
            : `cd "${projectRoot}" && zip -r "${backupFileName}" . ${excludes}`;

        console.log(`[System] Membuat backup dengan command: ${command}`);
        
        const { stdout, stderr } = await execPromise(command, { 
            maxBuffer: 1024 * 1024 * 50 // 50MB buffer
        });
        
        if (stderr && !stderr.includes('adding:')) {
            console.warn(`[System] Warning saat backup: ${stderr}`);
        }

        // Cek apakah file berhasil dibuat
        if (fs.existsSync(backupPath)) {
            const stats = fs.statSync(backupPath);
            return {
                success: true,
                path: backupPath,
                filename: backupFileName,
                size: formatBytes(stats.size)
            };
        } else {
            throw new Error('File backup tidak ditemukan setelah proses selesai');
        }
    } catch (error) {
        console.error('[System] Error membuat backup:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Mendapatkan informasi sistem
 */
function getSystemStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCount = cpus.length;

    const uptime = process.uptime() * 1000; // Bot uptime
    const systemUptime = os.uptime() * 1000; // System uptime

    return {
        // Memory
        totalMemory: formatBytes(totalMem),
        usedMemory: formatBytes(usedMem),
        freeMemory: formatBytes(freeMem),
        memUsagePercent: memUsagePercent,

        // CPU
        cpuModel: cpuModel,
        cpuCores: cpuCount,
        cpuUsage: process.cpuUsage(),

        // Uptime
        botUptime: formatUptime(uptime),
        systemUptime: formatUptime(systemUptime),

        // Platform
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,

        // Process
        pid: process.pid,
        processMemory: formatBytes(process.memoryUsage().heapUsed)
    };
}

/**
 * Edit file
 */
async function editFile(filePath, content) {
    try {
        const fullPath = path.join(__dirname, '..', filePath);

        // Validasi path (keamanan)
        if (!fullPath.startsWith(path.join(__dirname, '..'))) {
            throw new Error('Path tidak valid (keamanan)');
        }

        // Cek apakah file ada
        if (!fs.existsSync(fullPath)) {
            throw new Error('File tidak ditemukan');
        }

        // Backup file asli
        const backupPath = `${fullPath}.backup`;
        fs.copyFileSync(fullPath, backupPath);

        // Tulis konten baru
        fs.writeFileSync(fullPath, content, 'utf8');

        return {
            success: true,
            path: fullPath,
            backupPath: backupPath
        };
    } catch (error) {
        console.error('[System] Error edit file:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Lihat isi file
 */
function viewFile(filePath) {
    try {
        const fullPath = path.join(__dirname, '..', filePath);

        // Validasi path
        if (!fullPath.startsWith(path.join(__dirname, '..'))) {
            throw new Error('Path tidak valid (keamanan)');
        }

        if (!fs.existsSync(fullPath)) {
            throw new Error('File tidak ditemukan');
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        const stats = fs.statSync(fullPath);

        return {
            success: true,
            content: content,
            size: formatBytes(stats.size),
            lines: content.split('\n').length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Handler untuk command .backup
 */
async function handleBackupCommand(sock, sender, forwardContext, adminJid) {
    if (sender !== adminJid) {
        await sock.sendMessage(sender, {
            text: '❌ Hanya admin yang dapat menggunakan fitur ini.',
            contextInfo: forwardContext
        });
        return;
    }

    await sock.sendMessage(sender, {
        text: '⏳ Sedang membuat backup... Harap tunggu...',
        contextInfo: forwardContext
    });

    const startTime = Date.now();
    const result = await createBackup();
    const duration = Date.now() - startTime;

    if (result.success) {
        try {
            // Kirim file backup
            await sock.sendMessage(sender, {
                document: { url: result.path },
                fileName: result.filename,
                mimetype: 'application/zip',
                caption: `✅ *Backup Berhasil!*

📦 File: ${result.filename}
📊 Size: ${result.size}
⏱️ Waktu: ${(duration / 1000).toFixed(2)}s

Backup ini tidak termasuk:
- node_modules
- package-lock.json
- .npm
- .git
- auth_info_baileys
- file .zip lainnya`,
                contextInfo: forwardContext
            });

            // Hapus file backup setelah dikirim (opsional)
            setTimeout(() => {
                if (fs.existsSync(result.path)) {
                    fs.unlinkSync(result.path);
                    console.log(`[System] File backup ${result.filename} dihapus`);
                }
            }, 60000); // Hapus setelah 1 menit

        } catch (error) {
            console.error('[System] Error mengirim backup:', error);
            await sock.sendMessage(sender, {
                text: `❌ Backup berhasil dibuat tetapi gagal dikirim.\nFile tersimpan di: ${result.filename}\n\nError: ${error.message}`,
                contextInfo: forwardContext
            });
        }
    } else {
        await sock.sendMessage(sender, {
            text: `❌ Gagal membuat backup!\n\nError: ${result.error}`,
            contextInfo: forwardContext
        });
    }
}

/**
 * Handler untuk command .stats
 */
async function handleStatsCommand(sock, sender, forwardContext, adminJid) {
    const startTime = Date.now();
    const stats = getSystemStats();
    const responseTime = Date.now() - startTime;

    const statsText = `📊 *STATUS SERVER & BOT*

🖥️ *Sistem*
• Platform: ${stats.platform} (${stats.arch})
• CPU: ${stats.cpuModel}
• Cores: ${stats.cpuCores}
• Node.js: ${stats.nodeVersion}

💾 *Memory*
• Total: ${stats.totalMemory}
• Digunakan: ${stats.usedMemory} (${stats.memUsagePercent}%)
• Tersedia: ${stats.freeMemory}
• Bot Memory: ${stats.processMemory}

⏱️ *Uptime*
• Bot: ${stats.botUptime}
• Server: ${stats.systemUptime}

⚡ *Performance*
• Response Time: ${responseTime}ms
• Process ID: ${stats.pid}

🤖 *Info Bot*
• Status: Online ✅
• Waktu Mulai: ${new Date(botStartTime).toLocaleString('id-ID')}`;

    await sock.sendMessage(sender, {
        text: statsText,
        contextInfo: forwardContext
    });
}

/**
 * Handler untuk command .edit
 */
async function handleEditCommand(sock, sender, args, msg, forwardContext, adminJid) {
    if (sender !== adminJid) {
        await sock.sendMessage(sender, {
            text: '❌ Hanya admin yang dapat menggunakan fitur ini.',
            contextInfo: forwardContext
        });
        return;
    }

    if (args.length === 0) {
        await sock.sendMessage(sender, {
            text: `📝 *CARA PENGGUNAAN EDIT*

*Format 1: Edit dengan teks*
\`.edit [file] [konten]\`

*Format 2: Edit dengan reply*
Reply pesan yang berisi kode, lalu ketik:
\`.edit [file]\`

*Contoh:*
\`.edit index.js const test = 123;\`
atau reply pesan kode lalu:
\`.edit plugins/test.js\`

*Format 3: Lihat isi file*
\`.edit view [file]\`

Contoh: \`.edit view index.js\``,
            contextInfo: forwardContext
        });
        return;
    }

    // Fitur VIEW file
    if (args[0].toLowerCase() === 'view') {
        if (!args[1]) {
            await sock.sendMessage(sender, {
                text: '❌ Format salah!\nGunakan: `.edit view [file]`',
                contextInfo: forwardContext
            });
            return;
        }

        const result = viewFile(args[1]);
        if (result.success) {
            // Batasi panjang konten untuk WhatsApp
            let content = result.content;
            if (content.length > 60000) {
                content = content.substring(0, 60000) + '\n\n... (konten dipotong, terlalu panjang)';
            }

            await sock.sendMessage(sender, {
                text: `📄 *File: ${args[1]}*\n📊 Size: ${result.size}\n📏 Lines: ${result.lines}\n\n\`\`\`\n${content}\n\`\`\``,
                contextInfo: forwardContext
            });
        } else {
            await sock.sendMessage(sender, {
                text: `❌ Gagal membaca file!\n\nError: ${result.error}`,
                contextInfo: forwardContext
            });
        }
        return;
    }

    const filePath = args[0];
    let content = '';

    // Cek apakah ada quoted message
    const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quotedMessage) {
        // Ambil konten dari pesan yang direply
        if (quotedMessage.conversation) {
            content = quotedMessage.conversation;
        } else if (quotedMessage.extendedTextMessage?.text) {
            content = quotedMessage.extendedTextMessage.text;
        }
    } else {
        // Ambil konten dari args
        content = args.slice(1).join(' ');
    }

    if (!content) {
        await sock.sendMessage(sender, {
            text: '❌ Konten tidak boleh kosong!\nReply pesan yang berisi kode atau tulis langsung setelah nama file.',
            contextInfo: forwardContext
        });
        return;
    }

    await sock.sendMessage(sender, {
        text: '⏳ Mengedit file... Harap tunggu...',
        contextInfo: forwardContext
    });

    const result = await editFile(filePath, content);

    if (result.success) {
        await sock.sendMessage(sender, {
            text: `✅ *File Berhasil Diedit!*

📄 File: ${filePath}
💾 Backup: ${path.basename(result.backupPath)}

⚠️ Restart bot untuk menerapkan perubahan:
\`pm2 restart bot\` atau \`node index.js\``,
            contextInfo: forwardContext
        });
    } else {
        await sock.sendMessage(sender, {
            text: `❌ Gagal mengedit file!\n\nError: ${result.error}`,
            contextInfo: forwardContext
        });
    }
}

/**
 * Handler untuk command .listfiles
 */
async function handleListFilesCommand(sock, sender, args, forwardContext, adminJid) {
    if (sender !== adminJid) {
        await sock.sendMessage(sender, {
            text: '❌ Hanya admin yang dapat menggunakan fitur ini.',
            contextInfo: forwardContext
        });
        return;
    }

    const dirPath = args[0] || '.';
    const fullPath = path.join(__dirname, '..', dirPath);

    try {
        if (!fs.existsSync(fullPath)) {
            throw new Error('Direktori tidak ditemukan');
        }

        const items = fs.readdirSync(fullPath);
        const exclude = ['node_modules', '.git', 'auth_info_baileys', '.npm'];
        
        const filtered = items.filter(item => !exclude.includes(item));
        
        let listText = `📁 *Daftar File di: ${dirPath}*\n\n`;
        
        filtered.forEach(item => {
            const itemPath = path.join(fullPath, item);
            const stats = fs.statSync(itemPath);
            const icon = stats.isDirectory() ? '📁' : '📄';
            const size = stats.isFile() ? ` (${formatBytes(stats.size)})` : '';
            listText += `${icon} ${item}${size}\n`;
        });

        listText += `\n💡 Total: ${filtered.length} items`;

        await sock.sendMessage(sender, {
            text: listText,
            contextInfo: forwardContext
        });
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ Error: ${error.message}`,
            contextInfo: forwardContext
        });
    }
}

/**
 * Register plugin
 */
function register(sock, getState, setState) {
    const state = getState();
    const adminJid = state.adminJid;

    return {
        handleBackupCommand: (sock, sender, forwardContext) => 
            handleBackupCommand(sock, sender, forwardContext, adminJid),
        
        handleStatsCommand: (sock, sender, forwardContext) => 
            handleStatsCommand(sock, sender, forwardContext, adminJid),
        
        handleEditCommand: (sock, sender, args, msg, forwardContext) => 
            handleEditCommand(sock, sender, args, msg, forwardContext, adminJid),
        
        handleListFilesCommand: (sock, sender, args, forwardContext) => 
            handleListFilesCommand(sock, sender, args, forwardContext, adminJid)
    };
}

module.exports = { register };
