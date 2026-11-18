/**
 * Camino menü istatistik sunucusu (Cloudflare Worker + D1)
 *
 * Menü sayfası (index.html) ziyaret, tıklama ve kaydırma bilgisini /t adresine yollar; yönetim paneli
 * (admin → İstatistikler) özetini /api/stats ile okur. Kurulum: stats/KURULUM.md
 *
 * Çerez kullanılmaz, IP adresi saklanmaz: tekil ziyaretçi, IP + tarayıcı + gün + gizli anahtarın özetiyle (hash)
 * yalnızca o gün içinde ayırt edilir. Kayıtlar 120 gün tutulur (günlük temizlik: Cron Trigger).
 *
 * Değişkenler (Cloudflare → Worker → Settings → Variables and Secrets):
 *   ADMIN_KEY       (Secret) Yönetim panelinin bağlanırken kullandığı uzun, rastgele anahtar
 *   SITE_URL        (Text)   Menünün adresi, ör. https://lacaminosocialmedia.github.io/camino-menu
 *   ALLOWED_ORIGIN  (Text)   Panelin açıldığı alan adı, ör. https://lacaminosocialmedia.github.io
 * Bağlantı (Settings → Bindings): D1 veritabanı, değişken adı DB
 */
const VERSION = '1.0';
const TR_OFFSET = 180;   // Türkiye UTC+3 (yaz saati uygulanmıyor)

export default {
  async fetch(req, env){
    const url = new URL(req.url);
    try{
      if(url.pathname === '/t') return cors(env, await track(req, env));
      if(url.pathname.startsWith('/api/')){
        if(req.method === 'OPTIONS') return cors(env, new Response(null, {status: 204}));
        return cors(env, await api(req, url, env));
      }
      return new Response('Camino istatistik sunucusu çalışıyor. (sürüm ' + VERSION + ')', {headers: {'content-type': 'text/plain; charset=utf-8'}});
    }catch(e){
      console.error(e && e.stack || e);
      return cors(env, json({error: 'Sunucu hatası: ' + (e && e.message || e)}, 500));
    }
  },
  async scheduled(event, env, ctx){
    ctx.waitUntil(cleanup(env).catch(e => console.error('temizlik', e && e.stack || e)));
  }
};

/* ---------- Veritabanı (Cloudflare D1) ---------- */
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS visits (sid TEXT PRIMARY KEY, t INTEGER NOT NULL, day TEXT NOT NULL, hr INTEGER, dow INTEGER, vid TEXT, src TEXT, ref TEXT, dev TEXT, os TEXT, city TEXT, lang TEXT, dur INTEGER NOT NULL DEFAULT 0, depth INTEGER NOT NULL DEFAULT 0, clicks INTEGER NOT NULL DEFAULT 0)',
  'CREATE INDEX IF NOT EXISTS visits_t ON visits (t)',
  // s: tıklanan bölümün kimliği, f: bölümün yüzde kaçında tıklandı (0–1) — ısı haritası farklı ekran genişliklerinde doğru yere çizer
  'CREATE TABLE IF NOT EXISTS clicks (id INTEGER PRIMARY KEY AUTOINCREMENT, sid TEXT NOT NULL, t INTEGER NOT NULL, a TEXT, x REAL, y INTEGER, w INTEGER, s TEXT, f REAL)',
  'CREATE INDEX IF NOT EXISTS clicks_t ON clicks (t)'
];
let schemaReady = null;
async function db(env){
  if(!env.DB) throw new Error('D1 veritabanı bağlanmamış (binding adı DB olmalı)');
  if(!schemaReady) schemaReady = env.DB.batch(SCHEMA.map(q => env.DB.prepare(q))).catch(e => { schemaReady = null; throw e; });
  await schemaReady;
  return env.DB;
}
async function cleanup(env){
  const D = await db(env), old = Date.now() - 120 * 864e5;
  await D.batch([D.prepare('DELETE FROM visits WHERE t < ?').bind(old), D.prepare('DELETE FROM clicks WHERE t < ?').bind(old)]);
}

