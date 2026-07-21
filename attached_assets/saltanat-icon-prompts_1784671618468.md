# SALTANAT ONLINE — İkon Yeniden Tasarım Prompt Rehberi

Proje: "Ottoman AAA" dark-fantasy/siyaset-mafya stratejisi.
Palet: bg `#0F1115` · surface `#1B1E25` · gold `#C89B3C` / `#E8C06A` · text `#F5EBD7`
Fontlar: Cinzel (başlık), Inter (UI). Mevcut ikonlar basit çizgi (line-stroke) SVG — hedef, bunları premium, tutarlı, "AI-illustration" kalitesinde bir sete taşımak.

---

## 1) MASTER STYLE PROMPT (her ikonun başına ekle)

```
A single premium mobile-game UI icon, Ottoman-empire dark political strategy
game aesthetic ("Saltanat Online"), centered on a transparent background,
flat vector illustration with subtle depth via soft bevels and inner shadow,
rich gold (#C89B3C, #E8C06A) and deep charcoal (#1B1E25, #0F1115) color
palette with warm parchment cream (#F5EBD7) highlights, thin engraved gold
outline, subtle metallic gradient, ornate but minimal Ottoman-motif details
(no clutter), soft ambient occlusion, slight glow on gold edges, no text,
no watermark, no background scene, icon fills 80% of frame, square 1:1
composition, game-asset render style, highly polished, consistent lighting
from top-left, --style raw --v 6
```

*(Midjourney kullanıyorsan sona `--style raw --v 6 --stylize 250` ekle;
DALL·E/GPT-Image ya da Ideogram kullanıyorsan cümleyi olduğu gibi yapıştır,
`--` parametrelerini sil.)*

**Negative prompt (destekleyen araçlarda):** `text, watermark, signature, photo, 3d render, cartoon, cluttered background, multiple objects, blurry, low detail, extra limbs`

---

## 2) ANA UI İKONLARI — `assets/icons/`

| Dosya | Konu | Prompt eki (master prompt + bunu ekle) |
|---|---|---|
| home.svg | Ana Sayfa | "a fortified Ottoman palace gate icon, symbolizing home/capital" |
| shield.svg | Kalkan/Savunma | "an ornate Janissary shield with engraved crescent emblem" |
| newspaper.svg | Haberler | "a rolled royal decree/scroll with wax seal, news bulletin symbol" |
| settings.svg | Ayarlar | "an ornate gold gear/cog with filigree engraving" |
| law.svg | Kanun | "a judge's gavel crossed with an Ottoman scale of justice" |
| mercenary.svg | Paralı Asker | "a crossed scimitar and dagger, mercenary insignia" |
| treaty.svg | Antlaşma | "two hands shaking over a sealed treaty scroll" |
| factory.svg | Fabrika | "an ornate industrial chimney with gears, Ottoman-era factory" |
| education.svg | Eğitim | "an open book with a feather quill and graduation tassel" |
| flag.svg | Bayrak | "a waving Ottoman-style crescent-star flag on an ornate pole" |
| chart.svg | Grafik | "an ascending bar chart made of gold ingots, growth symbol" |
| money.svg | Para | "a stack of gold coins with an engraved crescent emblem" |
| throne.svg | Taht | "an ornate royal throne with velvet cushion and gold armrests" |
| truck.svg | Nakliye | "an ornate caravan/wagon icon, trade transport symbol" |
| repair.svg | Tamir | "a wrench and hammer crossed over a gear, repair symbol" |
| bank.svg | Banka | "an ornate domed treasury building with columns" |
| chat.svg | Sohbet | "an ornate speech bubble with a small crescent motif" |
| medal-tiers.svg | Rütbe/Madalya | "a tiered medal with ribbon, rank insignia" |
| sword.svg | Kılıç | "a single ornate scimitar with jeweled hilt, diagonal composition" |
| user.svg | Kullanıcı | "a silhouette bust wearing an ornate turban" |
| government.svg | Hükümet | "an ornate domed government building (like a small mosque/parliament)" |
| vote.svg | Oylama | "a ballot box with a hand dropping a sealed vote card" |
| farm.svg | Çiftlik | "a wheat sheaf crossed with a scythe, farmland symbol" |
| crown.svg | Taç | "an ornate sultan's crown with jewel centerpiece" |
| tasks.svg | Görevler | "a checklist scroll with a gold checkmark seal" |
| mining.svg | Madencilik | "a pickaxe crossed with a gold ore chunk" |
| weapon.svg | Silah | "an ornate flintlock pistol with engraved barrel" |
| users.svg | Kullanıcılar | "two turbaned silhouette busts side by side" |
| briefcase.svg | Çanta | "an ornate leather briefcase with gold clasp" |
| trophy.svg | Kupa | "an ornate gold trophy cup with crescent handles" |
| map.svg | Harita | "a rolled antique map with a wax seal and compass rose" |

