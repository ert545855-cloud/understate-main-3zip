# Değişiklikler

## Siyaset RP: yeni ad, modern tema, ordu ve harekât

### Ad ve görünüm
- Oyunun adı **Siyaset RP** oldu: başlık, yükleme ekranı, giriş ekranı, PWA bilgileri (`manifest.json`) ve Android uygulama adı değişti.
- Osmanlı teması kaldırıldı:
  - Kahverengi/altın renkler yerini lacivert ve camgöbeği (`#0A0F17`, `#3CC8F0`) renklere bıraktı.
  - Cinzel yazı tipinin yerine Rajdhani kullanılıyor.
  - Tuğralı logonun yerine yeni amblem geldi: `assets/brand/logo.svg` ve bundan üretilen `icon-*.png`, `favicon.png`, `siyaset-icon.png`.
  - Giriş ekranının arka planı artık koyu dünya haritası ve tarama çizgisi. Tarih bilgileri yerine oyun ipuçları gösteriliyor.
- Oyun terimleri modernleşti: Beylik → Devlet, Sikke → Para (₺), Padişah → Cumhurbaşkanı, Divan → Kabine, Sadrazam → Başbakan, Ferman → Kararname, Sefer → Harekât, Kervan → Konvoy, Lonca → Sendika, Saray → Külliye. İşler de modernleşti (Kurye, Güvenlik Görevlisi, Memur, Subay…). Değişiklik yalnızca ekrandaki yazılara uygulandı; kod, API ve veritabanı adları aynı kaldı.
- Osmanlı'ya özgü ekranlar menüden kaldırıldı: Osmanlı Ordusu, Eyalet Haritası, Osmanlı Günü, Alet Atölyesi.
- Alt menü ve ikonlar artık satır içi SVG: `src/components/IconSet.js` dosyası `scripts/gen-icon-set.js` ile üretiliyor. İkonlar temanın rengini alıyor. Yeni ikonlar: tank, asker, küre, İHA, obüs, tüfek, hedef.
- Animasyonlar: sayfa geçişlerinde yumuşak görünme, dokunma geri bildirimi, sayaçların kayarak değişmesi, üretim bandı efekti.
- Müzik aç/kapa düğmesi başlıktaki dil menüsüne taşındı; yüzen düğme içeriğin üstüne biniyordu.

### Silahlı Kuvvetler (Savaş → Silahlı Kuvvetler)
- Devlet hazinesi: her üye kendi parasından bağış yapabilir.
- Fabrikalar: silah (tüfek), tank, topçu (obüs) ve İHA fabrikaları. Her türden en fazla 5 fabrika kurulabilir ve her biri 5 seviyeye kadar yükseltilebilir. Üretim saat başına birikir ve sunucuda geçen süreye göre hesaplanır. Ekranda canlı artar.
- Asker basma: 1.000'lik partiler halinde. Her parti için tüfek, insan gücü ve hazine gerekir. İnsan gücü toprak ve üye sayısına göre yenilenir.
- Fabrika kurma, yükseltme ve asker basma kararını yalnızca devlet lideri verebilir.
- Sunucu tarafı:
  - Rotalar `server/routes/military.js` içinde, tablolar `server/migrations/014_military.sql` içinde.
  - Tablolar: `state_military`, `state_factories`, `military_operations`, `state_military_log`.

### Askeri harekât ve savaş efektleri (Dünya Haritası)
- Ülke kartındaki **Harekât** düğmesi planlama penceresini açar. Pencerede asker, tank, obüs ve İHA kaydırıcıları, saldırı gücü, tahmini direnç, mesafe, **varış süresi** (saat bilgisiyle) ve kazanma şansı görünür.
- Birlikler haritada başkentten hedefe kavisli, hareketli bir okla ilerler. Üzerinde tank simgesi ve kalan süre yazar.
- Varışta 45 saniyelik çatışma başlar: patlamalar, duman, iz mermileri ve kırmızı dalga efekti. Sonunda haritada "ZAFER" ya da "PÜSKÜRTÜLDÜ" etiketi çıkar.
- Kazanılırsa ülke devlete geçer, sağ kalan birlikler geri döner. Başka devletin ülkesine yapılan harekâtta savunan devletin garnizonu da savaşır ve kayıp verir.
- Bütün devletlerin harekâtları herkesin haritasında canlı görünür (`operation:update` olayı). Sol üstteki çip sıradaki harekâtı yakınlaştırarak gösterir. Yoldaki birlikler geri çağrılabilir.
- **Savaş efekti şeridi** (`src/components/BattleFX.js`): Silahlı Kuvvetler ekranındaki harekât kartlarında yoldaki birlikler için ilerleyen konvoy, çatışmadaki birlikler için namlu alevi, iz mermisi, patlama, duman ve sarsıntı efekti gösterilir. Aynı efekt Harekâtlar ekranında savaşı başlamış harekâtlarda da çıkar.

