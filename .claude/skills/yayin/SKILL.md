---
name: yayin
description: Zihin Sözlük'te commit, push ve canlı doğrulama düzeni. Bir iş bitip "commit et", "pushla", "yayınla" denince ya da çok maddeli bir turu tamamlarken bu skill'i kullan. Kullanıcı çoğu zaman PC başında olmuyor, bu yüzden raporun sonunda elle yapılması gereken adımların eksiksiz listelenmesi kritik.
---

# Zihin Sözlük: yayın

## Commit

- **Madde başına ayrı commit.** Mesajın ilk satırı maddenin adı olsun.
- Gövdede **niçin**'i anlat: kök sebep neydi, nasıl ölçüldü, hangi hipotez
  elendi. "Şunu değiştirdim" değil, "şu yüzden bozuktu".
- Yanlış çıkan bir hipotezi denediysen onu da yaz; sonraki kişi aynı yolu
  tekrar denemesin.
- Uzun mesajı PowerShell'de `-m` ile verme, dosyaya yazıp `git commit -F`.

## Push

Derleme geçmeden push etme. Push'tan sonra Vercel otomatik yayınlar.

## Canlı doğrulama

Ölçmeden "yayında" deme. Bakılacaklar:

- `x-vercel-id` başlığı — bölge `fra1::dub1` olmalı (Supabase `eu-west-1`
  ile aynı bölge; ABD'de çalışırsa her sorgu Atlantik aşar).
- HTML ya da CSS'te yeni sürüme özgü bir işaret ara. Tailwind renkleri
  **ayrı CSS dosyasında**, HTML'de değil — stil dosyasını çek ve orada bak.
- Yalnızca sunucu tarafını değiştiren bir commit'in dışarıdan ayırt edici
  imzası olmayabilir. O durumda "doğrulayamıyorum" de, uydurma.

Vercel derlemesi 1-3 dakika sürer. Hemen bakıp eski sürümü görürsen bunu
söyle, "yayında" diye geçiştirme.

## Raporun sonu

Kullanıcı çoğunlukla PC'de değil. Her turu şununla bitir:

```
## PC'ye geçince yapman gereken
- <çalıştırılacak SQL dosyası>
- <panelden yapılacak ayar>
```

Bekleyen bir şey yoksa **"yapman gereken bir şey yok"** de. Bu cümle
kullanıcıyı gereksiz kontrolden kurtarır.

Ayrıca söylenmesi gerekenler:
- Veri kaybı riski varsa **önden**.
- SQL çalıştırılmadan önce ne bozulur, ne bozulmaz.
- Bilerek yapılan tercihler (ör. alıntıya spoiler içeriğini almamak).
- Ölçülen sınırlar, geçmiyorsa geçmiyor diye.

## Dürüstlük

- Testler geçmediyse geçmedi de, çıktısıyla birlikte.
- Atlanan adım varsa söyle.
- Doğrulanan iş için "sanırım", "muhtemelen" deme; ölçtüysen düz söyle.
