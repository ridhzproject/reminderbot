import {
  isGDriveReady,
  getFolderInfo,
  uploadFile,
  downloadFile,
  getFileInfo,
  listFiles,
  createFolder,
  deleteFile,
  searchFiles,
  getStorageQuota,
  formatFileSize,
  getMimeTypeIcon,
  getCurrentFolderId
} from '../lib/gdrive.js';
import {
  addFolder,
  setActiveFolder,
  getAllFolders,
  removeFolder,
  getActiveFolderInfo
} from '../lib/gdriveConfig.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import dotenv from 'dotenv';

dotenv.config();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get file extension
function getExtension(mimetype, filename) {
  if (filename && filename.includes('.')) {
    return filename.split('.').pop();
  }
  
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  };
  
  return mimeMap[mimetype] || 'bin';
}

// gdrive (info)
const gdrive = {
  name: 'gdrive',
  description: 'Info Google Drive',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (!isGDriveReady()) {
      return await sock.sendMessage(from, {
        text: '❌ Google Drive belum dikonfigurasi!\n\nBaca: GOOGLE_DRIVE_SETUP.md'
      });
    }
    
    const FOLDER_ID = getCurrentFolderId();
    
    if (!FOLDER_ID) {
      return await sock.sendMessage(from, {
        text: '❌ Belum ada folder aktif!\n\nGunakan .gaddfolder untuk menambah folder'
      });
    }
    
    try {
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      const folderInfo = await getFolderInfo(FOLDER_ID);
      const quota = await getStorageQuota();
      const activeFolderInfo = getActiveFolderInfo();
      
      const used = parseInt(quota.storageQuota.usage);
      const limit = parseInt(quota.storageQuota.limit);
      const percentage = ((used / limit) * 100).toFixed(2);
      
      let text = '☁️ *GOOGLE DRIVE INFO*\n\n';
      text += `📁 Active Folder: ${activeFolderInfo?.name || folderInfo.name}\n`;
      text += `🆔 ID: ${folderInfo.id}\n\n`;
      text += `💾 *Storage:*\n`;
      text += `   Used: ${formatFileSize(used)}\n`;
      text += `   Limit: ${formatFileSize(limit)}\n`;
      text += `   Usage: ${percentage}%\n\n`;
      text += `👤 Account: ${quota.user.emailAddress}`;
      
      await sock.sendMessage(from, { text });
      
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error gdrive info:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};

// gupload
const gupload = {
  name: 'gupload',
  description: 'Upload file ke Google Drive',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const FOLDER_ID = getCurrentFolderId();
    
    if (!isGDriveReady() || !FOLDER_ID) {
      return await sock.sendMessage(from, {
        text: '❌ Google Drive belum dikonfigurasi!'
      });
    }
    
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMsg) {
      return await sock.sendMessage(from, {
        text: '❌ Reply media/dokumen yang ingin diupload!\n\nContoh: Reply foto lalu ketik .gupload'
      });
    }
    
    try {
      const messageType = Object.keys(quotedMsg)[0];
      
      if (!['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(messageType)) {
        return await sock.sendMessage(from, {
          text: '❌ Hanya support: gambar, video, audio, dokumen'
        });
      }
      
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      await sock.sendMessage(from, {
        text: '📤 Mengupload file ke Google Drive...'
      });
      
      // Download media
      const buffer = await downloadMediaMessage(
        { message: quotedMsg },
        'buffer',
        {},
        {
          logger: { level: 'silent' },
          reuploadRequest: sock.updateMediaMessage
        }
      );
      
      // Get file info
      const mimetype = quotedMsg[messageType].mimetype;
      const originalFilename = quotedMsg[messageType].fileName || '';
      const extension = getExtension(mimetype, originalFilename);
      
      // Generate filename
      const customName = args.join(' ');
      const filename = customName 
        ? `${customName}.${extension}` 
        : originalFilename || `file_${Date.now()}.${extension}`;
      
      // Upload to Google Drive
      const result = await uploadFile(buffer, filename, mimetype, FOLDER_ID);
      
      let text = '✅ *FILE UPLOADED*\n\n';
      text += `📄 Name: ${result.name}\n`;
      text += `📊 Size: ${formatFileSize(result.size)}\n`;
      text += `🔗 Link: ${result.webViewLink}\n`;
      text += `🆔 ID: ${result.id}`;
      
      await sock.sendMessage(from, { text });
      
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error gupload:', err);
      await sock.sendMessage(from, {
        text: '❌ Upload gagal: ' + err.message
      });
    }
  }
};

