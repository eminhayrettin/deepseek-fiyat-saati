/* ═══════════════════════════════════════════════════════════════
   💰 FİYAT VE KURAL VERİLERİ — SADECE BU DOSYAYI GÜNCELLE

   DeepSeek fiyatlarını veya kural değişikliklerini buradan
   güncelleyebilirsin. Değiştirdikten sonra dosyayı kaydet ve
   sayfayı yenile. Başka hiçbir dosyaya dokunmana gerek yok.

   Güncel fiyatların kontrolü için resmi sayfa:
   https://api-docs.deepseek.com/quick_start/pricing

   Not: Tarih/saat değerleri ISO biçimindedir. "2026-08-23T00:00:00+08:00"
   gibi yazılır (+08:00 = Pekin saati).
   ═══════════════════════════════════════════════════════════════ */

globalThis.FIYATLAR = {

  /* Burayı her güncellemede değiştir (sayfada görünür). */
  sonGuncelleme: "22 Ağustos 2026",

  /* Hafta sonları (Pekin saatiyle Cumartesi-Pazar) tüm gün off-peak mi?
     Resmi duyuru: 23 Ağustos 2026 itibarıyla geçerli. */
  haftaSonuOffPeak: true,

  /* Hafta sonu kuralının geçerlilik başlangıcı (ISO, Pekin saati +08:00). */
  haftaSonuOffPeakBaslangic: "2026-08-23T00:00:00+08:00",

  /* Hafta içi PEAK saat pencereleri (UTC).
     Aralık dışındaki her saat off-peaktir. */
  peakPencereler: [
    { baslangic: "01:00", bitis: "04:00" },
    { baslangic: "06:00", bitis: "10:00" }
  ],

  /* Modeller ve fiyatları (1 milyon token başına, ABD doları).
     girdi    = input token (önbellek kaçırma / cache miss)
     cikti    = output token
     cacheHit = input token önbellek isabeti (çok daha ucuz) */
  modeller: [
    {
      ad: "DeepSeek V4 Flash",
      offPeak: { girdi: 0.22, cikti: 0.66, cacheHit: 0.007 },
      peak:    { girdi: 0.44, cikti: 1.32, cacheHit: 0.014 }
    },
    {
      ad: "DeepSeek V4 Pro",
      offPeak: { girdi: 0.66, cikti: 1.98, cacheHit: 0.022 },
      peak:    { girdi: 1.32, cikti: 3.96, cacheHit: 0.044 }
    }
  ]
};
