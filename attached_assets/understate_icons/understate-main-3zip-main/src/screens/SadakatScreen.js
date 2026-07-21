"use strict";
// ═══════════════════════════════════════════════════════
// SALTANAT ONLINE — Sadakat Puanı Ekranı
// Günlük görevler, haftalık hedefler, etkinlik ödülleri
// ═══════════════════════════════════════════════════════

const SADAKAT_GOREVLER = [
  // ── Günlük görevler (her gün sıfırlanır)
  { id:'gunluk_giris',    grup:'gunluk',  emoji:'🌅', baslik:'Günlük Giriş',          acik:'Her gün oyuna giriş yap',                      odul:50,   tip:'giris' },
  { id:'gunluk_sohbet',   grup:'gunluk',  emoji:'💬', baslik:'Sohbet Et',             acik:'Sohbet kanalında en az 1 mesaj gönder',         odul:30,   tip:'sohbet' },
  { id:'gunluk_banka',    grup:'gunluk',  emoji:'🏦', baslik:'Banka İşlemi',          acik:'Bankadan para yatır veya çek',                  odul:40,   tip:'banka' },
  { id:'gunluk_haber',    grup:'gunluk',  emoji:'📰', baslik:'Haberleri Oku',          acik:'Kraliyet Habercisi\'ni ziyaret et',             odul:25,   tip:'haber' },
  { id:'gunluk_pvp',      grup:'gunluk',  emoji:'⚔️', baslik:'Dövüş Alanı',           acik:'PvP alanında 1 dövüş yap',                     odul:75,   tip:'pvp' },
  { id:'gunluk_pazaryeri',grup:'gunluk',  emoji:'🛒', baslik:'Pazar Ziyareti',        acik:'Pazar yerine git',                              odul:20,   tip:'pazar' },
  { id:'gunluk_tarim',    grup:'gunluk',  emoji:'🌾', baslik:'Tarım Faaliyeti',       acik:'Tarlandan hasat yap (+Gıda Puanı)',             odul:60,   tip:'giris' },
  { id:'gunluk_maden',    grup:'gunluk',  emoji:'⛏️', baslik:'Madencilik',            acik:'Maden sayfasından kaynak çıkar',                odul:45,   tip:'giris' },
  { id:'gunluk_alet',     grup:'gunluk',  emoji:'⚒️', baslik:'Alet Atölyesi',         acik:'Alet Atölyesi\'nde üretim başlat',              odul:80,   tip:'giris' },
  // ── Haftalık görevler
  { id:'haftalik_eyalet', grup:'haftalik',emoji:'🏰', baslik:'Eyalet Yöneticisi',     acik:'Eyalet haritasını 3 kez ziyaret et',            odul:300,  tip:'eyalet' },
  { id:'haftalik_beylik', grup:'haftalik',emoji:'⚜️', baslik:'Beylik Üyesi',          acik:'Bir beyliğe katıl veya kur',                    odul:500,  tip:'beylik' },
  { id:'haftalik_para',   grup:'haftalik',emoji:'💰', baslik:'Büyük Tüccar',          acik:'Bu hafta toplam 100.000 🪙 harca',              odul:400,  tip:'para' },
  { id:'haftalik_seviye', grup:'haftalik',emoji:'⭐', baslik:'Tecrübe Kazanımı',      acik:'Bu hafta 5.000 XP kazan',                       odul:350,  tip:'xp' },
  { id:'haftalik_lonca',  grup:'haftalik',emoji:'🔨', baslik:'Lonca Faaliyeti',       acik:'Lonca ekranını ziyaret et',                     odul:200,  tip:'lonca' },
  { id:'haftalik_guc',    grup:'haftalik',emoji:'⚡', baslik:'Güç Gelişimi',          acik:'Bu hafta toplamda 500 Güç Puanı kazan',         odul:600,  tip:'guc' },
  { id:'haftalik_ordu',   grup:'haftalik',emoji:'🪖', baslik:'Osmanlı Ordusu',        acik:'En az 3 asker işe al bu hafta',                 odul:450,  tip:'ordu' },
  { id:'haftalik_sancak', grup:'haftalik',emoji:'🗺️', baslik:'Sancak Fetheden',       acik:'Beyliğine en az 1 sancak fethet',               odul:800,  tip:'beylik' },
  // ── Özel etkinlikler (kalıcı)
  { id:'ozel_vali',       grup:'ozel',    emoji:'👑', baslik:'Vali Ol',               acik:'Bir eyaletin valisi ol',                        odul:1000, tip:'vali' },
  { id:'ozel_seviye10',   grup:'ozel',    emoji:'🏅', baslik:'10. Seviye',            acik:'Seviye 10\'a ulaş',                             odul:800,  tip:'seviye', hedef:10 },
  { id:'ozel_seviye25',   grup:'ozel',    emoji:'🦅', baslik:'25. Seviye',            acik:'Seviye 25\'e ulaş',                             odul:2000, tip:'seviye', hedef:25 },
  { id:'ozel_milyoner',   grup:'ozel',    emoji:'💎', baslik:'Milyoner',              acik:'1.000.000 🪙 biriktir',                         odul:1500, tip:'servet' },
  { id:'ozel_serasker',   grup:'ozel',    emoji:'⚔️', baslik:'Seraskerlik',           acik:'Osmanlı Ordusu\'ndan asker işe al',             odul:600,  tip:'ordu' },
  { id:'ozel_demirci',    grup:'ozel',    emoji:'⚒️', baslik:'Demirci Ustası',        acik:'Alet Atölyesi\'nde Lv.3 silah üret',           odul:1200, tip:'giris' },
  { id:'ozel_sancakbeyi', grup:'ozel',    emoji:'🏴', baslik:'Sancak Beyi',           acik:'Beyliğinle en az 3 sancak kontrol et',          odul:2500, tip:'sancak', hedef:3 },
  { id:'ozel_100k_guc',   grup:'ozel',    emoji:'⚡', baslik:'Güç Mirası',            acik:'100.000 Güç Puanı\'na ulaş',                   odul:5000, tip:'guc',    hedef:100000 },
];