### `assets/icons/jobs/` — Meslek İkonları

| Dosya | Konu | Prompt eki |
|---|---|---|
| engineer.svg | Mühendis | "a hard hat with a wrench, engineer trade icon" |
| trash.svg | Çöpçü | "a trash bin with a broom, sanitation worker icon" |
| programmer.svg | Programcı | "a laptop with code brackets glowing gold" |
| warehouse.svg | Depo İşçisi | "stacked crates inside an ornate warehouse silhouette" |
| porter.svg | Hamal | "a figure carrying a large sack over the shoulder" |
| pilot.svg | Pilot | "an aviator cap and goggles with wings emblem" |
| chef.svg | Aşçı | "a chef's toque hat with crossed spoon and knife" |
| miner.svg | Madenci | "a miner's helmet with a lamp and pickaxe" |
| doctor.svg | Doktor | "a medical caduceus with a red crescent (Ottoman medical symbol)" |

---

## 3) OYUN İÇİ ITEM İKONLARI — `public/icons/64/`

*(Bu set daha "RPG item icon" tarzı; aynı master style'a ek olarak şu satırı kullan: "RPG inventory item icon, isometric-lit, single object centered, subtle drop shadow beneath")*

| Dosya | Konu | Prompt eki |
|---|---|---|
| sword.svg / png | Kılıç | "a straight steel longsword with gold hilt" |
| swordWood.png | Tahta Kılıç | "a wooden practice sword, worn texture" |
| dagger.png | Hançer | "a curved jeweled dagger" |
| axe.png / axe2.png | Balta | "a single-headed battle axe with leather-wrapped handle" |
| axeDouble.png / axeDouble2.png | Çift Ağızlı Balta | "a double-headed battle axe, ornate engravings" |
| bow.png | Yay | "an ornate recurve bow with gold string fittings" |
| wand.png | Asa | "a jeweled magic wand with a glowing crescent tip" |
| hammer.png | Çekiç | "a heavy war hammer with gold-capped head" |
| shield.png / shieldSmall.png | Kalkan | "a round Ottoman shield with crescent emblem" |
| armor.png | Zırh | "an ornate chest plate armor, engraved gold trim" |
| helmet.png | Miğfer | "an ornate Janissary helmet with plume" |
| tools.png | Aletler | "a bundled set of craftsman tools tied with leather strap" |
| backpack.png | Sırt Çantası | "a worn leather adventurer's backpack" |
| tome.png | Kitap/Tılsım | "a closed leather-bound tome with gold clasp and glowing rune" |
| scroll.png | Parşömen | "a rolled parchment scroll with a wax crescent seal" |
| map.png | Harita | "a folded treasure map with a torn edge" |
| coin.png | Altın Para | "a single gold coin with an embossed crescent" |
| gemRed.png / gemBlue.png / gemGreen.png | Mücevher | "a faceted gemstone gem in [red / blue / green], sparkling highlight" |
| potionRed.png / potionBlue.png / potionGreen.png | İksir | "a glass potion vial filled with glowing [red / blue / green] liquid, cork stopper" |
| heart.png | Can | "a stylized ruby heart with gold filigree border" |
| envelope.png | Zarf | "a sealed letter envelope with a wax crescent stamp" |
| x.png | Kapat/İptal | "a bold gold X mark with beveled edges, cancel icon" |
| upg_sword.png / upg_dagger.png / upg_axe.png / upg_axeDouble.png / upg_bow.png / upg_wand.png / upg_hammer.png / upg_spear.png | Yükseltilmiş Silah | "the same weapon as [ilgili item], but glowing with gold runic energy, enchanted upgrade version, extra ornamentation" |
| upg_shield.png / upg_shieldSmall.png | Yükseltilmiş Kalkan | "an enchanted shield glowing with gold runic energy" |
| upg_armor.png / upg_helmet.png | Yükseltilmiş Zırh | "enchanted armor piece glowing with gold runic energy" |

---

## 4) KULLANIM İPUCU

1. Önce **3-4 pilot ikon** üret (örn. crown, sword, throne, coin) ve stili onayla.
2. Beğendiğin çıktıyı referans görsel olarak (image prompt / `--sref` Midjourney'de) diğer tüm ikonlara ekle — bu, setin tutarlılığını garanti eder.
3. Üretilen görselleri arka planı transparan PNG olarak dışa aktar (remove.bg veya "transparent background" ibaresiyle) ve mevcut SVG'lerin yerine `assets/icons/` ve `public/icons/64/` klasörlerine aynı dosya adlarıyla koy — kodda değişiklik gerekmez.
4. SVG gerekiyorsa (kod `currentColor` ile renk değiştiriyor), PNG'yi vektörize edip tek renkli/gold varyant olarak da üretebilirsin.
