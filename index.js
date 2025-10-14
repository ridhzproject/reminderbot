import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys';
import pino from 'pino';
import dotenv from 'dotenv';
import cron from 'node-cron';
import os from 'os';
import { initDB } from './lib/database.js';
import { initNoteDB } from './lib/notedb.js';
import { initGoogleDrive } from './lib/gdrive.js';
import { initGDriveConfig } from './lib/gdriveConfig.js';
import { 
  sendDailyReminder, 
  sendPrayerReminder, 
  sendSleepReminder,
  sendLessonReminder
} from './lib/reminder.js';
import { loadAllCommands } from './lib/commandLoader.js';

dotenv.config();

const PREFIX = process.env.PREFIX || '.';
let commands = new Map();

// Fungsi untuk sleep/delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi untuk mendapatkan uptime dalam format yang bagus
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '0m';
}

// Fungsi untuk format memory
function formatMemory(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

// Splash screen seperti neofetch
async function showSplashScreen() {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    white: '\x1b[37m'
  };

  const logo = `
${colors.cyan}${colors.bright}
    ██╗    ██╗██╗  ██╗ █████╗ ████████╗███████╗ █████╗ ██████╗ ██████╗ 
    ██║    ██║██║  ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗
    ██║ █╗ ██║███████║███████║   ██║   ███████╗███████║██████╔╝██████╔╝
    ██║███╗██║██╔══██║██╔══██║   ██║   ╚════██║██╔══██║██╔═══╝ ██╔═══╝ 
    ╚███╔███╔╝██║  ██║██║  ██║   ██║   ███████║██║  ██║██║     ██║     
     ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝     
${colors.reset}`;

  const sysInfo = {
    'OS': `${os.type()} ${os.release()}`,
    'Platform': os.platform(),
    'Architecture': os.arch(),
    'CPU': os.cpus()[0].model,
    'Cores': os.cpus().length,
    'Memory': `${formatMemory(os.totalmem() - os.freemem())} / ${formatMemory(os.totalmem())}`,
    'Uptime': formatUptime(os.uptime()),
    'Node Version': process.version,
    'Bot Version': '2.0.0',
    'Owner': process.env.OWNER_NUMBER || 'Not Set'
  };

  console.clear();
  console.log(logo);
  console.log(`${colors.green}${colors.bright}    WhatsApp Bot - School Assistant${colors.reset}`);
  console.log(`${colors.yellow}    ════════════════════════════════════════════════════════════${colors.reset}\n`);

  const maxKeyLength = Math.max(...Object.keys(sysInfo).map(k => k.length));
  
  for (const [key, value] of Object.entries(sysInfo)) {
    const padding = ' '.repeat(maxKeyLength - key.length);
    console.log(`    ${colors.cyan}${key}${padding}${colors.reset} ${colors.white}:${colors.reset} ${colors.magenta}${value}${colors.reset}`);
  }

  console.log(`\n${colors.yellow}    ════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}${colors.bright}    🚀 Initializing bot in 4 seconds...${colors.reset}\n`);
  
  await sleep(4000);
}

// Load plugins
async function loadPlugins() {
  try {
    commands = loadAllCommands();
    console.log(`✓ Loaded ${commands.size} commands`);
    return true;
  } catch (err) {
    console.error('Failed to load commands:', err);
    return false;
  }
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    }
  });

  // Pairing code
  if (!sock.authState.creds.registered) {
    const phoneNumber = process.env.BOT_NUMBER.replace(/[^0-9]/g, '');
    
    setTimeout(async () => {
      const code = await sock.requestPairingCode(phoneNumber);
      console.log(`\n🔐 Pairing Code: ${code}\n`);
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('✓ Connected to WhatsApp');
      console.log('✓ Bot is ready!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    // Baca setiap pesan yang masuk (tandai centang biru)
    if (!msg.key.fromMe) {
      await sock.readMessages([{
        remoteJid: msg.key.remoteJid,
        id: msg.key.id,
        participant: msg.key.participant // untuk grup
      }]);
    }

    const from = msg.key.remoteJid;
    const messageType = Object.keys(msg.message)[0];
    const body = messageType === 'conversation' 
      ? msg.message.conversation
      : messageType === 'extendedTextMessage'
      ? msg.message.extendedTextMessage.text
      : '';

    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    
    console.log(`📨 Command received: ${cmdName} from ${from}`);
    
    const command = commands.get(cmdName);

    if (command) {
      try {
        console.log(`⚡ Executing: ${cmdName}`);
        await command.execute(sock, msg, args);
      } catch (err) {
        console.error('Command error:', err);
        const sentMsg = await sock.sendMessage(from, { 
          text: '❌ Terjadi kesalahan saat menjalankan perintah.' 
        });
        await sock.readMessages([sentMsg.key]);
      }
    } else {
      console.log(`❓ Unknown command: ${cmdName}`);
    }
  });

  // Setup cron jobs
  setupCronJobs(sock);

  return sock;
}

function setupCronJobs(sock) {
  console.log('\n🕐 Setting up cron jobs...');
  
  // Daily reminder at 18:45
  const reminderTime = process.env.REMINDER_TIME || '18:45';
  const [hour, minute] = reminderTime.split(':');
  
  cron.schedule(`${minute} ${hour} * * *`, async () => {
    console.log('📅 Running daily reminder...');
    await sendDailyReminder(sock);
  }, {
    timezone: 'Asia/Jakarta'
  });
  console.log(`  ✓ Daily reminder scheduled at ${reminderTime}`);

  // Prayer reminders (check every 5 minutes)
  cron.schedule('*/5 * * * *', async () => {
    await sendPrayerReminder(sock);
  }, {
    timezone: 'Asia/Jakarta'
  });
  console.log('  ✓ Prayer reminder (every 5 minutes)');

  // Sleep reminder (check every minute - hanya aktif jam 21:00-21:35)
  cron.schedule('* * * * *', async () => {
    await sendSleepReminder(sock);
  }, {
    timezone: 'Asia/Jakarta'
  });
  console.log('  ✓ Sleep reminder (every minute, 21:00-21:35)');

  // Lesson reminder (check every minute)
  cron.schedule('* * * * *', async () => {
    await sendLessonReminder(sock);
  }, {
    timezone: 'Asia/Jakarta'
  });
  console.log('  ✓ Lesson reminder (every minute during school hours)');

  console.log('✓ All cron jobs initialized\n');
}

// Initialize
(async () => {
  // Tampilkan splash screen terlebih dahulu
  await showSplashScreen();
  
  console.log('🚀 Starting bot...\n');
  
  await initDB();
  console.log('✓ Database initialized');
  
  await initNoteDB();
  console.log('✓ Note database initialized');
  
  await initGDriveConfig();
  console.log('✓ Google Drive config initialized');
  
  await initGoogleDrive();
  console.log('✓ Google Drive initialized');
  
  await loadPlugins();
  
  await connectToWhatsApp();
})();