const GRUP_BILGI = {
  gunluk:  { label:'Günlük Görevler',   emoji:'🌅', renk:'#3E8C5A', acik:'Her gün sıfırlanır',           periyot: 86400000 },
  haftalik:{ label:'Haftalık Hedefler', emoji:'📅', renk:'#5B8DD9', acik:'Her Pazartesi sıfırlanır',     periyot: 604800000 },
  ozel:    { label:'Özel Etkinlikler',  emoji:'✨', renk:'#C89B3C', acik:'Kalıcı başarım ödülleri',      periyot: null },
};

const LS_KEY = 'rep_sadakat_gorevler';

window.SadakatScreen = function SadakatScreen({ profile, setProfile, setCurrentPage, showNotif }) {
  const [durum, setDurum] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
  });
  const [claiming, setClaiming] = React.useState(null);

  const loyaltyPoints = profile?.loyaltyPoints || profile?.sadakat || 0;
  const uid = profile?.uid || profile?.id;

  // Periyot doldu mu kontrol
  function periyotDoldu(gorevId, periyot) {
    if (!periyot) return false; // ozel görevler sıfırlanmaz
    const d = durum[gorevId];
    if (!d?.tamamlandiTs) return false;
    return Date.now() - d.tamamlandiTs < periyot;
  }

  function tamamlandi(gorevId, periyot) {
    const d = durum[gorevId];
    if (!d?.tamamlandi) return false;
    if (!periyot) return true; // ozel kalıcı
    return Date.now() - d.tamamlandiTs < periyot;
  }

  // Koşul kontrolü — profil verisine göre otomatik kilidi kaldır
  function kosulKarsilandi(gorev) {
    const p = profile || {};
    switch (gorev.tip) {
      case 'giris':   return true; // ekrana girince otomatik
      case 'seviye':  return (p.level||1) >= (gorev.hedef||1);
      case 'servet':  return (p.money||0) + (p.bankMoney||0) >= 1000000;
      case 'beylik':  return !!p.beylikId;
      case 'vali': {
        try {
          const vd = JSON.parse(localStorage.getItem('rep_valiVerisi')||'{}');
          return !!Object.entries(vd).find(([,v])=>v.valiId===uid);
        } catch { return false; }
      }
      case 'guc': {
        const guc = window.hesaplaGucPuani ? window.hesaplaGucPuani(p).toplam : 0;
        return guc >= (gorev.hedef || 500);
      }
      case 'sancak': {
        const beyliks = JSON.parse(localStorage.getItem('rep_beyliks')||'[]');
        const benimBeylik = beyliks.find(b=>b.kurucuId===uid||(b.uyeler||[]).includes(uid));
        return (benimBeylik?.eyaletler||[]).length >= (gorev.hedef||3);
      }
      default: return false; // diğerleri manuel talep
    }
  }

  async function oduluAl(gorev) {
    if (claiming) return;
    if (tamamlandi(gorev.id, GRUP_BILGI[gorev.grup].periyot)) {
      showNotif('Bu görevi zaten tamamladınız!', 'error'); return;
    }
    setClaiming(gorev.id);
    try {
      const token = localStorage.getItem('us_jwt') || '';
      const yeniPuan = loyaltyPoints + gorev.odul;

      // Sunucuya kaydet
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ loyaltyPoints: yeniPuan }),
      }).catch(() => {});

      // Profili güncelle
      const np = { ...profile, loyaltyPoints: yeniPuan };
      setProfile(np);
      localStorage.setItem('rep_userProfile', JSON.stringify(np));

      // Durumu güncelle
      const yeniDurum = { ...durum, [gorev.id]: { tamamlandi: true, tamamlandiTs: Date.now() } };
      setDurum(yeniDurum);
      localStorage.setItem(LS_KEY, JSON.stringify(yeniDurum));

      showNotif(`💎 +${gorev.odul} Sadakat Puanı! (Toplam: ${yeniPuan.toLocaleString('tr-TR')})`, 'success');
    } catch (e) {
      showNotif('Hata: ' + e.message, 'error');
    }
    setClaiming(null);
  }

  const gruplar = ['gunluk', 'haftalik', 'ozel'];

  return React.createElement('div', {
    style: { minHeight: '100vh', background: '#0F0800', fontFamily: "'Inter',sans-serif", paddingBottom: 90 }
  },
    // Header
    React.createElement('div', {
      style: { background: 'linear-gradient(135deg,#1a1000 0%,#2d1e00 50%,#1a1000 100%)', borderBottom: '1px solid rgba(200,155,60,0.25)', padding: '14px 16px' }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
        React.createElement('button', {
          onClick: () => setCurrentPage('home'),
          style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 10px', color: '#8893A1', fontSize: '0.75rem', cursor: 'pointer' }
        }, '← Geri'),
        React.createElement('div', { style: { fontSize: '1.3rem' } }, '💎'),
        React.createElement('div', null,
          React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: '1.1rem', color: '#C89B3C' } }, 'Sadakat Puanı'),
          React.createElement('div', { style: { fontSize: '0.65rem', color: '#8893A1', marginTop: 1 } }, 'Görevler tamamla, sadakat kazan, beylik kur')
        )
      ),
      // Puan banner
      React.createElement('div', {
        style: { background: 'linear-gradient(135deg,rgba(200,155,60,0.15),rgba(200,155,60,0.05))', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
      },
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '0.65rem', color: '#8893A1', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.1em' } }, 'Mevcut Sadakat Puanı'),
          React.createElement('div', { style: { fontFamily: "'JetBrains Mono',monospace", fontSize: '1.8rem', fontWeight: 900, color: '#C89B3C' } }, loyaltyPoints.toLocaleString('tr-TR'))
        ),
        React.createElement('div', { style: { textAlign: 'right' } },
          React.createElement('div', { style: { fontSize: '2rem' } }, '💎'),
          React.createElement('div', { style: { fontSize: '0.6rem', color: '#8893A1', marginTop: 2 } }, 'Beylik kurmak için\n150.000 gerekli')
        )
      )
    ),

    // Görev grupları
    React.createElement('div', { style: { padding: '12px' } },

      React.createElement('div', { style: { background: 'rgba(62,140,90,0.08)', border: '1px solid rgba(62,140,90,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: '0.72rem', color: '#3E8C5A', lineHeight: 1.5 } },
        '💡 Sadakat Puanı beylik kurma, özel unvan alma ve imparatorluk içi ayrıcalıklar için kullanılır. Puanlar her gün görevler tamamlanarak kazanılır.'
      ),

      gruplar.map(grupId => {
        const grup = GRUP_BILGI[grupId];
        const gorevler = SADAKAT_GOREVLER.filter(g => g.grup === grupId);
        const tamamlananSayi = gorevler.filter(g => tamamlandi(g.id, grup.periyot)).length;

        return React.createElement('div', { key: grupId, style: { marginBottom: 16 } },
          // Grup başlığı
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 2px' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
              React.createElement('span', { style: { fontSize: '1rem' } }, grup.emoji),
              React.createElement('span', { style: { fontFamily: "'Cinzel',serif", fontSize: '0.85rem', fontWeight: 700, color: grup.renk } }, grup.label)
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
              React.createElement('span', { style: { fontSize: '0.62rem', color: '#8893A1' } }, grup.acik),
              React.createElement('span', { style: { fontSize: '0.65rem', background: `${grup.renk}22`, border: `1px solid ${grup.renk}44`, borderRadius: 6, padding: '2px 7px', color: grup.renk, fontWeight: 700 } },
                `${tamamlananSayi}/${gorevler.length}`)
            )
          ),

          // Görev kartları
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
            gorevler.map(gorev => {
              const tamam = tamamlandi(gorev.id, grup.periyot);
              const otomatik = kosulKarsilandi(gorev);
              const yukleniyor = claiming === gorev.id;

              return React.createElement('div', {
                key: gorev.id,
                style: {
                  background: tamam ? 'rgba(62,140,90,0.07)' : 'rgba(27,33,43,0.8)',
                  border: `1px solid ${tamam ? 'rgba(62,140,90,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  borderLeft: `3px solid ${tamam ? '#3E8C5A' : grup.renk}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: tamam ? 0.8 : 1,
                }
              },
                React.createElement('div', { style: { fontSize: '1.5rem', flexShrink: 0 } }, tamam ? '✅' : gorev.emoji),
                React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                  React.createElement('div', { style: { fontSize: '0.82rem', fontWeight: 700, color: tamam ? '#3E8C5A' : '#EDE7DA', marginBottom: 2 } }, gorev.baslik),
                  React.createElement('div', { style: { fontSize: '0.65rem', color: '#8893A1', lineHeight: 1.4 } }, gorev.acik)
                ),
                React.createElement('div', { style: { textAlign: 'right', flexShrink: 0 } },
                  React.createElement('div', { style: { fontSize: '0.78rem', fontWeight: 800, color: '#C89B3C', fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 } }, `+${gorev.odul}`),
                  tamam
                    ? React.createElement('div', { style: { fontSize: '0.6rem', color: '#3E8C5A', fontWeight: 700 } }, '✓ Alındı')
                    : React.createElement('button', {
                        onClick: () => oduluAl(gorev),
                        disabled: yukleniyor || (!otomatik && !['giris','vali','beylik','seviye','servet','ordu'].includes(gorev.tip) && false),
                        style: {
                          padding: '5px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: (otomatik || gorev.tip === 'giris') ? '#C89B3C' : 'rgba(200,155,60,0.15)',
                          border: `1px solid ${(otomatik || gorev.tip === 'giris') ? '#C89B3C' : 'rgba(200,155,60,0.3)'}`,
                          color: (otomatik || gorev.tip === 'giris') ? '#0F0800' : '#C89B3C',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          cursor: yukleniyor ? 'not-allowed' : 'pointer',
                        }
                      }, yukleniyor ? '...' : (otomatik || gorev.tip === 'giris') ? 'Al' : 'Talep Et')
                )
              );
            })
          )
        );
      }),

      // Nasıl kazanılır bilgi kutusu
      React.createElement('div', {
        style: { background: 'rgba(45,24,0,0.6)', border: '1px solid rgba(200,155,60,0.15)', borderRadius: 14, padding: '14px', marginTop: 8 }
      },
        React.createElement('div', { style: { fontFamily: "'Cinzel',serif", fontSize: '0.82rem', color: '#C89B3C', marginBottom: 10, fontWeight: 700 } }, '💎 Sadakat Puanı Kazanma Yolları'),
        [
          ['🌅', 'Günlük Giriş', 'Her gün +50 puan'],
          ['⚔️', 'PvP Dövüşü', 'Her dövüş +75 puan'],
          ['👑', 'Vali Ol', 'Bir eyalete atanın +1.000 puan'],
          ['⚜️', 'Beylik Kur veya Katıl', '+500 puan'],
          ['⭐', 'Seviye Atla', '10. ve 25. seviye özel ödül'],
          ['💰', 'Milyoner Ol', '1M Sikke biriktirince +1.500 puan'],
          ['⚒️', 'Alet Atölyesi', 'Silah/Zırh üret → +80/gün'],
          ['⛏️', 'Madencilik', 'Her gün maden çıkar → +45'],
          ['🌾', 'Tarım Hasatı', 'Her hasat → +60 puan'],
          ['⚡', 'Güç Mirası', '100.000 Güç Puanı → +5.000 puan'],
          ['🏴', 'Sancak Beyi', '3 sancak kontrol et → +2.500 puan'],
          ['🪖', 'Osmanlı Ordusu', 'Asker işe al → +600 puan'],
          ['🏗️', 'Kariyer Çalışma', 'Her iş tamamlama → Liyakat + Sadakat'],
        ].map(([ic, baslik, acik]) =>
          React.createElement('div', { key: baslik, style: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } },
            React.createElement('span', { style: { fontSize: '1rem', width: 24, textAlign: 'center', flexShrink: 0 } }, ic),
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('span', { style: { fontSize: '0.75rem', fontWeight: 600, color: '#EDE7DA' } }, baslik + ' — '),
              React.createElement('span', { style: { fontSize: '0.72rem', color: '#8893A1' } }, acik)
            )
          )
        )
      )
    )
  );
};
