# Camino Pub – Ücretsiz QR Menü (GitHub Pages)

| Dosya | Görevi |
|---|---|
| `index.html` | Müşterinin QR ile açtığı menü sayfası |
| `admin.html` | Yönetim paneli (fiyat gizle/göster, sıralama, düzenleme, QR üretme) |
| `menu.json` | Tüm menü verisi (panel bu dosyayı günceller) |
| `.nojekyll` | GitHub Pages'in dosyaları olduğu gibi yayınlaması için |

## 1. GitHub'a yükleme (tek seferlik)

1. https://github.com adresinde ücretsiz hesap açın.
2. Sağ üstteki **+ → New repository** ile yeni repo açın. Örnek ad: `camino-menu`. **Public** seçin ve oluşturun.
3. Repo sayfasında **"uploading an existing file"** bağlantısına tıklayın. `index.html`, `admin.html`, `menu.json` ve `.nojekyll` dosyalarını sürükleyip **Commit changes** düğmesine basın.
   (`.nojekyll` Windows'ta görünmezse şart değildir, atlayabilirsiniz.)
4. **Settings → Pages** bölümüne gidin. *Source*: **Deploy from a branch**, *Branch*: **main** ve **/(root)** seçip **Save** düğmesine basın.
5. 1-2 dakika sonra menünüz şu adreste yayında olur:
   `https://KULLANICIADI.github.io/camino-menu/`

## 2. Panel için token oluşturma (tek seferlik)

Panelin `menu.json` dosyasını güncelleyebilmesi için bir anahtar (token) gerekir:

1. GitHub'da **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token** yolunu izleyin.
2. *Repository access*: **Only select repositories** → `camino-menu`.
3. *Permissions → Repository permissions → Contents*: **Read and write**.
4. Süreyi uzun tutabilirsiniz (ör. 1 yıl). Oluşturulan `github_pat_...` değerini kopyalayın.
5. `https://KULLANICIADI.github.io/camino-menu/admin.html` adresini açın. **GitHub Bağlantısı** sekmesinde kullanıcı adı ve repo adı otomatik dolar. Token'ı yapıştırıp **Kaydet ve Test Et** düğmesine basın.

Token yalnızca o cihazın tarayıcısında saklanır. Paneli başka bir telefon veya bilgisayarda kullanacaksanız token'ı orada da bir kez girmeniz gerekir.
**Güvenlik:** Panel sayfası herkese açık olsa bile token'ı olmayan kişi hiçbir değişikliği kaydedemez. Token'ı kimseyle paylaşmayın. Bir cihazı kaybederseniz GitHub'dan token'ı silip yenisini oluşturun.

## 3. Panelin kullanımı

- **Menüde fiyatları göster**: Tüm menüdeki fiyatları tek tuşla gizler veya gösterir.
- Her kategoride **Görünür** ve **Fiyatlar** anahtarları vardır: kategoriyi tamamen gizleyebilir ya da yalnızca o kategorinin fiyatlarını kapatabilirsiniz.
- Her üründe **Görünür** ve **Fiyat** anahtarları vardır. Tükenen ürünü silmeden gizleyebilirsiniz.
- **Sıralama**: ⋮⋮ tutamacından sürükleyin veya ▲ ▼ düğmelerini kullanın.
- **Detay** düğmesi açıklama, kalori, alerjen ve eser miktar uyarısı alanlarını açar. Ürünü başka kategoriye taşıma, kopyalama ve silme işlemleri de buradadır.
- İşiniz bitince **Kaydet ve Yayınla** düğmesine basın. Değişiklik 1-2 dakika içinde menüde görünür.
- **QR Kod** sekmesinde menü adresinin QR kodunu PNG olarak indirip bastırabilirsiniz. QR kod sabittir; menüyü ne kadar değiştirirseniz değiştirin aynı QR çalışmaya devam eder.
- **İşletme Bilgileri → Yedeği indir** ile menünün yedeğini bilgisayarınıza alabilirsiniz.

## Notlar

- Dosyaları bilgisayarda çift tıklayarak açarsanız menü yüklenmez, çünkü tarayıcılar yerel dosyadan `menu.json` okumayı engeller. Sayfaları GitHub Pages adresi üzerinden kullanın.
- Tüm sistem ücretsizdir: GitHub Pages barındırma, GitHub API ve QR üretimi için ücret alınmaz.
