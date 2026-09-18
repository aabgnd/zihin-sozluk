---
name: tasarim
description: Zihin Sözlük'ün görsel dili ve mobil doğrulama yöntemi. Renk, sarı ton, düzen, boşluk, tipografi, buton, form alanı, koyu mod ya da mobil görünüm ile ilgili herhangi bir değişiklik yapmadan önce bu skill'i kullan. "Şu renk olsun", "şurayı düzelt", "mobilde bozuk", "sayfa kayıyor", "kontrast" gibi isteklerde mutlaka oku. İçinde mobil yana kayma sorununun gerçek sebebi ve ölçümle doğrulama yöntemi var; ölçmeden tasarım değişikliği yapma.
---

# Zihin Sözlük: tasarım

## Tek sarı

Sitede **tek bir sarı** var:

```css
--zihin-yellow: #f0c84a;
```

`--gold`, `--gold-ink` ve `--logo` hepsi buna bağlı ve **tema değişince
değişmez**. Açık ve koyu modda birebir aynı sarı görünür.

Bu bilinçli bir karar. Daha önce açık temada ayrı bir koyu altın (`#8a5a00`)
ve ayrı bir parlak dolgu (`#facc15`) vardı; tema değişince sarı da değişiyordu
ve site iki farklı kimlik gibi duruyordu. Kaldırıldı.

**Yeni sarı ton üretme.** Bir yerde sarı gerekiyorsa mevcut tokenı kullan.
Kontrast yetmiyorsa çözüm yeni renk değil, farklı bir kullanım biçimi
(aşağıya bak).

Temayla yalnızca zemin, yazı rengi ve çizgiler değişir.

## Düzen

- **Kutu yok.** Bölümler ince çizgi (`border-b border-line`) ve boşlukla
  ayrılır. Gölge ve çerçeveli kart kullanma.
- Üç sütun, `max-w-[1200px]`. Sol sütun kendi içinde kayar.
- Sarı yalnızca **dolgu** olarak: üstteki 4px şerit, arama butonu, aktif sekme
  altı çizgisi, aktif başlık şeridi.
- Dokunma hedefi 44px; 360px'de sığmıyorsa 40px'e inilebilir ama düğme
  kaldırılmaz.
- Tek font ailesi, geçişler 150-200ms.

## Mobilde form alanları en az 16px

Bu kuralın sebebi estetik değil, davranış:

iOS ve Android, yazı boyutu **16px'in altında** olan bir alana odaklanıldığında
sayfayı otomatik yakınlaştırır. Yakınlaşan sayfa ekrandan geniş kalır, parmakla
sağa sola kayar ve kendi başına eski hâline dönmez. Kullanıcı bunu "site
kayıyor, arama kutusuna basınca büyüyor" diye tarif eder.

Kural `app/globals.css` içinde, **katmansız** duruyor:

```css
@media (max-width: 639px) {
  input:not([type="checkbox"]):not([type="radio"]):not([type="file"]),
  textarea,
  select { font-size: 16px; }
}
```

Katmansız olması şart: Tailwind yardımcıları `@layer` içinde ve katmansız
kurallar onları geçer. `@layer` içine koyarsan `text-[15px]` baskın gelir ve
düzeltme sessizce işlemez.

Yeni bir form alanı eklerken masaüstünde 15px bırakabilirsin; bu kural mobilde
zaten devralır.

## Kontrast

Ölç ve dürüstçe raporla. Bilinen değerler:

| Kullanım | Oran | Durum |
|---|---|---|
| Sarı yazı, beyaz zemin | 1,61:1 | AA'yı geçmez (4,5:1 gerekir) |
| Koyu yazı, sarı zemin | 10,8:1 | Rahat geçer |
| Sarı yazı, antrasit zemin | 11,1:1 | Rahat geçer |

Buradan çıkan pratik kural: **açık temada sarıyı yazı olarak kullanmak
zayıftır, dolgu olarak kullanmak güçlüdür.** Aktif başlık şeridi bu yüzden
sarı zemin + koyu yazı olarak yapıldı — hem istenen görünümü verdi hem
kontrastı 1,61'den 10,8'e çıkardı.

**Küçük sarı yazı kullanma.** Kullanıcı adı, rozet yazısı, entry numarası,
satır içi bağlantı: yazı koyu (`text-ink`), sarı çerçeve, dolgu ya da alt
çizgi (`decoration-gold`) olarak gelir. Rütbe rozetleri bir dönem soluk sarı
zemin üzerinde sarı yazıyla ~1,4:1'e düşmüştü; kullanıcı "çirkin" dedi.

İstisna: kalın, büyük manşet başlıklar (başlık sayfasının h1'i, entry
kartındaki başlık adı) sarı kalabilir; kullanıcı bunu bilerek istedi.

Kontrast eşiği geçmiyorsa geçmiyor de. Kullanıcı rengi bilerek seçtiyse
uygula, ama sayıyı söyle ve seçenek sun.

## Doğrulama: ölçmeden değiştirme

"Taşma var mı" diye bakmak yetmez; `scrollWidth == clientWidth` olduğu hâlde
kullanıcı kayma yaşayabilir (yukarıdaki yakınlaştırma sorunu tam olarak
böyleydi). **Hangi öğenin** taştığını tara.

Chrome'u CDP ile sürüp şunlara bak:

- Genişlikler: 360, 390, 412 ve 1280
- Açık ve koyu mod
- Sayfadaki her öğenin sağ kenarı ekranı aşıyor mu
- Form alanlarının **hesaplanmış** yazı boyutu (16px altı kalmış mı)

Giriş yapmış hâli ekran görüntüsüyle alınamıyor. Header'ı DOM'da simüle et:
giriş/kaydol bağlantılarını kaldır, yerine üç ikon düğmesi klonla, sonra ölç.
Bu yöntemle 360px'de header taşması yakalandı — çıkış yapmış ölçümlerde hiç
görünmüyordu.

Ekran görüntüsünü **gözle kontrol et**. Sınıf sırasına bakıp "`text-logo`
kazanır" diye varsayma; `truncate` eklendiğinde logo "zihin s…" diye kesilmişti
ve bunu ancak görüntüde fark ettim.

## Aktif durum

Açık başlık adres çubuğundan belirlenir (`usePathname`), tutulan bir seçim
durumundan değil. Böylece sayfa yenilendiğinde doğru kalır ve aynı anda tek
başlık aktif olur. `components/TopicLink.tsx` bunu yapar.

Aktif öğede `aria-current="page"` bulunur; alt öğelerin rengi
`group-aria-[current=page]:` ile ayarlanır.

Aktif öğe fareyle üzerine gelindiğinde de şeridini korumalı; yoksa sarı zemin
üzerinde sarı yazı çıkıp okunmaz hâle gelir.