### Sekreter Elif ile başlangıç rehberi
- İlk girişte özgün çizimli sekreter karakteri karşılar. Konuşurken ağzı oynar, göz kırpar, yazı harf harf belirir.
- 7 adım var: vatan seç → ilk maaş → devlete katıl → orduyu tanı → fabrika kur → asker bas → ilk harekât.
- Adımlar oyuncu gerçekten yaptıkça kendiliğinden tamamlanır. Panelde ilerleme çubuğu ve adım kutucukları görünür, hedef menü düğmesi parlar.
- Bitince ₺25.000 ve 100 XP ödül verilir. Rehber küçültülebilir ya da atlanabilir.
- Dosya: `src/components/Tutorial.js`

---

## Önceki sürüm: Dünya Haritası + mobil düzeltmeler

## Yeni: Dünya Haritası (Keşfet → Dünya Haritası)

- `assets/maps/world.svg`: 237 ülkelik gerçek SVG dünya haritası. Miller projeksiyonu, Natural Earth 1:50m verisi (kamu malı), Türkçe ülke adları. Her `<path>` öğesinde ISO kodu (`id="TR"`) ve `data-name`, `data-continent`, `data-km2` bilgileri var. Türkiye ve çevresi daha ayrıntılı çizildi. KKTC ayrı ülke olarak yer alıyor.
- `src/screens/WorldMapScreen.js` (`window.WorldMapScreen`):
  - Tek parmakla kaydırma, iki parmakla yakınlaştırma, çift dokunuşla yakınlaştırma, fare tekerleği ve +/−/tüm dünya düğmeleri.
  - Üç harita modu var: Siyasi (beylik toprakları), Kıtalar ve Kaynaklar.
  - Ülkeye dokununca kart açılır: bayrak, kıta, yüzölçümü, sahibi, kaynak ve savunma değerleri, ayrıca **Fethet**, **Savaş ilan et**, **Göç et**, Ticaret ve Diplomasi eylemleri.
  - Türkçe harf duyarlı ülke araması ve "vatanına git" düğmesi var.
  - Dünya güçleri sıralaması ve savaş ile diplomasi sayfalarına kısayollar eklendi.
- Haritayı yeniden üretmek için: `scripts/gen-world-map.js` (kurulum notu dosyanın başında).

## Toprak sahipliği sunucuda (kalıcı, hileye kapalı)

- Yeni tablo `world_territories` ve kayıt tablosu `world_territory_log` var (`server/migrations/013_world_map.sql`). Sunucu açılırken otomatik uygulanır.
- `server/routes/world.js` şu uç noktaları sağlar:
  - `GET /api/world/territories`: tüm sahiplikleri döner.
  - `GET /api/world/me`: oyuncunun beyliğini, liderlik durumunu ve vatanını döner.
  - `GET /api/world/log`: son fetih, bırakma ve savaş kayıtlarını döner.
  - `POST /api/world/conquer`, `/release`, `/migrate`: fetih, toprak bırakma ve göç.
- Kurallar sunucuda uygulanır:
  - Ülke kodu geçerli olmalı (sunucu `world.svg` dosyasını okuyarak doğrular).
  - Fethi ve bırakmayı yalnızca beylik lideri yapabilir.
  - Ülke boş olmalı. Aynı anda iki beylik aynı ülkeyi almaya çalışırsa veritabanı işlemi yalnızca birine izin verir.
  - Fetih bedeli sunucuda hesaplanır ve sikke sunucuda düşülür.
- Değişiklikler `worldMapUpdate` olayıyla herkese yayınlanır. Sonradan giren oyuncu da haritayı açılışta sunucudan çeker.
- İstemciden `stateUpdate` ile sahte `worldMap` gönderimi sunucuda engellendi.
- Dağılan beyliğin toprakları otomatik olarak serbest kalır.
- **Ülke için savaş:** Haritada başka beyliğin ülkesinde "Savaş ilan et", `/api/beylik-war/declare` isteğine `targetCountry` ekler. Savaşı saldıran kazanırsa ülke ona geçer (`beylikWar.js` → `resolve`). Aynı ülke için aynı anda tek savaş açılabilir.
- Ek düzeltme: Oyun ekranı socket bağlantısından sonra açılırsa sunucunun ilk durumu (beylik listesi vb.) kaçırılıyordu ve beylikler boş görünüyordu. İstemci artık `requestInitialState` ile bu durumu yeniden istiyor.

