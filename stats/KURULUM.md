# Menü İstatistikleri — Kurulum (~10 dakika)

Yönetim panelindeki **İstatistikler** sekmesi, menü ziyaretlerini küçük ve ücretsiz bir Cloudflare sunucusunda toplar (`stats/worker.js`). Bu kurulum bir kez yapılır.

Toplanan bilgiler: ziyaret sayısı, tekil ziyaretçi, ziyaretçinin nereden geldiği (QR kod, Instagram, Google…), cihaz, şehir, menüde nelere tıklandığı, neler arandığı, hangi gün ve saatte gelindiği ve tıklama ısı haritası.
Kişisel veri tutulmaz: çerez yok, IP adresi saklanmaz. Kayıtlar 120 gün sonra kendiliğinden silinir.

---

## 1) Cloudflare'de sunucuyu kurun

1. https://dash.cloudflare.com adresinden ücretsiz hesap açın (varsa giriş yapın).
2. **Storage & Databases → D1 SQL Database → Create database**. Adı: `camino-istatistik` → **Create**.
3. **Workers & Pages → Create → Create Worker** (Start with Hello World). Adı: `camino-istatistik` → **Deploy**.
4. **Edit code**: içindeki her şeyi silin, `stats/worker.js` dosyasının tamamını yapıştırın → **Deploy**.
5. Worker → **Settings → Bindings → Add → D1 database**: Variable name `DB`, veritabanı `camino-istatistik` → **Deploy / Save**.
6. Worker → **Settings → Triggers → Cron Triggers → Add**: `0 3 * * *` (her gece eski kayıtları siler).
7. Worker → **Settings → Variables and Secrets → Add**:

| Ad | Tür | Değer |
|---|---|---|
| `ADMIN_KEY` | **Secret** | Uzun, rastgele bir anahtar (aşağıda nasıl üretileceği yazıyor) |
| `SITE_URL` | Text | `https://lacaminosocialmedia.github.io/camino-menu` |
| `ALLOWED_ORIGIN` | Text | `https://lacaminosocialmedia.github.io` |

`ADMIN_KEY` üretmek için Windows'ta PowerShell'i açıp şunu yapıştırın; çıkan 40 karakteri kopyalayın:
```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

Worker adresiniz `https://camino-istatistik.<hesap-adınız>.workers.dev` olur. Tarayıcıda açınca **"Camino istatistik sunucusu çalışıyor."** yazmalı.

## 2) Yönetim paneline bağlayın

1. Panel → **Güvenlik → İstatistik sunucusu**.
2. **Sunucu adresi**: `https://camino-istatistik.<hesap-adınız>.workers.dev`
3. **Yönetici anahtarı**: yukarıdaki `ADMIN_KEY`
4. **Mevcut şifre**: panel şifreniz → **Kaydet ve test et**.

Panel bağlantıyı test eder, anahtarı şifrenizle şifreleyip saklar ve menüye sayacı ekleyip **yayınlar**. O andan sonraki ziyaretler **İstatistikler** sekmesinde görünür.

## Bilmeniz gerekenler

- **Kendi girişleriniz sayılmaz.** Paneli açtığınız tarayıcıdan menüye girişler istatistiğe karışmaz. Denemek isterseniz İstatistikler'deki **Bu tarayıcıyı da say** anahtarını açın, işiniz bitince kapatın.
- **QR koddan gelenler ayrı görünür.** Panel → QR Kod sekmesindeki kod `?src=qr` ile biter. Masalardaki eski QR kodlar da çalışmaya devam eder ama "Doğrudan" olarak sayılır. Ayrı görmek isterseniz yeni QR'ı bastırın.
- Instagram biyografisindeki bağlantının sonuna `?src=instagram` eklerseniz Instagram'dan gelenler kesin olarak ayrılır.
- Cloudflare'in ücretsiz planı günde 100.000 isteğe kadar yeterlidir; bir menü için bu sınıra yaklaşılmaz.
