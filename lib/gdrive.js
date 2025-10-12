import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { getActiveFolderId } from './gdriveConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let drive = null;
let isAuthenticated = false;

// Initialize Google Drive
export async function initGoogleDrive() {
  try {
    const credentialsPath = path.join(__dirname, 'credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.log('⚠️  Google Drive credentials not found. Please follow GOOGLE_DRIVE_SETUP.md');
      return false;
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const authClient = await auth.getClient();
    drive = google.drive({ version: 'v3', auth: authClient });
    
    isAuthenticated = true;
    console.log('✓ Google Drive initialized');
    return true;
  } catch (err) {
    console.error('Google Drive init error:', err.message);
    return false;
  }
}

// Check if authenticated
export function isGDriveReady() {
  return isAuthenticated;
}

// Get folder info
export async function getFolderInfo(folderId) {
  if (!drive) throw new Error('Google Drive not initialized');
  
  try {
    const response = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, createdTime, modifiedTime'
    });
    return response.data;
  } catch (err) {
    throw new Error('Failed to get folder info: ' + err.message);
  }
}

// Upload file to Google Drive
export async function uploadFile(buffer, filename, mimeType, folderId) {
  if (!drive) throw new Error('Google Drive not initialized');
  
  try {
    const stream = Readable.from(buffer);
    
    const fileMetadata = {
      name: filename,
      parents: [folderId]
    };

    const media = {
      mimeType: mimeType,
      body: stream
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime'
    });

    return response.data;
  } catch (err) {
    throw new Error('Upload failed: ' + err.message);
  }
}

// Download file from Google Drive
export async function downloadFile(fileId) {
  if (!drive) throw new Error('Google Drive not initialized');
  
  try {
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    
    return Buffer.from(response.data);
  } catch (err) {
    throw new Error('Download failed: ' + err.message);
  }
}

// Get file info
export async function getFileInfo(fileId) {
  if (!drive) throw new Error('Google Drive not initialized');
  
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime, owners'
    });
    return response.data;
  } catch (err) {
    throw new Error('Failed to get file info: ' + err.message);
  }
}

// List files in folder
export async function listFiles(folderId, pageSize = 20) {
  if (!drive) throw new Error('Google Drive not initialized');
  
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      pageSize: pageSize,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc'
    });
    
    return response.data.files;
  } catch (err) {
    throw new Error('Failed to list files: ' + err.message);
  }
}

// Create folder
export async function createFolder(folderName, parentFolderId) {
  if (!drive) throw new Error('Google Drive not initialized');
  
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink, createdTime'
    });

    return response.data;
  } catch (err) {
    throw new Error('Failed to create folder: ' + err.message);
  }
}

// Delete file/folder
export async function deleteFile(fileId) {
  if (!drive) throw new Error('Google Drive not initialized');
  
  try {
    await drive.files.delete({ fileId: fileId });
    return true;
  } catch (err) {
    throw new Error('Failed to delete: ' + err.message);
  }
}

// Search files
export async function searchFiles(query, folderId) {
  if (!drive) throw new Error('Google Drive not initialized');
  
  try {
    const searchQuery = `name contains '${query}' and '${folderId}' in parents and trashed=false`;
    
    const response = await drive.files.list({
      q: searchQuery,
      pageSize: 10,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
      orderBy: 'modifiedTime desc'
    });
    
    return response.data.files;
  } catch (err) {
    throw new Error('Search failed: ' + err.message);
  }
}

// Get storage quota
export async function getStorageQuota() {
  if (!drive) throw new Error('Google Drive not initialized');
  
  try {
    const response = await drive.about.get({
      fields: 'storageQuota, user'
    });
    
    return response.data;
  } catch (err) {
    throw new Error('Failed to get quota: ' + err.message);
  }
}

// Format file size
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Get current folder ID
export function getCurrentFolderId() {
  return getActiveFolderId();
}

// Get mime type icon
export function getMimeTypeIcon(mimeType) {
  if (!mimeType) return '📄';
  
  if (mimeType.includes('folder')) return '📁';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎥';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return '🗜️';
  if (mimeType.includes('text')) return '📃';
  
  return '📄';
}
