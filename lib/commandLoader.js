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
