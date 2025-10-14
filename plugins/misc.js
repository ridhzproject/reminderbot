import { Downloader, Search, Tools } from 'abot-scraper';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

// Inisialisasi kelas dari abot-scraper sekali saja
const downloader = new Downloader();
const search = new Search();
const tools = new Tools();

// Fungsi bantuan untuk mengubah stream menjadi buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * ---------------------------------
 * YOUTUBE SEARCH
 * ---------------------------------
 */
export const ytsearch = {
  name: 'ytsearch',
  description: 'Mencari video di YouTube.',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const query = args.join(' ');

    if (!query) {
      await sock.sendMessage(from, { text: '❌ Silakan masukkan query pencarian.\nContoh: `.ytsearch phonk music`' }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

    try {
      const results = await search.ytSearch(query);
      if (!results.status || results.result.length === 0) {
        await sock.sendMessage(from, { text: '❌ Video tidak ditemukan.' }, { quoted: msg });
        return;
      }

      let reply = `🔎 *Hasil Pencarian YouTube untuk: ${query}*\n\n`;
      results.result.slice(0, 5).forEach((video, index) => {
        reply += `*${index + 1}. ${video.title}*\n`;
        reply += `• Durasi: ${video.duration}\n`;
        reply += `• Penonton: ${video.views}\n`;
        reply += `• Link: ${video.url}\n\n`;
      });

      await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error('YT Search Error:', error);
      await sock.sendMessage(from, { text: '❌ Terjadi kesalahan saat mencari video.' }, { quoted: msg });
    }
  }
};

/**
 * ---------------------------------
 * YOUTUBE MP3 DOWNLOADER
 * ---------------------------------
 */
export const ytmp3 = {
  name: 'ytmp3',
  description: 'Download audio dari video YouTube.',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const url = args[0];

    if (!url || !url.match(/youtu/)) {
      await sock.sendMessage(from, { text: '❌ Silakan masukkan URL YouTube yang valid.\nContoh: `.ytmp3 https://youtu.be/xxxx`' }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
    await sock.sendMessage(from, { text: 'Mengunduh audio, mohon tunggu...' }, { quoted: msg });

    try {
      const result = await downloader.ytMp3Downloader(url);
      if (!result.status) {
        await sock.sendMessage(from, { text: `❌ Gagal mengunduh audio: ${result.msg}` }, { quoted: msg });
        return;
      }

      await sock.sendMessage(from, {
        audio: { url: result.result.url },
        mimetype: 'audio/mpeg',
        fileName: `${result.result.title}.mp3`
      }, { quoted: msg });

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error('YT MP3 Error:', error);
      await sock.sendMessage(from, { text: '❌ Terjadi kesalahan saat mengunduh audio.' }, { quoted: msg });
    }
  }
};

/**
 * ---------------------------------
 * TIKTOK DOWNLOADER
 * ---------------------------------
 */
export const tiktok = {
  name: 'tiktok',
  description: 'Download video TikTok tanpa watermark.',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const url = args[0];

    if (!url || !url.match(/tiktok/)) {
      await sock.sendMessage(from, { text: '❌ Silakan masukkan URL TikTok yang valid.\nContoh: `.tiktok https://vt.tiktok.com/xxxx`' }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
    await sock.sendMessage(from, { text: 'Mengunduh video, mohon tunggu...' }, { quoted: msg });

    try {
      const result = await downloader.tiktokDownloader(url);
      if (!result.status) {
        await sock.sendMessage(from, { text: `❌ Gagal mengunduh video: ${result.msg}` }, { quoted: msg });
        return;
      }

      await sock.sendMessage(from, {
        video: { url: result.result.video },
        caption: result.result.title || 'Video TikTok'
      }, { quoted: msg });
      
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error('TikTok DL Error:', error);
      await sock.sendMessage(from, { text: '❌ Terjadi kesalahan saat mengunduh video TikTok.' }, { quoted: msg });
    }
  }
};

/**
 * ---------------------------------
 * INSTAGRAM DOWNLOADER
 * ---------------------------------
 */
export const instagram = {
  name: 'instagram',
  description: 'Download video atau foto dari Instagram.',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const url = args[0];

    if (!url || !url.match(/instagram.com/)) {
      await sock.sendMessage(from, { text: '❌ Silakan masukkan URL Instagram yang valid.\nContoh: `.instagram https://www.instagram.com/p/xxxx`' }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
    await sock.sendMessage(from, { text: 'Mengunduh media, mohon tunggu...' }, { quoted: msg });
    
    try {
      const result = await downloader.instagramDownloader(url);
      if (!result.status || result.result.length === 0) {
        await sock.sendMessage(from, { text: `❌ Gagal mengunduh media: ${result.msg || 'Tidak ada media ditemukan'}` }, { quoted: msg });
        return;
      }

      for (const media of result.result) {
        if (media.type === 'video') {
          await sock.sendMessage(from, { video: { url: media.url } }, { quoted: msg });
        } else {
          await sock.sendMessage(from, { image: { url: media.url } }, { quoted: msg });
        }
      }
      
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error('Instagram DL Error:', error);
      await sock.sendMessage(from, { text: '❌ Terjadi kesalahan saat mengunduh media Instagram.' }, { quoted: msg });
    }
  }
};


/**
 * ---------------------------------
 * IMAGE UPLOADER
 * ---------------------------------
 */
export const uploadimage = {
  name: 'uploadimage',
  description: 'Upload gambar dan dapatkan URL direct link.',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted || !quoted.imageMessage) {
      await sock.sendMessage(from, { text: '❌ Perintah salah. Balas (reply) sebuah gambar dengan perintah `.uploadimage`.' }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

    try {
      const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
      const buffer = await streamToBuffer(stream);
      
      const result = await tools.uploadImage(buffer);
      if (!result.status) {
        await sock.sendMessage(from, { text: `❌ Gagal mengunggah gambar: ${result.msg}` }, { quoted: msg });
        return;
      }
      
      await sock.sendMessage(from, { text: `✅ Gambar berhasil diunggah!\n\nURL: ${result.result.url}` }, { quoted: msg });
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error('Image Upload Error:', error);
      await sock.sendMessage(from, { text: '❌ Terjadi kesalahan saat mengunggah gambar.' }, { quoted: msg });
    }
  }
};
