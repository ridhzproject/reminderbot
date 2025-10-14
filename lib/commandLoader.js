// Manual command loader untuk memastikan semua command ter-load
import menuPlugin from '../plugins/menu.js';
import jadwalPlugin from '../plugins/jadwal.js';
import jadwalfullPlugin from '../plugins/jadwalfull.js';

import reminderPlugin, { listre, delre } from '../plugins/reminder.js';

import subscribersPlugin, { 
  listsubsre, 
  delsubsre, 
  setsubsre, 
  remindernow 
} from '../plugins/subscribers.js';

import prayerPlugin, { 
  carikota, 
  setkotasholat, 
  addsubsholat, 
  listsubsholat, 
  delsubsholat 
} from '../plugins/prayer.js';

import sleepPlugin, { 
  listsubsleep, 
  delsubsleep 
} from '../plugins/sleep.js';

import notePlugin, {
  listnote,
  note,
  delnote
} from '../plugins/note.js';

import { stats, backup, edit } from '../plugins/system.js';

import { 
  ytsearch, 
  ytmp3, 
  tiktok, 
  instagram, 
  uploadimage 
} from '../plugins/misc.js';

export function loadAllCommands() {
  const commands = new Map();
  
  // Menu
  commands.set('menu', menuPlugin);
  
  // Jadwal
  commands.set('jadwal', jadwalPlugin);
  commands.set('jadwalfull', jadwalfullPlugin);
  
  // Reminder
  commands.set('addre', reminderPlugin);
  commands.set('listre', listre);
  commands.set('delre', delre);
  
  // Subscribers
  commands.set('addsubsre', subscribersPlugin);
  commands.set('listsubsre', listsubsre);
  commands.set('delsubsre', delsubsre);
  commands.set('setsubsre', setsubsre);
  commands.set('remindernow', remindernow);
  
  // Prayer
  commands.set('jadwalsholat', prayerPlugin);
  commands.set('carikota', carikota);
  commands.set('setkotasholat', setkotasholat);
  commands.set('addsubsholat', addsubsholat);
  commands.set('listsubsholat', listsubsholat);
  commands.set('delsubsholat', delsubsholat);
  
  // Sleep
  commands.set('addsubsleep', sleepPlugin);
  commands.set('listsubsleep', listsubsleep);
  commands.set('delsubsleep', delsubsleep);
  
  // Note
  commands.set('addnote', notePlugin);
  commands.set('listnote', listnote);
  commands.set('note', note);
  commands.set('delnote', delnote);
  
  // System & Owner
  commands.set('stats', stats);
  commands.set('backup', backup);
  commands.set('edit', edit);
  
  // Miscellaneous / Tools
  commands.set('ytsearch', ytsearch);
  commands.set('ytmp3', ytmp3);
  commands.set('tiktok', tiktok);
  commands.set('instagram', instagram);
  commands.set('uploadimage', uploadimage);
    
  console.log(`âœ… Loaded ${commands.size} commands manually`);
  
  // Log all commands
  console.log('\nðŸ“‹ Available commands:');
  Array.from(commands.keys()).sort().forEach((cmd, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}. .${cmd}`);
  });
  console.log('');
  
  return commands;
}