/* ---------- Yardımcılar ---------- */
const json = (obj, status) => new Response(JSON.stringify(obj), {status: status || 200, headers: {'content-type': 'application/json; charset=utf-8'}});
const enc = s => new TextEncoder().encode(s);
const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
function addDays(date, n){ return new Date(Date.parse(date + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
function safeEqual(a, b){
  const x = enc(a), y = enc(b);
  return x.length === y.length && crypto.subtle.timingSafeEqual(x, y);
}
async function hmacHex(secret, bytes){
  const key = await crypto.subtle.importKey('raw', enc(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
}
const siteHost = env => { try{ return new URL(env.SITE_URL || 'https://lacaminosocialmedia.github.io').hostname; }catch(e){ return ''; } };

/* ---------- Yönetim paneli API'si ---------- */
function cors(env, res){
  const h = new Headers(res.headers);
  h.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN || '*');
  h.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  h.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  h.set('Access-Control-Max-Age', '86400');
  h.set('Vary', 'Origin');
  return new Response(res.body, {status: res.status, headers: h});
}
async function api(req, url, env){
  if(!env.ADMIN_KEY || !safeEqual(req.headers.get('authorization') || '', 'Bearer ' + env.ADMIN_KEY)) return json({error: 'Yönetici anahtarı hatalı.'}, 401);
  switch(url.pathname){
    case '/api/health': {
      const D = await db(env);
      const r = await D.prepare('SELECT COUNT(*) AS n, MAX(t) AS last FROM visits').first();
      return json({ok: true, version: VERSION, visits: r.n, last: r.last});
    }
    case '/api/stats':
      return json(await stats(env, +url.searchParams.get('days') || 7));
  }
  return json({error: 'Bulunamadı'}, 404);
}

/* ---------- Ziyaret kaydı ---------- */
const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp\/|telegram|discord|curl|wget|python|axios/i;
const SRC_NAMES = {qr: 'QR kod', masa: 'QR kod', instagram: 'Instagram', ig: 'Instagram', facebook: 'Facebook', fb: 'Facebook', google: 'Google',
  whatsapp: 'WhatsApp', wa: 'WhatsApp', tiktok: 'TikTok', x: 'X (Twitter)', twitter: 'X (Twitter)', tv: 'TV ekranı'};
function visitSource(src, ref, ua, own){
  const s = String(src || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
  if(s) return SRC_NAMES[s] || s;
  if(/Instagram/.test(ua)) return 'Instagram';
  if(/FBAN|FBAV|FB_IAB/.test(ua)) return 'Facebook';
  let host = '';
  try{ host = new URL(ref).hostname.replace(/^www\./, ''); }catch(e){}
  if(!host || host === own) return 'Doğrudan';
  const known = [[/(^|\.)google\./, 'Google'], [/instagram\.com$/, 'Instagram'], [/(facebook\.com|fb\.com|fb\.me)$/, 'Facebook'], [/(wa\.me|whatsapp\.com)$/, 'WhatsApp'],
    [/(t\.co|twitter\.com|x\.com)$/, 'X (Twitter)'], [/tiktok\.com$/, 'TikTok'], [/yandex\./, 'Yandex'], [/bing\.com$/, 'Bing'], [/(tripadvisor|yelp|foursquare)\./, 'Rehber siteleri']];
  const k = known.find(([re]) => re.test(host));
  return k ? k[1] : host.slice(0, 40);
}
const uaDevice = (ua, w) => /iPad|Tablet/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'Tablet' : /Mobi|iPhone|Android/i.test(ua) || (w && w < 700) ? 'Telefon' : 'Bilgisayar';
const uaOs = ua => /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Diğer';

async function track(req, env){
  if(req.method !== 'POST') return new Response(null, {status: 204});
  const ua = req.headers.get('user-agent') || '';
  if(BOT_UA.test(ua)) return new Response(null, {status: 204});
  const raw = await req.text();
  if(raw.length > 32000) return new Response(null, {status: 413});
  let b;
  try{ b = JSON.parse(raw); }catch(e){ return new Response(null, {status: 400}); }
  const sid = String(b.sid || '');
  if(!/^[a-z0-9]{8,24}$/.test(sid)) return new Response(null, {status: 400});
  const D = await db(env), now = Date.now(), tr = new Date(now + TR_OFFSET * 60e3), num = (v, max) => Math.max(0, Math.min(max, Math.round(+v || 0)));
  const ops = [];
  if(b.pv){
    const day = tr.toISOString().slice(0, 10), ip = req.headers.get('cf-connecting-ip') || '';
    const vid = (await hmacHex(env.ADMIN_KEY || 'camino', enc(ip + '|' + ua + '|' + day))).slice(0, 16);
    const cf = req.cf || {};
    ops.push(D.prepare('INSERT OR IGNORE INTO visits (sid, t, day, hr, dow, vid, src, ref, dev, os, city, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(sid, now, day, tr.getUTCHours(), tr.getUTCDay(), vid, visitSource(b.pv.src, b.pv.ref, ua, siteHost(env)), clean(b.pv.ref, 200),
        uaDevice(ua, +b.pv.w), uaOs(ua), clean(cf.city || cf.country || '', 40), clean(b.pv.lang, 10)));
  }
  const ev = (Array.isArray(b.ev) ? b.ev : []).slice(0, 40);
  if(ev.length) ops.push(D.prepare('UPDATE visits SET clicks = clicks + ? WHERE sid = ?').bind(ev.filter(e => e.a).length, sid));
  if(b.end) ops.push(D.prepare('UPDATE visits SET dur = MAX(dur, ?), depth = MAX(depth, ?) WHERE sid = ?').bind(num(b.end.dur, 7200), num(b.end.depth, 100), sid));
  ev.forEach(e => ops.push(D.prepare('INSERT INTO clicks (sid, t, a, x, y, w, s, f) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(sid, now, clean(e.a, 60),
    Math.max(0, Math.min(1, +e.x || 0)), num(e.y, 60000), num(e.w, 5000), e.s ? clean(e.s, 40) : null, e.s ? Math.max(0, Math.min(1, +e.f || 0)) : null)));
  if(ops.length) await D.batch(ops);
  return new Response(null, {status: 204});
}

/* ---------- Özet ---------- */
async function stats(env, days){
  days = Math.max(1, Math.min(120, days));
  const D = await db(env), now = Date.now(), tr = new Date(now + TR_OFFSET * 60e3);
  const from = addDays(tr.toISOString().slice(0, 10), 1 - days), since = Date.parse(from + 'T00:00:00Z') - TR_OFFSET * 60e3;
  const all = async (q, ...a) => (await D.prepare(q).bind(...a).all()).results;
  const top = col => all('SELECT ' + col + ' AS k, COUNT(*) AS n FROM visits WHERE t >= ? GROUP BY ' + col + ' ORDER BY n DESC LIMIT 12', since);
  const [tot] = await all('SELECT COUNT(*) AS visits, AVG(CASE WHEN dur > 0 THEN dur END) AS dur, AVG(CASE WHEN depth > 0 THEN depth END) AS depth, ' +
    'SUM(CASE WHEN clicks > 0 THEN 1 ELSE 0 END) AS engaged FROM visits WHERE t >= ?', since);
  const byDay = await all('SELECT day, COUNT(*) AS v, COUNT(DISTINCT vid) AS u FROM visits WHERE t >= ? GROUP BY day ORDER BY day', since);
  return {
    from, days, now,
    totals: Object.assign(tot, {uniques: byDay.reduce((n, d) => n + d.u, 0)}),
    byDay,
    byHour: await all('SELECT dow, hr, COUNT(*) AS n FROM visits WHERE t >= ? GROUP BY dow, hr', since),
    sources: await top('src'), devices: await top('dev'), os: await top('os'), cities: await top('city'),
    actions: await all("SELECT a AS k, COUNT(*) AS n, COUNT(DISTINCT sid) AS s FROM clicks WHERE t >= ? AND a <> '' GROUP BY a ORDER BY n DESC LIMIT 150", since),
    heat: await all('SELECT x, y, w, s, f FROM clicks WHERE t >= ? ORDER BY id DESC LIMIT 6000', since),
    live: (await all('SELECT COUNT(*) AS n FROM visits WHERE t > ?', now - 5 * 60e3))[0].n
  };
}
