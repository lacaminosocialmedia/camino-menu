/* Camino QR Menü – ortak çekirdek.
   Menü sayfası (index.html) ve yönetim paneli (admin.html) birlikte kullanır:
   ürün kimlikleri, varsayılan fotoğraflar, kampanya / happy hour zamanlaması ve indirimli fiyat hesabı. */
(function(global){
  'use strict';

  const TZ = 'Europe/Istanbul';
  const DAY_MS = 86400000;

  const ALLERGENS = [
    {key:'gluten', label:'Gluten içeren tahıllar'}, {key:'crustaceans', label:'Kabuklular'},
    {key:'egg', label:'Yumurta'}, {key:'fish', label:'Balık'}, {key:'peanut', label:'Yerfıstığı'},
    {key:'soy', label:'Soya'}, {key:'milk', label:'Süt (laktoz dahil)'}, {key:'nuts', label:'Sert kabuklu meyveler'},
    {key:'celery', label:'Kereviz'}, {key:'mustard', label:'Hardal'}, {key:'sesame', label:'Susam'},
    {key:'sulfites', label:'Kükürt dioksit ve sülfitler'}, {key:'lupin', label:'Acı bakla'}, {key:'molluscs', label:'Yumuşakçalar'}
  ];
  const ALLERGEN_LABELS = Object.fromEntries(ALLERGENS.map(a => [a.key, a.label]));
  const DAYS = [{d:1,s:'Pzt'},{d:2,s:'Sal'},{d:3,s:'Çar'},{d:4,s:'Per'},{d:5,s:'Cum'},{d:6,s:'Cmt'},{d:0,s:'Paz'}];

  function slugify(s){
    const map = {'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','İ':'i','I':'i','Ö':'o','Ş':'s','Ü':'u'};
    return String(s || '').replace(/[çğıöşüÇĞİIÖŞÜ]/g, c => map[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ---------- Fotoğraflar ---------- */
  // Kendi fotoğraflarınız yüklenene kadar kullanılan örnek görseller (Unsplash). Ürün adına göre eşleşir.
  const unsplash = (id, w) => 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=' + (w || 800) + '&q=70';
  const ITEM_PHOTOS = {
    'fettuccine-alfredo':'1645112411341-6c4fd023714a', 'deniz-mahsullu-pappardelle':'1563379926898-05f4575a45d8',
    'penne-arabiata':'1621996346565-e3dbc646d9a9',
    'cheese-burger':'1572802419224-296b0aeee0d9', 'tavuk-burger':'1606755962773-d324e0a13086', 'camino-burger':'1550317138-10000687a72b',
    'citir-tabagi':'1562967914-608f82629710', 'truf-parmesanli-patates':'1573080496219-bb080dd4f877',
    'patates-kizartmasi':'1630384060421-cb20d0e0649d', 'elma-dilim-patates':'1576107232684-1279f390859f',
    'citir-tavuk-tabagi':'1626645738196-c2a7c87a8f58', 'cheddar-patates':'1541592106381-b31e9677c0e5',
    'kasik-patates':'1585109649139-366815a0d713', 'sosis-tabagi':'1585325701165-351af916e581',
    'dana-fajita':'1558030006-450675393462', 'tavuk-fajita':'1604908176997-125f25cc6f3d',
    'dana-bonfile':'1546964124-0cce460f38ef', 'izgara-kofte':'1529042410759-befb1204b468',
    'fish-and-chips':'1580217593608-61931cefc821', 'sebzeli-citir-deniz-mahsulleri':'1625943553852-781c6dd46faa',
    'frankfurter-sosis':'1619740455993-9e612b1af08a', 'sinitzel-tavuk':'1599921841143-819065a55cc6',
    'kalamar':'1639024471283-03518883512d', 'crispy-karides':'1569058242253-92a9c755a0ec',
    'margarita-pizza':'1574071318508-1cdbab80d002', 'peperoni-pizza':'1628840042765-356cda07504e',
    'mantarli-pizza':'1593560708920-61dd98c46a4e', 'karisik-pizza':'1513104890138-7c749659a591',
    'brownie':'1606313564200-e75d5e30476c', 'belcika-cikolatali-sufle':'1624353365286-3f8d62daad51',
    'espresso':'1510591509098-f4fdc6d0ff04', 'doppio':'1485808191679-5f86510681a2', 'americano':'1495474472287-4d71bcdd2085',
    'latte':'1541167760496-1628856ab772', 'cappuccino':'1572442388796-11668a67e53d', 'flat-white':'1534778101976-62847782c213',
    'white-mocha':'1563805042-7684c019e1cb', 'mocha':'1563805042-7684c019e1cb',
    'cola':'1554866585-cd94860890b7', 'cola-zero':'1622483767028-3f66f32aef97', 'soda':'1581006852262-e4307cf6283a',
    'taze-sikilmis-portakal-suyu':'1600271886742-f049cd451bba',
    'long-island-ice-tea':'1514362545857-3bc16c4c7d1b', 'lynchburg-lemonade':'1621263764928-df1444c5e859',
    'margarita':'1556855810-ac404aa91e85', 'viski-sour':'1470337458703-46ad1756a187', 'cuba-libre':'1556679343-c7306c1976bc',
    'tom-collins':'1597075687490-8f673c6c17f6', 'pina-colada':'1551024709-8f23befc6f87',
    'feslegen-kavun':'1544145945-f90425340c7e', 'isli-viski-mango':'1541546006121-5c3bc5e8c7b9',
    'sorrel-kiss':'1551538827-9c037cb4f32a', 'scarlet-dream':'1536935338788-846bb9981813', 'morange':'1560512823-829485b8bf24',
    'bella':'1609951651556-5334e2706168', 'aas':'1513558161293-cdaf765ed2fd', 'lime-ekstra':'1546171753-97d7676e4602',
    'peach-fire':'1497534446932-c925b458314e', 'priapos':'1609345265499-2133bbeb6ce5',
    'negroni':'1551751299-1b51cab2694c', 'mojito-cilek-pasion-mango-seftali':'1546171753-97d7676e4602',
    'dry-martini':'1575023782549-62ca0d244b39', 'espresso-martini':'1582106245687-cbb466a9f07f',
    'pornstar-martini':'1587223962930-cb7f31384c19', 'aperol-spritz':'1560512823-829485b8bf24',
    'trio-sise-75-cl':'1474722883778-792e7990302f', 'trio-kadeh-18-5-cl':'1553361371-9b22f78e8b1d',
    'sweet-sunset':'1497534446932-c925b458314e', 'lime-breeze':'1621263764928-df1444c5e859',
    'virgin-mojito':'1470338745628-171cf53de3a8', 'baileys-latte':'1534778101976-62847782c213',
    'irish-coffee':'1485808191679-5f86510681a2'
  };
  const COVER_PHOTOS = {
    'makarnalar':'1551183053-bf91a1d81141', 'burgerler':'1586190848861-99aa4a171e90', 'paylasim-tabagi':'1610614819513-58e34989848b',
    'soslar':'1472476443507-c7a5948772fc', 'izgaralar':'1529193591184-b1d58069ecdd', 'aperatifler':'1580217593608-61931cefc821',
    'pizzalar':'1565299624946-b28f40a0ae38', 'pizza-ilaveleri':'1593560708920-61dd98c46a4e', 'ilave-lezzetler':'1548340748-6d2b7d7da280',
    'tatlilar':'1564355808539-22fda35bed7e', 'kahveler':'1495474472287-4d71bcdd2085', 'soguk-icecekler':'1622483767028-3f66f32aef97',
    'dunya-klasikleri':'1551024709-8f23befc6f87', 'imza-kokteyller':'1536935338788-846bb9981813', 'stir':'1551751299-1b51cab2694c',
    'muddle':'1546171753-97d7676e4602', 'martini':'1575023782549-62ca0d244b39', 'sampanya-kokteylleri':'1560512823-829485b8bf24',
    'saraplar':'1474722883778-792e7990302f', 'mocktails':'1497534446932-c925b458314e', 'alkollu-kahveler':'1534778101976-62847782c213',
    'gin':'1608885898957-a559228e8749', 'vodka':'1571950006418-f226dc106482', 'rum':'1582819509237-d5b75f20ff7a',
    'viski':'1569529465841-dfecdab7503b', 'shot':'1525268323446-0505b6fe7778', 'bira':'1618183479302-1e0aa382c36b',
    'ficilar':'1567696911980-2eed69a46042', 'happy-hour':'1532634922-8fe0b757fb13'
  };
  const HERO_PHOTOS = ['1572116469696-31de0f17cc34', '1550317138-10000687a72b', '1514362545857-3bc16c4c7d1b', '1567696911980-2eed69a46042'];

  // Kendi yüklenen fotoğraf varsa onu, yoksa örnek fotoğrafı döner. Unsplash görsellerinde genişlik ayarlanabilir.
  function sized(url, w){
    if(!url) return '';
    return /images\.unsplash\.com/.test(url) ? url.replace(/([?&])w=\d+/, '$1w=' + w) : url;
  }
  function itemPhoto(item, w){
    if(item.image) return sized(item.image, w || 800);
    const id = ITEM_PHOTOS[slugify(item.name)];
    return id ? unsplash(id, w) : '';
  }
  function isDefaultPhoto(item){ return !item.image && !!ITEM_PHOTOS[slugify(item.name)]; }
  function coverPhoto(cat, w){
    if(cat.cover) return sized(cat.cover, w || 1400);
    const id = COVER_PHOTOS[cat.id];
    if(id) return unsplash(id, w || 1400);
    const c = (cat.collage || []).find(Boolean);
    return c ? sized(c, w || 1400) : '';
  }
  function heroPhotos(site, w){
    const list = (site.heroImages || []).filter(Boolean);
    return list.length ? list.map(u => sized(u, w || 1800)) : HERO_PHOTOS.map(id => unsplash(id, w || 1800));
  }
  // Kategori görünümü: "cards" (fotoğraflı) veya "list" (şık liste). auto: ürünlerin yarısından fazlasının fotoğrafı varsa kart.
  function layoutFor(cat){
    if(cat.layout === 'cards' || cat.layout === 'list') return cat.layout;
    const items = (cat.items || []).filter(i => !i.hidden);
    if(!items.length) return 'list';
    return items.filter(i => itemPhoto(i)).length * 2 > items.length ? 'cards' : 'list';
  }

  /* ---------- Veri hazırlama ---------- */
  // Metinlerdeki emojileri ve süs simgelerini temizler (menüde hiçbir yerde emoji görünmez)
  // Emojiler + oklar, yıldızlar, geometrik ve dekoratif süs işaretleri (≈ gibi matematik işaretlerine dokunmaz)
  const EMOJI_RE = new RegExp('(?:\\p{Extended_Pictographic}|[\\u{1F1E6}-\\u{1F1FF}\\u{1F3FB}-\\u{1F3FF}\\u{FE0F}\\u{200D}\\u{20E3}' +
    '\\u{2190}-\\u{21FF}\\u{25A0}-\\u{25FF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{22EE}])', 'gu');
  function stripEmoji(s){
    if(typeof s !== 'string') return s;
    const out = s.replace(EMOJI_RE, '');
    return out === s ? s : out.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  }
  function cleanFields(o, keys){
    if(!o) return;
    keys.forEach(k => { if(typeof o[k] === 'string') o[k] = stripEmoji(o[k]); });
  }
  // Her ürüne kalıcı bir kimlik verir (kampanyalar ve ileride sipariş sistemi bu kimliği kullanır).
  function prepare(data){
    data.site = data.site || {};
    data.categories = data.categories || [];
    data.campaigns = data.campaigns || [];
    data.events = data.events || [];
    data.announcements = data.announcements || [];
    cleanFields(data.site, ['name', 'tagline', 'city']);
    data.categories.forEach(cat => {
      cleanFields(cat, ['title', 'subtitle']);
      (cat.items || []).forEach(it => cleanFields(it, ['name', 'description', 'traceWarning']));
    });
    data.campaigns.forEach(c => { cleanFields(c, ['title', 'badge', 'text']); cleanFields(c.popup, ['button']); });
    data.events.forEach(ev => cleanFields(ev, ['title', 'text']));
    data.announcements.forEach(a => cleanFields(a, ['title', 'text', 'button']));
    const used = new Set();
    data.categories.forEach(cat => (cat.items || []).forEach(it => { if(it.id) used.add(it.id); }));
    data.categories.forEach(cat => {
      cat.items = cat.items || [];
      cat.items.forEach(it => {
        if(it.id) return;
        const base = cat.id + '--' + (slugify(it.name) || 'urun');
        let id = base, n = 2;
        while(used.has(id)) id = base + '-' + (n++);
        used.add(id);
        it.id = id;
      });
    });
    return data;
  }
  function findItem(data, id){
    for(const cat of data.categories) for(const it of cat.items) if(it.id === id) return {item: it, cat};
    return null;
  }

  /* ---------- Zaman (her zaman Türkiye saati) ---------- */
  // "Duvar saati" ms: Türkiye'deki tarih/saat, sanki UTC imiş gibi sayıya çevrilir. Karşılaştırmalar bununla yapılır.
  let nowOffset = 0;
  function setNowOverride(str){
    const w = parseWall(str);
    if(w != null) nowOffset = w - realWall();
  }
  function realWall(){
    try{
      const p = {};
      new Intl.DateTimeFormat('en-GB', {timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(x => p[x.type] = x.value);
      return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    }catch(e){
      const d = new Date();
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
    }
  }
  function now(){
    const wall = realWall() + nowOffset;
    const d = new Date(wall);
    return {wall, dow: d.getUTCDay(), min: d.getUTCHours() * 60 + d.getUTCMinutes(), dayStart: wall - (wall % DAY_MS)};
  }
  function parseWall(s){
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(s || '');
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : null;
  }
  function parseHM(s){
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
    return m ? (+m[1] % 24) * 60 + +m[2] : null;
  }
  function hm(min){ return String(Math.floor(min / 60) % 24).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }

  /* ---------- Kampanyalar ---------- */
  // Kampanya: {id, enabled, title, badge, text, from, to, days[], start, end,
  //            discount:{type:'percent'|'amount'|'none', value, round}, all, categories[], items[{id, price}],
  //            popup:{enabled, image, button}}
  function campaignState(c, n){
    n = n || now();
    const res = {active:false, endsAt:null, startsAt:null, expired:false, upcoming:false};
    if(!c || !c.enabled) return res;
    const from = parseWall(c.from), to = parseWall(c.to);
    if(to != null && n.wall >= to){ res.expired = true; return res; }
    const days = Array.isArray(c.days) ? c.days : [];
    const dayOk = dow => !days.length || days.includes(dow);
    const s = parseHM(c.start), e = parseHM(c.end);
    let winStart = null, winEnd = null;

    if(s == null || e == null){
      if(dayOk(n.dow)){ winStart = n.dayStart; winEnd = days.length ? n.dayStart + DAY_MS : null; }
    }else if(s < e){
      if(dayOk(n.dow) && n.min >= s && n.min < e){ winStart = n.dayStart + s * 60000; winEnd = n.dayStart + e * 60000; }
      else if(dayOk(n.dow) && n.min < s) res.startsAt = n.dayStart + s * 60000;
    }else{ // gece yarısını geçen saat aralığı (ör. 22:00–02:00)
      const prevDow = (n.dow + 6) % 7;
      if(dayOk(n.dow) && n.min >= s){ winStart = n.dayStart + s * 60000; winEnd = n.dayStart + DAY_MS + e * 60000; }
      else if(dayOk(prevDow) && n.min < e){ winStart = n.dayStart - DAY_MS + s * 60000; winEnd = n.dayStart + e * 60000; }
      else if(dayOk(n.dow) && n.min < s) res.startsAt = n.dayStart + s * 60000;
    }

    if(from != null && n.wall < from){
      res.upcoming = true;
      if(res.startsAt == null || res.startsAt < from) res.startsAt = (from - n.wall < DAY_MS) ? from : null;
      return res;
    }
    if(winStart != null){
      res.active = true;
      const ends = [winEnd, to].filter(x => x != null);
      res.endsAt = ends.length ? Math.min.apply(null, ends) : null;
      res.startsAt = null;
    }
    if(res.startsAt != null && to != null && res.startsAt >= to) res.startsAt = null;
    return res;
  }
  function describeSchedule(c){
    const parts = [];
    const days = Array.isArray(c.days) ? c.days : [];
    if(days.length && days.length < 7) parts.push(DAYS.filter(x => days.includes(x.d)).map(x => x.s).join(', '));
    else parts.push('Her gün');
    if(parseHM(c.start) != null && parseHM(c.end) != null) parts.push(c.start + '–' + c.end);
    const f = parseWall(c.from), t = parseWall(c.to);
    const fmt = w => new Date(w).toLocaleDateString('tr-TR', {day:'numeric', month:'long', timeZone:'UTC'});
    if(f != null && t != null) parts.push(fmt(f) + ' – ' + fmt(t));
    else if(t != null) parts.push(fmt(t) + ' tarihine kadar');
    else if(f != null) parts.push(fmt(f) + ' tarihinden itibaren');
    return parts.join(' · ');
  }
  function campaignTargets(c, item, cat){
    if(c.all) return {hit:true};
    const own = (c.items || []).find(x => x.id === item.id);
    if(own) return {hit:true, price: (own.price || '').trim()};
    if((c.categories || []).includes(cat.id)) return {hit:true};
    return {hit:false};
  }
  // Fiyat metnindeki sayıları indirimle değiştirir. "50cl / 175 TL" gibi metinlerde cl/gr gibi miktarlara dokunmaz.
  function applyDiscount(price, d){
    if(!d || !d.type || d.type === 'none' || !(+d.value > 0)) return null;
    const round = +d.round > 0 ? +d.round : 5;
    let changed = false;
    const out = String(price).replace(/\d+(?:[.,]\d+)?(?![\d.,])(?!\s*(?:cl|ml|gr|g|kg|lt|l|cm|adet)\b)/gi, m => {
      const n = parseFloat(m.replace(',', '.'));
      if(!(n > 0)) return m;
      let v = d.type === 'percent' ? n * (1 - (+d.value) / 100) : n - (+d.value);
      v = Math.max(0, Math.round(v / round) * round);
      changed = true;
      return String(v);
    });
    return changed && out !== String(price) ? out : null;
  }
  function discountLabel(c){
    const d = c.discount || {};
    if(c.badge) return c.badge;
    if(d.type === 'percent' && +d.value > 0) return '%' + (+d.value) + ' İNDİRİM';
    if(d.type === 'amount' && +d.value > 0) return (+d.value) + ' TL İNDİRİM';
    return c.title || 'KAMPANYA';
  }
  // Menüde gösterilecek fiyat bilgisi (fiyat gizleme ayarları ve aktif kampanyalar dahil)
  function priceInfo(data, cat, item, n){
    const show = data.site.showPrices !== false && !cat.hidePrices && !item.hidePrice && !!item.price;
    const res = {show, price: item.price || '', newPrice: null, campaign: null, state: null};
    if(!show) return res;
    n = n || now();
    for(const c of data.campaigns || []){
      const st = campaignState(c, n);
      if(!st.active) continue;
      const t = campaignTargets(c, item, cat);
      if(!t.hit) continue;
      const np = t.price || applyDiscount(item.price, c.discount);
      if(np && np !== item.price){ res.newPrice = np; res.campaign = c; res.state = st; break; }
    }
    return res;
  }
  function formatCountdown(ms){
    if(ms == null) return '';
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    if(d > 0) return d + ' gün ' + h + ' sa';
    if(h > 0) return h + ' sa ' + String(m).padStart(2, '0') + ' dk';
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }
  function newCampaign(){
    return {id: 'k' + Date.now().toString(36), enabled: false, title: 'Happy Hour', badge: 'HAPPY HOUR',
      text: 'Seçili içeceklerde happy hour fiyatları!', from: '', to: '', days: [], start: '16:00', end: '19:00',
      discount: {type:'percent', value: 20, round: 5}, all: false, categories: [], items: [],
      popup: {enabled: true, image: '', button: 'Kampanyalı Ürünleri Gör'}};
  }

  // Takvim için: kampanya o gün (herhangi bir saatte) geçerli mi?
  function campaignOnDay(c, dayStart){
    if(!c || !c.enabled) return null;
    const from = parseWall(c.from), to = parseWall(c.to);
    if(from != null && from >= dayStart + DAY_MS) return null;
    if(to != null && to <= dayStart) return null;
    const days = Array.isArray(c.days) ? c.days : [];
    if(days.length && !days.includes(new Date(dayStart).getUTCDay())) return null;
    const s = parseHM(c.start), e = parseHM(c.end);
    return {time: s != null && e != null ? c.start + '–' + c.end : 'Tüm gün'};
  }

  /* ---------- Etkinlikler / duyurular ---------- */
  // Etkinlik: {id, type, title, text, date:'YYYY-MM-DD', start, end, repeat:'none'|'weekly', until, image, popup, published}
  const EVENT_TYPES = [
    {key:'music', label:'Canlı Müzik'}, {key:'match', label:'Maç Yayını'},
    {key:'party', label:'DJ / Parti'}, {key:'quiz', label:'Quiz Gecesi'},
    {key:'special', label:'Özel Gün'}, {key:'announce', label:'Duyuru'},
    {key:'closed', label:'Kapalıyız / Özel saat'}
  ];
  const EVENT_TYPE = Object.fromEntries(EVENT_TYPES.map(t => [t.key, t]));
  function eventType(ev){ return EVENT_TYPE[ev.type] || EVENT_TYPE.announce; }
  // Etkinliğin [fromDay, toDay] aralığındaki günleri (gün başlangıcı, duvar saati ms)
  function eventDays(ev, fromDay, toDay){
    const base = parseWall(ev.date);
    if(base == null) return [];
    if(ev.repeat !== 'weekly') return base >= fromDay && base <= toDay ? [base] : [];
    const until = parseWall(ev.until);
    const W = 7 * DAY_MS, out = [];
    let d = base;
    if(fromDay > base) d = base + Math.ceil((fromDay - base) / W) * W;
    for(; d <= toDay && (until == null || d <= until); d += W) out.push(d);
    return out;
  }
  function eventWindow(ev, day){
    const s = parseHM(ev.start), e = parseHM(ev.end);
    const start = day + (s != null ? s * 60000 : 0);
    let end = day + DAY_MS;
    if(e != null) end = day + e * 60000 + (s != null && e <= s ? DAY_MS : 0);
    else if(s != null) end = Math.max(day + DAY_MS, start + 4 * 3600000);   // bitiş yoksa gece boyunca
    return {start, end};
  }
  // Menüde gösterilecek yaklaşan etkinlikler (bitmemiş olanlar), tarih sırasıyla
  function upcomingEvents(data, n, days){
    n = n || now();
    const out = [];
    (data.events || []).forEach(ev => {
      if(ev.published === false) return;
      eventDays(ev, n.dayStart - DAY_MS, n.dayStart + (days || 14) * DAY_MS).forEach(day => {
        const w = eventWindow(ev, day);
        if(w.end <= n.wall) return;
        out.push({ev, day, start: w.start, end: w.end, live: w.start <= n.wall, today: day === n.dayStart || w.start <= n.wall});
      });
    });
    return out.sort((a, b) => a.start - b.start);
  }
  function newEvent(date){
    return {id: 'e' + Date.now().toString(36), type: 'music', title: 'Canlı Müzik', text: '', date: date || '',
      start: '21:00', end: '', repeat: 'none', until: '', image: '', popup: false, published: true};
  }

  /* ---------- Duyurular (afişler) ---------- */
  // Duyuru: {id, title, text, image, video, link, button, from, to, published, popup}  (video: sessiz, döngüde oynar; image kapak olur)
  function announcementState(a, n){
    n = n || now();
    if(a.published === false) return 'off';
    const f = parseWall(a.from), t = parseWall(a.to);
    if(t != null && n.wall >= t) return 'expired';
    if(f != null && n.wall < f) return 'scheduled';
    return 'live';
  }
  function newAnnouncement(){
    return {id: 'd' + Date.now().toString(36), title: 'Yeni duyuru', text: '', image: '', link: '', button: '',
      from: '', to: '', published: true, popup: true};
  }
  // Duyuru ve etkinliklerin isteğe bağlı detayları: ücret, tarih/saat metni, rezervasyon telefonu, WhatsApp, konum, yol tarifi
  function posterInfo(o, site){
    const phone = String(o.phone || '').trim();
    const place = String(o.place || '').trim() || (site && site.address) || '';
    return {price: String(o.price || '').trim(), when: String(o.when || '').trim(), phone, whatsapp: !!(o.whatsapp && phone),
      place: String(o.place || '').trim(), directions: !!(o.directions && place),
      mapUrl: place ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place) : ''};
  }
  // Açılış popup'ında gösterilecek afişler, sırasıyla: önce duyurular (panel sırası), sonra aktif kampanyalar, sonra yaklaşan etkinlikler
  function posterSlides(data, n){
    n = n || now();
    const out = [];
    (data.announcements || []).forEach(a => {
      if(a.popup === false || announcementState(a, n) !== 'live') return;
      out.push({kind:'ann', key:'a:' + a.id, title: a.title, badge: 'DUYURU', text: a.text, image: a.image, video: a.video || '', link: a.link,
        button: a.button, endsAt: parseWall(a.to), info: posterInfo(a, data.site), src: a});
    });
    (data.campaigns || []).forEach(c => {
      const st = campaignState(c, n);
      if(!st.active || !c.popup || c.popup.enabled === false) return;
      out.push({kind:'camp', key:'c:' + c.id, title: c.title, badge: discountLabel(c), text: c.text, image: c.popup.image,
        button: c.popup.button, endsAt: st.endsAt, when: describeSchedule(c), src: c});
    });
    upcomingEvents(data, n, 7).forEach(o => {
      if(!o.ev.popup) return;
      out.push({kind:'event', key:'e:' + o.ev.id + ':' + o.day, title: o.ev.title, badge: eventType(o.ev).label, text: o.ev.text,
        image: o.ev.image, day: o.day, start: o.start, live: o.live, info: posterInfo(o.ev, data.site), src: o.ev});
    });
    return out;
  }

  /* ---------- Sosyal medya ---------- */
  // Kullanıcı adı veya tam adres yazılabilir; adres üretilir
  const SOCIALS = [
    {key:'instagram', label:'Instagram', url: h => 'https://instagram.com/' + h.replace(/^@/, '')},
    {key:'facebook', label:'Facebook', url: h => 'https://facebook.com/' + h.replace(/^@/, '')},
    {key:'tiktok', label:'TikTok', url: h => 'https://www.tiktok.com/@' + h.replace(/^@/, '')},
    {key:'x', label:'X (Twitter)', url: h => 'https://x.com/' + h.replace(/^@/, '')},
    {key:'youtube', label:'YouTube', url: h => 'https://youtube.com/@' + h.replace(/^@/, '')},
    {key:'whatsapp', label:'WhatsApp', url: h => 'https://wa.me/' + h.replace(/\D/g, '').replace(/^0/, '90')},
    {key:'google', label:'Google yorum / işletme', url: h => h}
  ];
  function socialLinks(site){
    const s = site.social || {}, out = [];
    SOCIALS.forEach(x => {
      const v = String(s[x.key] || '').trim();
      if(!v) return;
      out.push({key: x.key, label: x.label, href: /^https?:\/\//i.test(v) ? v : x.url(v)});
    });
    if(site.phone && s.showPhone !== false) out.push({key:'phone', label:'Ara: ' + site.phone, href:'tel:' + String(site.phone).replace(/\s/g, '')});
    if(site.address && s.showMap !== false) out.push({key:'map', label:'Yol tarifi', href:'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(site.address)});
    return out;
  }

  /* ---------- Açık / kapalı ---------- */
  function openState(site, n){
    n = n || now();
    const o = parseHM(site.opening), c = parseHM(site.closing);
    if(o == null || c == null) return null;
    const open = o < c ? (n.min >= o && n.min < c) : (n.min >= o || n.min < c);
    return {open, opening: hm(o), closing: hm(c)};
  }

  /* ---------- Özel günler ---------- */
  // Menü o gün açılınca kutlama / anma penceresi gösterir, köşede rozet kalır. Tarihler her yıl kendiliğinden tekrar eder.
  // kind: flag (bayraklı milli bayram) · mourn (anma, siyah) · warm (kutlama). ata: Atatürk fotoğrafı.
  // Metinlerde {y} yıl, {n} kaçıncı yıl (since'ten bu yana), {g} dini bayramın kaçıncı günü. reserve: pencerede "Rezervasyon için arayın" düğmesi.
  // Dini bayramlar ay takvimine göre her yıl kaydığı için Diyanet takvimiyle yıl yıl yazılır: [ilk gün, gün sayısı]
  const RELIGIOUS_DAYS = {
    2026: {ramazan: ['2026-03-20', 3], kurban: ['2026-05-27', 4]},
    2027: {ramazan: ['2027-03-09', 3], kurban: ['2027-05-16', 4]}
  };
  const nthSunday = (y, mon, n) => { const first = new Date(Date.UTC(y, mon - 1, 1)).getUTCDay(); return 1 + (7 - first) % 7 + (n - 1) * 7; };
  const SPECIAL_DAYS = [
    {key: 'yilbasi', md: '01-01', name: 'Yılbaşı', kind: 'warm', badge: ['1 Ocak', 'Mutlu yıllar'], eyebrow: '1 Ocak {y}',
      title: 'Yeni yılınız <em>kutlu olsun</em>', text: '{y} yılının size ve sevdiklerinize sağlık, huzur ve güzel sofralar getirmesini dileriz.'},
    {key: 'sevgililer', md: '02-14', name: 'Sevgililer Günü', kind: 'warm', badge: ['14 Şubat', 'Sevgililer Günü'], eyebrow: '14 Şubat', reserve: true,
      title: 'Sevgililer Gününüz <em>kutlu olsun</em>', text: 'Bu akşam sevdiğinizle güzel bir sofrada buluşmaya ne dersiniz? Masanızı şimdiden ayırtabilirsiniz.'},
    {key: 'kadinlar', md: '03-08', name: 'Dünya Kadınlar Günü', kind: 'warm', badge: ['8 Mart', 'Kadınlar Günü'], eyebrow: '8 Mart',
      title: 'Dünya Kadınlar Günü <em>kutlu olsun</em>', text: 'Hayatımıza emek, güç ve zarafet katan tüm kadınların Dünya Kadınlar Günü’nü kutlarız.'},
    {key: 'canakkale', md: '03-18', name: '18 Mart Çanakkale Zaferi', kind: 'flag', ata: true, since: 1915, badge: ['18 Mart', 'Çanakkale Zaferi'], eyebrow: '18 Mart 1915 – 18 Mart {y}',
      title: 'Çanakkale Zaferi’nin <em>{n}. yılı</em>', text: 'Çanakkale Zaferi’nin {n}. yıl dönümünde başta Gazi Mustafa Kemal Atatürk olmak üzere tüm şehitlerimizi rahmet, minnet ve saygıyla anıyoruz.',
      quote: 'Ben size taarruzu emretmiyorum, ölmeyi emrediyorum.'},
    {key: '23nisan', md: '04-23', name: '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı', kind: 'flag', ata: true, since: 1920, badge: ['23 Nisan', 'Çocuk Bayramı'], eyebrow: '23 Nisan 1920 – 23 Nisan {y}',
      title: 'Ulusal Egemenlik ve Çocuk Bayramımız <em>kutlu olsun</em>', text: 'Türkiye Büyük Millet Meclisi’nin açılışının {n}. yılında, bu bayramı çocuklarımıza armağan eden Gazi Mustafa Kemal Atatürk’ü saygı ve minnetle anıyoruz.',
      quote: 'Küçük hanımlar, küçük beyler! Sizler hepiniz geleceğin bir gülü, yıldızı ve ikbal ışığısınız.'},
    {key: '1mayis', md: '05-01', name: '1 Mayıs Emek ve Dayanışma Günü', kind: 'warm', badge: ['1 Mayıs', 'Emek ve Dayanışma'], eyebrow: '1 Mayıs',
      title: 'Emek ve Dayanışma Günü <em>kutlu olsun</em>', text: 'Emeğiyle hayatımıza değer katan herkesin 1 Mayıs Emek ve Dayanışma Günü’nü kutlarız.'},
    {key: 'anneler', on: y => '05-' + String(nthSunday(y, 5, 2)).padStart(2, '0'), name: 'Anneler Günü (Mayıs’ın 2. pazarı)', kind: 'warm', badge: ['Anneler Günü', 'Kutlu olsun'], eyebrow: 'Anneler Günü', reserve: true,
      title: 'Anneler Gününüz <em>kutlu olsun</em>', text: 'Bugün annelerinizi güzel bir sofrada ağırlamak için masanızı ayırtabilirsiniz. Tüm annelerin gününü kutlarız.'},
    {key: '19mayis', md: '05-19', name: '19 Mayıs Gençlik ve Spor Bayramı', kind: 'flag', ata: true, since: 1919, badge: ['19 Mayıs', 'Gençlik ve Spor Bayramı'], eyebrow: '19 Mayıs 1919 – 19 Mayıs {y}',
      title: 'Gençlik ve Spor Bayramımız <em>kutlu olsun</em>', text: 'Atatürk’ün Samsun’a çıkışının {n}. yılında Atatürk’ü Anma, Gençlik ve Spor Bayramımızı kutluyor, Gazi Mustafa Kemal Atatürk’ü saygı ve minnetle anıyoruz.',
      quote: 'Ey Türk gençliği! Birinci vazifen, Türk istiklalini, Türk Cumhuriyetini ilelebet muhafaza ve müdafaa etmektir.'},
    {key: 'babalar', on: y => '06-' + String(nthSunday(y, 6, 3)).padStart(2, '0'), name: 'Babalar Günü (Haziran’ın 3. pazarı)', kind: 'warm', badge: ['Babalar Günü', 'Kutlu olsun'], eyebrow: 'Babalar Günü', reserve: true,
      title: 'Babalar Gününüz <em>kutlu olsun</em>', text: 'Bugün babalarınızla güzel bir sofrada buluşmak için masanızı ayırtabilirsiniz. Tüm babaların gününü kutlarız.'},
    {key: '15temmuz', md: '07-15', name: '15 Temmuz Demokrasi ve Milli Birlik Günü', kind: 'flag', since: 2016, badge: ['15 Temmuz', 'Milli Birlik Günü'], eyebrow: '15 Temmuz 2016',
      title: 'Demokrasi ve Milli Birlik <em>Günü</em>', text: '15 Temmuz şehitlerimizi rahmetle, gazilerimizi minnetle anıyoruz.'},
    {key: '30agustos', md: '08-30', name: '30 Ağustos Zafer Bayramı', kind: 'flag', ata: true, since: 1922, badge: ['30 Ağustos', 'Zafer Bayramı'], eyebrow: '30 Ağustos 1922 – 30 Ağustos {y}',
      title: 'Zafer Bayramımız <em>kutlu olsun</em>', text: 'Büyük Zafer’in {n}. yılında başta Başkomutan Gazi Mustafa Kemal Atatürk olmak üzere tüm şehit ve gazilerimizi saygı ve minnetle anıyoruz.',
      quote: 'Ordular! İlk hedefiniz Akdeniz’dir. İleri!'},
    {key: '29ekim', md: '10-29', name: '29 Ekim Cumhuriyet Bayramı', kind: 'flag', ata: true, since: 1923, badge: ['29 Ekim', 'Cumhuriyet Bayramı'], eyebrow: '29 Ekim 1923 – 29 Ekim {y}',
      title: 'Cumhuriyet Bayramımız <em>kutlu olsun</em>', text: 'Cumhuriyetimizin {n}. yılını gururla kutluyor; başta Gazi Mustafa Kemal Atatürk olmak üzere tüm kahramanlarımızı saygı ve minnetle anıyoruz.',
      quote: 'Ne mutlu Türküm diyene!'},
    {key: '10kasim', md: '11-10', name: '10 Kasım Atatürk’ü Anma Günü', kind: 'mourn', ata: true, since: 1938, badge: ['10 Kasım', 'Saygıyla anıyoruz'], eyebrow: '10 Kasım 1938 · 09.05',
      title: 'Seni <em>özlemle</em> anıyoruz', text: 'Cumhuriyetimizin kurucusu Gazi Mustafa Kemal Atatürk’ü, aramızdan ayrılışının {n}. yılında saygı, sevgi ve özlemle anıyoruz.',
      quote: 'Benim naçiz vücudum elbet bir gün toprak olacaktır, fakat Türkiye Cumhuriyeti ilelebet payidar kalacaktır.', button: 'Saygıyla'},
    {key: 'ogretmenler', md: '11-24', name: '24 Kasım Öğretmenler Günü', kind: 'warm', badge: ['24 Kasım', 'Öğretmenler Günü'], eyebrow: '24 Kasım',
      title: 'Öğretmenler Günü <em>kutlu olsun</em>', text: 'Başöğretmenimiz Gazi Mustafa Kemal Atatürk başta olmak üzere tüm öğretmenlerimizin gününü saygıyla kutlarız.'},
    {key: 'yilsonu', md: '12-31', name: 'Yılbaşı gecesi', kind: 'warm', badge: ['31 Aralık', 'Yılbaşı gecesi'], eyebrow: '31 Aralık', reserve: true,
      title: 'Yeni yıla <em>birlikte</em> girelim', text: 'Yılın son akşamını güzel bir sofrada kutlamak için masanızı şimdiden ayırtabilirsiniz.'},
    {key: 'ramazan', religious: 'ramazan', name: 'Ramazan Bayramı', kind: 'warm', badge: ['Ramazan Bayramı', 'Mübarek olsun'], eyebrow: 'Ramazan Bayramı · {g}. gün',
      title: 'Ramazan Bayramınız <em>mübarek olsun</em>', text: 'Bayramın size ve sevdiklerinize sağlık, huzur ve bereket getirmesini dileriz.'},
    {key: 'kurban', religious: 'kurban', name: 'Kurban Bayramı', kind: 'warm', badge: ['Kurban Bayramı', 'Mübarek olsun'], eyebrow: 'Kurban Bayramı · {g}. gün',
      title: 'Kurban Bayramınız <em>mübarek olsun</em>', text: 'Bayramın size ve sevdiklerinize sağlık, huzur ve bereket getirmesini dileriz.'}
  ];
  // Özel günün o yıldaki tarih(ler)i (YYYY-MM-DD); dini bayramlar birden fazla gün sürer
  function specialDayDates(sd, y){
    if(sd.religious){
      const r = (RELIGIOUS_DAYS[y] || {})[sd.religious];
      if(!r) return [];
      const t0 = parseWall(r[0]);
      return Array.from({length: r[1]}, (_, i) => new Date(t0 + i * DAY_MS).toISOString().slice(0, 10));
    }
    return [y + '-' + (sd.on ? sd.on(y) : sd.md)];
  }
  // Verilen günün (YYYY-MM-DD) özel günü. site.specialDays === false ise hiçbiri, site.specialDaysOff içindeki anahtarlar gösterilmez
  function specialDay(site, date){
    site = site || {};
    if(site.specialDays === false) return null;
    const y = +date.slice(0, 4), off = site.specialDaysOff || [];
    for(const sd of SPECIAL_DAYS){
      if(off.includes(sd.key)) continue;
      const g = specialDayDates(sd, y).indexOf(date);
      if(g < 0) continue;
      const fill = s => String(s || '').replace(/\{y\}/g, y).replace(/\{n\}/g, sd.since ? y - sd.since : '').replace(/\{g\}/g, g + 1);
      return Object.assign({}, sd, {date, eyebrow: fill(sd.eyebrow), title: fill(sd.title), text: fill(sd.text), badge: sd.badge.map(fill)});
    }
    return null;
  }
  // Bugünden itibaren gelecek özel günler (yönetim paneli listesi için)
  function upcomingSpecialDays(fromDate, count){
    const y = +fromDate.slice(0, 4), out = [];
    [y, y + 1].forEach(yy => SPECIAL_DAYS.forEach(sd => { const d = specialDayDates(sd, yy); if(d.length && d[d.length - 1] >= fromDate) out.push({sd, date: d[0], days: d.length}); }));
    return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, count || 40);
  }
  const todayStr = () => new Date(now().wall).toISOString().slice(0, 10);

  global.CaminoCore = {
    ALLERGENS, ALLERGEN_LABELS, DAYS, slugify, prepare, findItem, stripEmoji,
    itemPhoto, isDefaultPhoto, coverPhoto, heroPhotos, layoutFor, sized,
    now, setNowOverride, parseWall, parseHM, hm,
    campaignState, describeSchedule, campaignTargets, applyDiscount, discountLabel, priceInfo, formatCountdown, newCampaign,
    campaignOnDay, EVENT_TYPES, eventType, eventDays, eventWindow, upcomingEvents, newEvent,
    announcementState, newAnnouncement, posterSlides, posterInfo, SOCIALS, socialLinks,
    openState, SPECIAL_DAYS, RELIGIOUS_DAYS, specialDay, upcomingSpecialDays, todayStr
  };
})(window);
