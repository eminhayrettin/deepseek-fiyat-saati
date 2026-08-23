/* ═══════════════════════════════════════════════════════════════
   DeepSeek Fiyat Saati — zaman motoru + arayüz

   Veri kaynağı: fiyatlar.js (ayrı dosya — kullanıcı onu düzenler).
   Hesaplama UTC bazlı, görüntüleme kullanıcının dilimine göre.

   Kural:
   • Hafta içi peak: 01:00–04:00 ve 06:00–10:00 (UTC)
   • Hafta sonları (Pekin saati Cmt–Paz): tüm gün off-peak
     (23 Ağustos 2026 00:00 Pekin'den itibaren geçerli)
   ═══════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	/* ---------- Veri (fiyatlar.js'ten) ---------- */
	var FIYATLAR = (typeof globalThis !== 'undefined' && globalThis.FIYATLAR) || null;

	function pencereDakika(dizge) {
		var p = String(dizge).split(':');
		return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
	}

	var peakPencereler = ((FIYATLAR && FIYATLAR.peakPencereler) || []).map(function (w) {
		return { bas: pencereDakika(w.baslangic), bit: pencereDakika(w.bitis) };
	});

	var kuralBaslangic = (FIYATLAR && FIYATLAR.haftaSonuOffPeakBaslangic)
		? new Date(FIYATLAR.haftaSonuOffPeakBaslangic) : null;

	var modeller = (FIYATLAR && FIYATLAR.modeller) || [];

	/* ---------- Zaman motoru ---------- */

	/* Pekin = UTC+8, DST yok. Hafta sonu = Cumartesi/Pazar (Pekin). */
	function haftaSonuMu(now) {
		if (!FIYATLAR || !FIYATLAR.haftaSonuOffPeak) return false;
		if (kuralBaslangic && now.getTime() < kuralBaslangic.getTime()) return false;
		var g = new Date(now.getTime() + 8 * 3600000).getUTCDay(); /* 0=Paz, 6=Cmt */
		return g === 0 || g === 6;
	}

	function gunDakikasi(now) {
		return now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
	}

	/* Şu andaki durum: 'peak' veya 'off' */
	function durum(now) {
		if (haftaSonuMu(now)) return 'off';
		var dk = gunDakikasi(now);
		for (var i = 0; i < peakPencereler.length; i++) {
			if (dk >= peakPencereler[i].bas && dk < peakPencereler[i].bit) return 'peak';
		}
		return 'off';
	}

	var GUN = 86400000;
	/* Olası geçiş anları (dakika cinsinden, UTC günü başından). */
	var ADAY_DK = [60, 240, 360, 600, 960];

	function gecisAdaylari(now) {
		var list = [];
		var gun = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
		for (var d = -1; d <= 3; d++) {
			var base = gun + d * GUN;
			for (var i = 0; i < ADAY_DK.length; i++) {
				list.push(new Date(base + ADAY_DK[i] * 60000));
			}
		}
		return list;
	}

	/* Bir an, gerçekten fiyat geçişi mi? (durum değişiyor mu) */
	function gecisMi(an) {
		return durum(new Date(an.getTime() - 60000)) !== durum(an);
	}

	function gecisler(now) {
		return gecisAdaylari(now).filter(gecisMi);
	}

	/* Şu andan sonraki ilk geçiş (durum mutlaka değişir) */
	function sonrakiGecis(now) {
		var t = now.getTime();
		var arr = gecisler(now);
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].getTime() > t) return arr[i];
		}
		return null;
	}

	/* İçinde bulunulan pencerenin başlangıç anı */
	function pencereBaslangic(now) {
		var best = null;
		var t = now.getTime();
		gecisler(now).forEach(function (an) {
			if (an.getTime() <= t && (!best || an.getTime() > best.getTime())) best = an;
		});
		return best || new Date(t - 2 * GUN);
	}

	/* Art arda gelen pencereler: [{bas, son, durum, suanki}] */
	function pencereListesi(now, sayi) {
		var out = [];
		var t = pencereBaslangic(now);
		var k = durum(t);
		for (var i = 0; i < sayi; i++) {
			var son = sonrakiGecis(t);
			if (!son) break;
			out.push({ bas: t, son: son, durum: k, suanki: i === 0 });
			t = son;
			k = durum(t);
		}
		return out;
	}

	/* Görüntüleme dilimine göre 24 saatlik renkli dilimler (dakika bazında). */
	function segmentler(now, bolge) {
		var gunBas = bolge === 'utc'
			? Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
			: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
		var dkler = [];
		var onceki = null, bas = 0;
		for (var dk = 0; dk < 1440; dk++) {
			var an = new Date(gunBas + dk * 60000);
			var k = durum(an);
			if (k !== onceki) {
				if (onceki !== null) dkler.push({ bas: bas, son: dk, durum: onceki });
				onceki = k;
				bas = dk;
			}
		}
		dkler.push({ bas: bas, son: 1440, durum: onceki });
		return dkler;
	}

	/* Node ile test edilebilir motor */
	var motor = {
		durum: durum,
		haftaSonuMu: haftaSonuMu,
		sonrakiGecis: sonrakiGecis,
		pencereBaslangic: pencereBaslangic,
		pencereListesi: pencereListesi,
		segmentler: segmentler,
		kuralBaslangic: kuralBaslangic ? kuralBaslangic.toISOString() : null,
		peakPencereler: peakPencereler,
		modeller: modeller,
		FIYATLAR: FIYATLAR
	};

	if (typeof module !== 'undefined' && module.exports) module.exports = motor;
	else if (typeof window !== 'undefined') window.DeepSeekSaat = motor;

	/* Arayüz kısmı — tarayıcı yoksa atla (node testleri için) */
	if (typeof document === 'undefined' || !document.getElementById) return;

	var $ = function (id) { return document.getElementById(id); };

	var durumKart = $('durumKart');
	var durumMetin = $('durumMetin');
	var gerisayimEl = $('gerisayim');
	var sonrakiMetin = $('sonrakiMetin');
	var pencerelerKart = $('pencerelerKart');
	var pencereBolgesi = $('pencereBolgesi');
	var pencereGovde = $('pencereGovde');
	var seritParcalar = $('seritParcalar');
	var simdiIsareti = $('simdiIsareti');
	var dilimBilgi = $('dilimBilgi');
	var fiyatSimdiEtiket = $('fiyatSimdiEtiket');
	var fiyatSimdiIcerik = $('fiyatSimdiIcerik');
	var fiyatSonrakiEtiket = $('fiyatSonrakiEtiket');
	var fiyatSonrakiIcerik = $('fiyatSonrakiIcerik');
	var fiyatKart = $('fiyatKart');
	var sonGuncelleme = $('sonGuncelleme');
	var kuralNotu = $('kuralNotu');

	if (!FIYATLAR) {
		if (durumMetin) durumMetin.textContent = 'Hata: fiyatlar.js dosyası yüklenemedi';
		if (sonrakiMetin) sonrakiMetin.textContent = 'fiyatlar.js dosyasının bu klasörde olduğundan emin ol.';
		return;
	}

	/* ---------- Tema ---------- */
	var TEMA_KEY = 'ds-tema';
	var BOLGE_KEY = 'ds-bolge';
	var temaButon = $('temaButon');
	var temaMenu = $('temaMenu');
	var temaButonYazi = $('temaButonYazi');
	var temaOptlar = Array.prototype.slice.call(document.querySelectorAll('.tema-opt'));
	var bolgeBtnler = Array.prototype.slice.call(document.querySelectorAll('.bolge-btn'));
	var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
	var temaAdlari = { acik: 'Aydınlık', kagit: 'Kâğıt', karanlik: 'Karanlık', sistem: 'Sistem' };

	function temaAl() {
		var t = null;
		try { t = localStorage.getItem(TEMA_KEY); } catch (e) {}
		if (t !== 'acik' && t !== 'kagit' && t !== 'karanlik' && t !== 'sistem') t = 'sistem';
		return t;
	}

	function sistemCoz() { return mq && mq.matches ? 'karanlik' : 'acik'; }

	function temaUygula(t) {
		var root = document.documentElement;
		var cozum = t === 'sistem' ? sistemCoz() : t;
		root.setAttribute('data-tercih', t);
		root.setAttribute('data-theme', cozum);
		if (t === 'sistem') {
			temaButonYazi.textContent = 'Sistem';
		} else {
			temaButonYazi.textContent = temaAdlari[t] || 'Tema';
		}
		temaOptlar.forEach(function (b) {
			var aktif = b.getAttribute('data-tema') === t;
			b.setAttribute('aria-pressed', aktif ? 'true' : 'false');
			b.classList.toggle('aktif', aktif);
		});
	}

	/* Tema menüsünü animasyonla aç/kapat */
	function temaMenuAc() {
		temaMenu.hidden = false;
		requestAnimationFrame(function () { temaMenu.classList.add('acik'); });
		temaButon.setAttribute('aria-expanded', 'true');
	}

	function temaMenuKapat() {
		temaMenu.classList.remove('acik');
		temaButon.setAttribute('aria-expanded', 'false');
		setTimeout(function () { temaMenu.hidden = true; }, 180);
	}

	/* Sistem teması değiştiğinde canlı takip */
	if (mq && mq.addEventListener) {
		mq.addEventListener('change', function () {
			if (temaAl() === 'sistem') temaUygula('sistem');
		});
	}

	temaButon.addEventListener('click', function (e) {
		e.stopPropagation();
		if (temaMenu.hidden) temaMenuAc(); else temaMenuKapat();
	});

	temaOptlar.forEach(function (b) {
		b.addEventListener('click', function (e) {
			e.stopPropagation();
			var t = b.getAttribute('data-tema');
			try { localStorage.setItem(TEMA_KEY, t); } catch (err) {}
			temaUygula(t);
			temaMenuKapat();
		});
	});

	/* Menünün dışına tıklanınca kapat */
	document.addEventListener('click', function () {
		if (!temaMenu.hidden) temaMenuKapat();
	});

	/* ---------- Saat dilimi ---------- */
	function bolgeAl() {
		var b = null;
		try { b = localStorage.getItem(BOLGE_KEY); } catch (e) {}
		return b === 'utc' ? 'utc' : 'yerel';
	}

	function bolgeUygula(b) {
		bolgeBtnler.forEach(function (btn) {
			var aktif = btn.getAttribute('data-bolge') === b;
			btn.setAttribute('aria-pressed', aktif ? 'true' : 'false');
			btn.classList.toggle('aktif', aktif);
		});
	}

	bolgeBtnler.forEach(function (b) {
		b.addEventListener('click', function () {
			var v = b.getAttribute('data-bolge');
			try { localStorage.setItem(BOLGE_KEY, v); } catch (e) {}
			tamYenile();
		});
	});

	/* ---------- Biçimlendirme ---------- */
	function pad(n) { return (n < 10 ? '0' : '') + n; }

	function saatMetni(an, bolge) {
		if (bolge === 'utc') return pad(an.getUTCHours()) + ':' + pad(an.getUTCMinutes());
		return pad(an.getHours()) + ':' + pad(an.getMinutes());
	}

	var gunlerKisa = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

	function gunEtiketi(an, bolge) {
		var i = bolge === 'utc' ? an.getUTCDay() : an.getDay();
		return gunlerKisa[i];
	}

	function sureMetni(ms) {
		var dk = Math.round(ms / 60000);
		var gun = Math.floor(dk / 1440);
		var s = Math.floor((dk % 1440) / 60);
		var k = dk % 60;
		if (gun) return gun + 'g ' + (s ? s + 's' : '');
		if (s) return s + 's ' + (k ? k + 'dk' : '');
		return k + ' dk';
	}

	function gerisayimMetni(ms) {
		var t = Math.max(0, Math.floor(ms / 1000));
		var s = t % 60, dk = Math.floor(t / 60) % 60, sa = Math.floor(t / 3600);
		return pad(sa) + ':' + pad(dk) + ':' + pad(s);
	}

	function fiyatMetni(n) {
		var v = typeof n === 'number' ? n : parseFloat(n);
		if (isNaN(v)) return '–';
		var s;
		if (v >= 1) s = v.toFixed(2);
		else if (v >= 0.1) s = v.toFixed(2);
		else s = v.toFixed(3); /* küçük fiyatlar: $0.007 gibi */
		return '$' + s;
	}

	function durumMetni(k) { return k === 'peak' ? 'Peak' : 'Off-peak'; }

	/* ---------- Çizim ---------- */

	var sonDurum = null;

	function cizDurum(now, bolge) {
		var k = durum(now);
		var gecis = sonrakiGecis(now);

		durumKart.setAttribute('data-durum', k);
		durumMetin.textContent = k === 'peak'
			? 'Şu an: Peak (pahalı dönem)'
			: 'Şu an: Off-peak (indirimli)';

		if (gecis) {
			gerisayimEl.textContent = gerisayimMetni(gecis.getTime() - now.getTime());
			var hedef = k === 'peak' ? 'Off-peak' : 'Peak';
			sonrakiMetin.textContent = 'Sonraki geçiş: ' + gunEtiketi(gecis, bolge) + ' ' +
				saatMetni(gecis, bolge) + "'de " + hedef + "'e";
		} else {
			gerisayimEl.textContent = '—';
			sonrakiMetin.textContent = 'Önümüzdeki günlerde fiyat değişikliği yok';
		}
	}

	function cizPencereler(now, bolge) {
		var list = pencereListesi(now, 5);
		pencereBolgesi.textContent = bolge === 'utc' ? 'UTC' : 'senin saatine göre';
		pencerelerKart.hidden = false;

		pencereGovde.textContent = '';
		list.forEach(function (p) {
			var tr = document.createElement('tr');
			tr.className = 'pencere-' + p.durum + (p.suanki ? ' suanki' : '');

			var tdDurum = document.createElement('td');
			tdDurum.className = 'hucre-durum';
			var nokta = document.createElement('span');
			nokta.className = 'mini-nokta';
			nokta.setAttribute('aria-hidden', 'true');
			tdDurum.appendChild(nokta);
			tdDurum.appendChild(document.createTextNode(durumMetni(p.durum)));

			var tdAralik = document.createElement('td');
			tdAralik.className = 'hucre-aralik';
			tdAralik.textContent = gunEtiketi(p.bas, bolge) + ' ' + saatMetni(p.bas, bolge) +
				' – ' + gunEtiketi(p.son, bolge) + ' ' + saatMetni(p.son, bolge);

			var tdSure = document.createElement('td');
			tdSure.className = 'hucre-sure';
			tdSure.textContent = sureMetni(p.son.getTime() - p.bas.getTime());

			tr.appendChild(tdDurum);
			tr.appendChild(tdAralik);
			tr.appendChild(tdSure);
			pencereGovde.appendChild(tr);
		});
	}

	function gunBaslangicAni(now, bolge) {
		if (bolge === 'utc') {
			return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
		}
		return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	}

	function cizSegmentler(now, bolge) {
		var segs = segmentler(now, bolge);
		seritParcalar.textContent = '';
		segs.forEach(function (s) {
			var div = document.createElement('div');
			div.className = 'serit-parca serit-' + s.durum;
			div.style.flex = (s.son - s.bas) + ' 0 0';
			/* Tooltip için saat ve durum bilgisi */
			div.setAttribute('data-saat', pad(Math.floor(s.bas / 60)) + ':' + pad(s.bas % 60));
			div.setAttribute('data-durum', s.durum === 'peak' ? 'Peak' : 'Off-peak');
			seritParcalar.appendChild(div);
		});
		var gunBas = gunBaslangicAni(now, bolge);
		var pos = Math.min(1, Math.max(0, (now.getTime() - gunBas) / GUN));
		simdiIsareti.style.left = (pos * 100) + '%';
	}

	function fiyatSatirlariIc(cikti, anahtar) {
		cikti.textContent = '';
		modeller.forEach(function (m) {
			var f = m[anahtar] || {};
			var satir = document.createElement('div');
			satir.className = 'fiyat-satiri';

			var isim = document.createElement('span');
			isim.className = 'fiyat-model';
			isim.textContent = m.ad;

			var cift = document.createElement('span');
			cift.className = 'fiyat-cift';

			[
				['girdi · önbellek isabeti', f.cacheHit],
				['girdi · önbellek kaçırma', f.girdi],
				['çıktı', f.cikti]
			].forEach(function (par) {
				var hucre = document.createElement('span');
				hucre.className = 'fiyat-hucre';
				var tur = document.createElement('span');
				tur.className = 'fiyat-tur';
				tur.textContent = par[0];
				var tut = document.createElement('strong');
				tut.textContent = fiyatMetni(par[1]);
				hucre.appendChild(tur);
				hucre.appendChild(tut);
				cift.appendChild(hucre);
			});

			satir.appendChild(isim);
			satir.appendChild(cift);
			cikti.appendChild(satir);
		});
	}

	function cizFiyatlar(now) {
		var k = durum(now);
		var diger = k === 'peak' ? 'off' : 'peak';
		fiyatKart.setAttribute('data-durum', k);
		fiyatSimdiEtiket.textContent = durumMetni(k) + ' fiyatları (şu an)';
		fiyatSonrakiEtiket.textContent = durumMetni(diger) + ' fiyatları (sonraki dilim)';
		fiyatSatirlariIc(fiyatSimdiIcerik, k === 'peak' ? 'peak' : 'offPeak');
		fiyatSatirlariIc(fiyatSonrakiIcerik, diger === 'peak' ? 'peak' : 'offPeak');
	}

	function dilimMetni(now, bolge) {
		if (bolge === 'utc') return 'UTC (Koordinatlı Evrensel Saat)';
		var dk = -now.getTimezoneOffset();
		var isaret = dk >= 0 ? '+' : '−';
		return 'Senin saatin (UTC' + isaret + Math.abs(dk) + ')';
	}

	/* ---------- İstatistik kartları ---------- */
	var istDurum = $('istDurum');
	var istSure = $('istSure');
	var istSaat = $('istSaat');
	var istTasarruf = $('istTasarruf');

	/* İki tarihin aynı gün olup olmadığını seçilen dilime göre karşılaştır */
	function ayniGunMu(a, b, bolge) {
		if (bolge === 'utc') {
			return a.getUTCFullYear() === b.getUTCFullYear() &&
				a.getUTCMonth() === b.getUTCMonth() &&
				a.getUTCDate() === b.getUTCDate();
		}
		return a.getFullYear() === b.getFullYear() &&
			a.getMonth() === b.getMonth() &&
			a.getDate() === b.getDate();
	}

	function cizIstatistik(now, bolge) {
		var k = durum(now);
		var gecis = sonrakiGecis(now);
		if (istDurum) {
			istDurum.textContent = durumMetni(k);
			istDurum.style.color = k === 'peak' ? 'var(--peak)' : 'var(--off)';
		}
		if (istSure) {
			if (!gecis) {
				istSure.textContent = '—';
			} else {
				/* Geçiş bugün içindeyse saat; yeni güne/hafta sonuna denk gelirse
				   gün silik parantezde öncelikli görünür. */
				var saat = saatMetni(gecis, bolge);
				istSure.innerHTML = ayniGunMu(gecis, now, bolge)
					? saat
					: saat + ' <span class="ist-sil">(' + gunEtiketi(gecis, bolge) + ')</span>';
			}
		}
		if (istSaat) {
			istSaat.textContent = saatMetni(now, bolge) + ' ' + gunEtiketi(now, bolge);
		}
		if (istTasarruf) {
			istTasarruf.textContent = k === 'peak' ? '%0 şu an' : '%50 aktif';
			istTasarruf.style.color = k === 'peak' ? 'var(--peak)' : 'var(--off)';
		}
	}

	function tamYenile() {
		var now = new Date();
		var bolge = bolgeAl();
		bolgeUygula(bolge);
		temaUygula(temaAl());
		cizDurum(now, bolge);
		cizPencereler(now, bolge);
		cizSegmentler(now, bolge);
		cizFiyatlar(now);
		cizIstatistik(now, bolge);
		dilimBilgi.textContent = dilimMetni(now, bolge);
	}

	/* Saniyede bir: geri sayım + zaman şeridi işaretçisi (hafif) */
	function saniyeTik() {
		var now = new Date();
		var bolge = bolgeAl();
		cizDurum(now, bolge);
		cizIstatistik(now, bolge);
		cizFiyatlar(now);
		var gunBas = gunBaslangicAni(now, bolge);
		var pos = Math.min(1, Math.max(0, (now.getTime() - gunBas) / GUN));
		simdiIsareti.style.left = (pos * 100) + '%';
	}

	/* ---------- Başlangıç ---------- */
	sonGuncelleme.textContent = FIYATLAR.sonGuncelleme || '—';

	function pencereMetni() {
		return FIYATLAR.peakPencereler.map(function (w) {
			return w.baslangic + '–' + w.bitis + ' (UTC)';
		}).join(' ve ');
	}

	if (FIYATLAR.haftaSonuOffPeak) {
		kuralNotu.textContent = '23 Ağustos 2026 tarihinden itibaren DeepSeek, hafta sonlarında ' +
			'(Pekin saatiyle Cumartesi ve Pazar günleri) tüm gün indirimli fiyat uyguluyor; bu yüzden ' +
			'hafta sonu hiçbir saatte peak fiyat görünmez. Hafta içi ise ' + pencereMetni() +
			' aralığı peak, geri kalan her saat off-peaktir.';
	} else {
		kuralNotu.textContent = 'Peak saatleri ' + pencereMetni() + ' aralığıdır; ' +
			'geri kalan her saat off-peaktir.';
	}

	tamYenile();
	setInterval(saniyeTik, 1000);
	setInterval(tamYenile, 30000);
})();
