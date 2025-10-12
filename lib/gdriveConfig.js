import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, 'gdriveConfig.json');

let config = {
  folders: [],
  activeFolder: null
};

// Initialize config
export function initGDriveConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      config = { ...config, ...JSON.parse(data) };
      console.log('✓ Google Drive config loaded');
    } else {
      // Set default from .env if exists
      const defaultFolder = process.env.GDRIVE_FOLDER_ID;
      if (defaultFolder) {
        config.folders.push({
          id: defaultFolder,
          name: 'Default Folder',
          addedAt: new Date().toISOString()
        });
        config.activeFolder = defaultFolder;
      }
      saveGDriveConfig();
      console.log('✓ Google Drive config created');
    }
  } catch (err) {
    console.error('Google Drive config init error:', err);
  }
}

// Save config
export function saveGDriveConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Google Drive config save error:', err);
  }
}

// Get active folder ID
export function getActiveFolderId() {
  return config.activeFolder || process.env.GDRIVE_FOLDER_ID;
}

// Add folder
export function addFolder(folderId, folderName) {
  const existing = config.folders.find(f => f.id === folderId);
  if (existing) {
    return { success: false, message: 'Folder sudah ada!' };
  }

  config.folders.push({
    id: folderId,
    name: folderName,
    addedAt: new Date().toISOString()
  });
  
  // Set as active if first folder
  if (!config.activeFolder) {
    config.activeFolder = folderId;
  }
  
  saveGDriveConfig();
  return { success: true, message: 'Folder berhasil ditambahkan!' };
}

// Set active folder
export function setActiveFolder(folderId) {
  const folder = config.folders.find(f => f.id === folderId);
  if (!folder) {
    return { success: false, message: 'Folder tidak ditemukan!' };
  }

  config.activeFolder = folderId;
  saveGDriveConfig();
  return { success: true, message: 'Folder aktif berhasil diubah!', folder };
}

// Get all folders
export function getAllFolders() {
  return config.folders;
}

// Remove folder
export function removeFolder(folderId) {
  const index = config.folders.findIndex(f => f.id === folderId);
  if (index === -1) {
    return { success: false, message: 'Folder tidak ditemukan!' };
  }

  const folder = config.folders[index];
  config.folders.splice(index, 1);

  // If active folder is removed, set first folder as active
  if (config.activeFolder === folderId) {
    config.activeFolder = config.folders.length > 0 ? config.folders[0].id : null;
  }

  saveGDriveConfig();
  return { success: true, message: 'Folder berhasil dihapus!', folder };
}

// Get active folder info
export function getActiveFolderInfo() {
  const folderId = getActiveFolderId();
  if (!folderId) return null;
  
  return config.folders.find(f => f.id === folderId) || {
    id: folderId,
    name: 'Default Folder',
    addedAt: new Date().toISOString()
  };
}
