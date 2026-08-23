# DeepSeek Fiyat Saati ⏱️

DeepSeek API'nin **peak / off-peak fiyat dilimlerini** kendi saat diliminde canlı gösteren Türkçe web uygulaması.

## ✨ Özellikler
- 🇹🇷 Tamamen Türkçe arayüz
- 🎨 4 tema: Aydınlık · Kâğıt · Karanlık · Sistem (işletim sistemi takibi)
- 🕐 Yerel saat dilimi otomatik algılama + tek tıkla UTC'ye geçiş
- ⏱️ Saniye saniye canlı geri sayım + 24 saatlik zaman şeridi
- 💰 Fiyatlar ayrı `fiyatlar.js` dosyasından okunur (güncellemesi çok kolay)
- 📅 Hafta sonu off-peak kuralı (DeepSeek'in 23 Ağustos 2026 duyurusu dahil)
- 🚫 Reklam, takip, ortaklık (affiliate) bağlantısı içermez

## 🚀 Kullanım
`index.html` dosyasını tarayıcıda açmanız yeterli (çift tıklayın). İnternet bağlantısı bile gerekmez.

## 💰 Fiyatları Güncelleme
`fiyatlar.js` dosyasını metin editörüyle açın, fiyat/kural bilgilerini güncelleyin ve `sonGuncelleme` tarihini değiştirin. Sayfayı yenileyince yeni fiyatlar görünür. Başka hiçbir dosyaya dokunmanız gerekmez.

## 📁 Dosyalar
| Dosya | Görev |
|---|---|
| `index.html` | Sayfa yapısı |
| `style.css` | Tasarım + 4 tema |
| `script.js` | Zaman hesaplama + arayüz mantığı |
| `fiyatlar.js` | Fiyat ve kural verileri |

## ℹ️ Not
Fiyatlar resmi [DeepSeek fiyatlandırma sayfasından](https://api-docs.deepseek.com/quick_start/pricing) alınmıştır.
