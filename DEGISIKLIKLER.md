# Değişiklikler — Dünya Haritası + Mobil Düzeltmeler

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