// glist
const glist = {
  name: 'glist',
  description: 'List file di Google Drive',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const FOLDER_ID = getCurrentFolderId();
    
    if (!isGDriveReady() || !FOLDER_ID) {
      return await sock.sendMessage(from, {
        text: '❌ Google Drive belum dikonfigurasi!'
      });
    }
    
    try {
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      const files = await listFiles(FOLDER_ID, 15);
      
      if (files.length === 0) {
        return await sock.sendMessage(from, {
          text: '📁 Folder kosong'
        });
      }
      
      let text = '📁 *FILE LIST*\n\n';
      
      files.forEach((file, i) => {
        const icon = getMimeTypeIcon(file.mimeType);
        const size = file.size ? formatFileSize(file.size) : '-';
        const date = new Date(file.createdTime).toLocaleDateString('id-ID');
        
        text += `${i + 1}. ${icon} *${file.name}*\n`;
        text += `   📊 ${size} | 📅 ${date}\n`;
        text += `   🆔 \`${file.id}\`\n\n`;
      });
      
      text += `\n💡 Gunakan: .gview [id] untuk lihat file`;
      
      await sock.sendMessage(from, { text });
      
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error glist:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};

// gview
const gview = {
  name: 'gview',
  description: 'View file info',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (!isGDriveReady()) {
      return await sock.sendMessage(from, {
        text: '❌ Google Drive belum dikonfigurasi!'
      });
    }
    
    if (args.length === 0) {
      return await sock.sendMessage(from, {
        text: '❌ Gunakan: gview [file_id]\n\nGunakan .glist untuk lihat daftar file'
      });
    }
    
    try {
      const fileId = args[0];
      
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      const fileInfo = await getFileInfo(fileId);
      const icon = getMimeTypeIcon(fileInfo.mimeType);
      
      let text = `${icon} *FILE INFO*\n\n`;
      text += `📄 Name: ${fileInfo.name}\n`;
      text += `📊 Size: ${formatFileSize(fileInfo.size)}\n`;
      text += `📅 Created: ${new Date(fileInfo.createdTime).toLocaleString('id-ID')}\n`;
      text += `🔄 Modified: ${new Date(fileInfo.modifiedTime).toLocaleString('id-ID')}\n`;
      text += `🔗 Link: ${fileInfo.webViewLink}\n`;
      text += `🆔 ID: ${fileInfo.id}`;
      
      await sock.sendMessage(from, { text });
      
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error gview:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};

// gdownload
const gdownload = {
  name: 'gdownload',
  description: 'Download file dari Google Drive',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (!isGDriveReady()) {
      return await sock.sendMessage(from, {
        text: '❌ Google Drive belum dikonfigurasi!'
      });
    }
    
    if (args.length === 0) {
      return await sock.sendMessage(from, {
        text: '❌ Gunakan: gdownload [file_id]\n\nGunakan .glist untuk lihat daftar file'
      });
    }
    
    try {
      const fileId = args[0];
      
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      await sock.sendMessage(from, {
        text: '📥 Mendownload file dari Google Drive...'
      });
      
      const fileInfo = await getFileInfo(fileId);
      const buffer = await downloadFile(fileId);
      
      // Send based on mime type
      if (fileInfo.mimeType.includes('image')) {
        await sock.sendMessage(from, {
          image: buffer,
          caption: `📄 ${fileInfo.name}\n📊 ${formatFileSize(fileInfo.size)}`
        });
      } else if (fileInfo.mimeType.includes('video')) {
        await sock.sendMessage(from, {
          video: buffer,
          caption: `📄 ${fileInfo.name}\n📊 ${formatFileSize(fileInfo.size)}`
        });
      } else if (fileInfo.mimeType.includes('audio')) {
        await sock.sendMessage(from, {
          audio: buffer,
          mimetype: fileInfo.mimeType
        });
      } else {
        await sock.sendMessage(from, {
          document: buffer,
          fileName: fileInfo.name,
          mimetype: fileInfo.mimeType,
          caption: `📄 ${fileInfo.name}\n📊 ${formatFileSize(fileInfo.size)}`
        });
      }
      
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error gdownload:', err);
      await sock.sendMessage(from, {
        text: '❌ Download gagal: ' + err.message
      });
    }
  }
};

// gmkdir
const gmkdir = {
  name: 'gmkdir',
  description: 'Buat folder baru',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const FOLDER_ID = getCurrentFolderId();
    
    if (!isGDriveReady() || !FOLDER_ID) {
      return await sock.sendMessage(from, {
        text: '❌ Google Drive belum dikonfigurasi!'
      });
    }
    
    if (args.length === 0) {
      return await sock.sendMessage(from, {
        text: '❌ Gunakan: gmkdir [nama_folder]\n\nContoh: gmkdir Tugas_Sekolah'
      });
    }
    
    try {
      const folderName = args.join(' ');
      
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      const result = await createFolder(folderName, FOLDER_ID);
      
      let text = '✅ *FOLDER CREATED*\n\n';
      text += `📁 Name: ${result.name}\n`;
      text += `🔗 Link: ${result.webViewLink}\n`;
      text += `🆔 ID: ${result.id}`;
      
      await sock.sendMessage(from, { text });
      
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error gmkdir:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};

// gdelete
const gdelete = {
  name: 'gdelete',
  description: 'Hapus file/folder',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (!isGDriveReady()) {
      return await sock.sendMessage(from, {
        text: '❌ Google Drive belum dikonfigurasi!'
      });
    }
    
    if (args.length === 0) {
      return await sock.sendMessage(from, {
        text: '❌ Gunakan: gdelete [file_id]\n\nGunakan .glist untuk lihat daftar file'
      });
    }
    
    try {
      const fileId = args[0];
      
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      const fileInfo = await getFileInfo(fileId);
      await deleteFile(fileId);
      
      let text = '✅ *FILE DELETED*\n\n';
      text += `📄 Name: ${fileInfo.name}\n`;
      text += `🆔 ID: ${fileId}`;
      
      await sock.sendMessage(from, { text });
      
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error gdelete:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};

// gsearch
const gsearch = {
  name: 'gsearch',
  description: 'Cari file',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const FOLDER_ID = getCurrentFolderId();
    
    if (!isGDriveReady() || !FOLDER_ID) {
      return await sock.sendMessage(from, {
        text: '❌ Google Drive belum dikonfigurasi!'
      });
    }
    
    if (args.length === 0) {
      return await sock.sendMessage(from, {
        text: '❌ Gunakan: gsearch [keyword]\n\nContoh: gsearch tugas'
      });
    }
    
    try {
      const query = args.join(' ');
      
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      const files = await searchFiles(query, FOLDER_ID);
      
      if (files.length === 0) {
        return await sock.sendMessage(from, {
          text: `🔍 Tidak ada hasil untuk: "${query}"`
        });
      }
      
      let text = `🔍 *SEARCH RESULTS*\nKeyword: "${query}"\n\n`;
      
      files.forEach((file, i) => {
        const icon = getMimeTypeIcon(file.mimeType);
        const size = file.size ? formatFileSize(file.size) : '-';
        
        text += `${i + 1}. ${icon} *${file.name}*\n`;
        text += `   📊 ${size}\n`;
        text += `   🆔 \`${file.id}\`\n\n`;
      });
      
      await sock.sendMessage(from, { text });
      
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error gsearch:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};

// Export semua
export default gdrive;
export { gupload, glist, gview, gdownload, gmkdir, gdelete, gsearch };

// gaddfolder - Tambah folder baru
export const gaddfolder = {
  name: 'gaddfolder',
  description: 'Tambah folder Google Drive',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (!isGDriveReady()) {
      return await sock.sendMessage(from, {
        text: '❌ Google Drive belum dikonfigurasi!'
      });
    }
    
    if (args.length === 0) {
      return await sock.sendMessage(from, {
        text: '❌ Gunakan: gaddfolder [folder_id] [nama]\n\nContoh: gaddfolder 1a2b3c4d5e6f My_Folder'
      });
    }
    
    try {
      const folderId = args[0];
      const folderName = args.slice(1).join(' ') || 'Unnamed Folder';
      
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      // Verify folder exists
      const folderInfo = await getFolderInfo(folderId);
      
      // Add to config
      const result = addFolder(folderId, folderName);
      
      if (result.success) {
        let text = '✅ *FOLDER ADDED*\n\n';
        text += `📁 Name: ${folderName}\n`;
        text += `☁️ Drive Name: ${folderInfo.name}\n`;
        text += `🆔 ID: ${folderId}\n\n`;
        text += `💡 Gunakan .gsetfolder untuk set sebagai aktif`;
        
        await sock.sendMessage(from, { text });
        
        await sock.sendMessage(from, {
          react: { text: '✅', key: msg.key }
        });
      } else {
        await sock.sendMessage(from, {
          text: '❌ ' + result.message
        });
      }
      
    } catch (err) {
      console.error('Error gaddfolder:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};

// gfolders - List semua folder
export const gfolders = {
  name: 'gfolders',
  description: 'List folder tersimpan',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      const folders = getAllFolders();
      const activeFolderId = getCurrentFolderId();
      
      if (folders.length === 0) {
        return await sock.sendMessage(from, {
          text: '📁 Belum ada folder tersimpan\n\nGunakan .gaddfolder untuk menambah'
        });
      }
      
      let text = '📁 *SAVED FOLDERS*\n\n';
      
      folders.forEach((folder, i) => {
        const isActive = folder.id === activeFolderId;
        const marker = isActive ? '✅' : '📂';
        const date = new Date(folder.addedAt).toLocaleDateString('id-ID');
        
        text += `${i + 1}. ${marker} *${folder.name}*\n`;
        text += `   🆔 \`${folder.id}\`\n`;
        text += `   📅 ${date}\n`;
        if (isActive) text += `   🎯 *ACTIVE*\n`;
        text += `\n`;
      });
      
      text += `\n💡 Gunakan .gsetfolder [nomor] untuk ganti`;
      
      await sock.sendMessage(from, { text });
      
      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      });
      
    } catch (err) {
      console.error('Error gfolders:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};

// gsetfolder - Set folder aktif
export const gsetfolder = {
  name: 'gsetfolder',
  description: 'Set folder aktif',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, {
        text: '❌ Gunakan: gsetfolder [nomor]\n\nGunakan .gfolders untuk lihat daftar'
      });
    }
    
    try {
      const index = parseInt(args[0]) - 1;
      const folders = getAllFolders();
      
      if (isNaN(index) || index < 0 || index >= folders.length) {
        return await sock.sendMessage(from, {
          text: '❌ Nomor tidak valid!'
        });
      }
      
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      const folder = folders[index];
      const result = setActiveFolder(folder.id);
      
      if (result.success) {
        let text = '✅ *FOLDER CHANGED*\n\n';
        text += `📁 Active Folder: ${folder.name}\n`;
        text += `🆔 ID: ${folder.id}`;
        
        await sock.sendMessage(from, { text });
        
        await sock.sendMessage(from, {
          react: { text: '✅', key: msg.key }
        });
      } else {
        await sock.sendMessage(from, {
          text: '❌ ' + result.message
        });
      }
      
    } catch (err) {
      console.error('Error gsetfolder:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};

// gremovefolder - Hapus folder dari list
export const gremovefolder = {
  name: 'gremovefolder',
  description: 'Hapus folder dari list',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    if (args.length === 0) {
      return await sock.sendMessage(from, {
        text: '❌ Gunakan: gremovefolder [nomor]\n\nGunakan .gfolders untuk lihat daftar'
      });
    }
    
    try {
      const index = parseInt(args[0]) - 1;
      const folders = getAllFolders();
      
      if (isNaN(index) || index < 0 || index >= folders.length) {
        return await sock.sendMessage(from, {
          text: '❌ Nomor tidak valid!'
        });
      }
      
      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      });
      
      const folder = folders[index];
      const result = removeFolder(folder.id);
      
      if (result.success) {
        let text = '✅ *FOLDER REMOVED*\n\n';
        text += `📁 Name: ${folder.name}\n`;
        text += `🆔 ID: ${folder.id}`;
        
        await sock.sendMessage(from, { text });
        
        await sock.sendMessage(from, {
          react: { text: '✅', key: msg.key }
        });
      } else {
        await sock.sendMessage(from, {
          text: '❌ ' + result.message
        });
      }
      
    } catch (err) {
      console.error('Error gremovefolder:', err);
      await sock.sendMessage(from, {
        text: '❌ Error: ' + err.message
      });
    }
  }
};