## Mobil hata düzeltmeleri

| Sorun | Düzeltme |
|---|---|
| Alt menü ve birçok ekranda ikonlar kırıktı (`/icons/64/...` 404) | Yollar `/public/icons/64/...` yapıldı. Sunucuya `/icons` ve `/sounds` takma adları eklendi. Kırık resim artık alt yazı yerine gizleniyor. |
| `GücPuaniScreen.js` ve `AletAtölyesiScreen.js` dosyalarının Türkçe karakterli adları zip, Windows ve APK kopyalarında bozulup 404 veriyordu | Dosyalar `GucPuaniScreen.js` ve `AletAtolyesiScreen.js` olarak yeniden adlandırıldı. |
| Sohbet giriş kutusu alt menünün arkasında kalıyordu, gönder düğmesi ekrandan taşıyordu | Yükseklik artık ölçülerek hesaplanıyor (`useFitHeight`) ve giriş kutusuna `min-width:0` verildi. |
| Bölge haritasının ("Harita") alt kısmı menünün altında kalıyordu | Aynı ölçümlü yükseklik kullanıldı. |
| Klavye açılınca alt menü klavyenin üstüne yapışıyordu | Yazı alanı odaktayken alt menü gizleniyor. Ayrıca `interactive-widget=resizes-content` eklendi. |
| iPhone çentiği / durum çubuğu başlığın üstüne biniyordu | Başlığa ve bildirim şeritlerine `safe-area-inset-top` eklendi. |
| Alt menü paneli iPhone ev çubuğunda menünün üstüne biniyordu, masaüstünde taşıyordu | `safe-area-inset-bottom` hesaba katıldı ve genişlik kapsayıcıya göre ayarlandı. |
| Sayfa değişince yeni sayfa aşağı kaymış açılıyordu | Sayfa değişiminde kaydırma en üste sıfırlanıyor. |
| Android geri tuşu uygulamayı kapatıyordu | Sayfa geçişleri tarayıcı geçmişine yazılıyor, geri tuşu önceki sayfaya dönüyor. |
| Müzik düğmesi içeriğin ve sohbetin gönder düğmesinin üstüne biniyordu | Konumu güvenli alana göre ayarlandı, alt bölümde giriş kutusu olan sayfalarda gizleniyor. İçeriğin alt boşluğu artırıldı. |
| Dar ekranlarda (360px ve altı) isim kesiliyordu | Gerektiğinde ikincil rozetler gizleniyor. |
| Esnek satır ve ızgara taşmaları (wiki, başarılar, gazete sekmeleri vb.) | Genel `min-width:0` ve `minmax(0,1fr)` kuralları eklendi, gazete sekmeleri kaydırılabilir oldu. |
| Giriş ekranı 4 saniye yükleme perdesinin arkasında bekliyordu | Perde ilk çizimden hemen sonra kapanıyor. |
| CDN engelliyken yerel Babel geç yüklenirse uygulama JSX hatasıyla çöküyordu | Açılış, Babel, React ve ReactDOM hazır olana kadar bekliyor. Yedek dosyalar sırayla yükleniyor. |
| **APK:** `prepare-android.js` içinde `window._SALTANAT ONLINE_SERVER_URL` sözdizimi hatası vardı, APK sunucuya bağlanamıyordu | Değişken düzeltildi. `www/config.js` artık yazılıyor ve APK içindeki `/api/...` istekleri otomatik olarak sunucuya yönleniyor. |
| "Parti" menüsü boş sayfa açıyordu (ekran yüklenmiyordu, `parties` tanımsızdı) | `PartyCenterScreen` yükleniyor ve doğru prop'larla açılıyor. |
| `gang` sayfasına giden düğmeler boş sayfa açıyordu | `GangPage` bağlandı. Tanımsız sayfalarda boş ekran yerine "Ana sayfaya dön" kartı çıkıyor. |
| Dünya sayfasındaki kısayolların çoğu çalışmayan sayfalara gidiyordu | Hepsi gerçek sayfalara yönlendirildi. |
