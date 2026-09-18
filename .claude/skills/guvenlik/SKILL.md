---
name: guvenlik
description: Zihin Sözlük'te veritabanı değişikliği, yetki, moderasyon, oturum ve mail akışı işleri. SQL migration yazmadan, RLS ya da grant dokunmadan, moderasyon fonksiyonu eklemeden, rol/ban/susturma mantığı değiştirmeden, kimlik doğrulayan bir uç yazmadan ve kayıt, giriş, e-posta onayı, şifre sıfırlama ya da çerezle ilgili herhangi bir işten önce bu skill'i kullan. "Şunu silebilsin", "yetki ver", "sadece admin yapabilsin", "migration yaz", "mail gelmiyor", "giriş yapamıyorum" gibi isteklerde mutlaka oku.
---

# Zihin Sözlük: güvenlik

## ⛔ Mail ve oturum akışı

Kullanıcının hassas çizgisi. Haftalarca uğraşılarak çalışır hâle getirildi.
Kullanıcıya sormadan değiştirme:

- Çerezler **`sameSite=lax`** kalır. `Strict`, Gmail'den açılan onay ve
  yenileme linklerinde çerezi göndermez; kullanıcı tıklar ama giriş yapmamış
  görünür. Bu hata yaşandı ve çözüldü.
- `lib/auth-confirm.ts`: `yonlendir()` çerezleri yanıta elle yazar,
  `oku()` mail şablonundaki `&amp;` kaçışını tolere eder. İkisi de şart.
- Dönüş adresi `lib/site-url.ts`'ten gelir; sabit adres yazma.
- Şifre sıfırlama, e-posta kayıtlı olsun olmasın aynı cevabı verir.
- Kendi mail gönderimi kurma; mailler Supabase + Resend SMTP ile gidiyor.

Bu akışa dokunulacaksa önce kullanıcıya söyle, sonra canlıda ölç: Supabase
`/auth/v1/verify` ucuna sahte token ve `redirect_to` ile istek atıp
`Location` başlığına bak. Gerçek kullanıcı adıyla test yapma.

## Migration kuralları

- **Yalnızca ekleyici.** Kolon silme, yeniden adlandırma, veri güncelleme yok.
- SQL'i **önce kullanıcıya göster**. Çalıştırmayı kullanıcı yapar (Supabase
  SQL Editor). Sende servis anahtarı yok.
- "Çalıştırdım" denince **REST ile ölç**, söze güvenme. Kolon için:
  var olmayan bir kolon isteyip `42703` alıyor musun diye kıyasla. Fonksiyon
  için: RPC'yi çağır, `PGRST202` gelmiyorsa duruyor demektir.
- Dosyalar `supabase/migrations/NNN_ad.sql`, numaralı ve sıralı.

## Dağıtım güvenliği (en kritik kural)

Push otomatik yayına gidiyor ve kullanıcı SQL'i sonra çalıştırıyor. Yani kod,
**migration çalışmadan önce de kırılmadan çalışmalı.**

Yeni kolonu ana sorguya koyma. Ayrı sorguda oku, hata gelirse sessizce boş
dön. Yazarken de `42703` yakalanıp kolonsuz yeniden denenmeli.
`lib/messages.ts` içindeki `getMessageEntryIds` bu kalıbın örneği: `entry_id`
kolonu yokken mesajlar referanssız görünür, hiçbir şey kırılmaz.

Aksi hâlde kullanıcı PC'ye dönene kadar o sayfa tamamen çöker.

## Asıl kontrol sunucuda

Arayüzden düğme gizlemek **kozmetiktir**; istek doğrudan da atılabilir. Her
kısıt SQL fonksiyonunda ya da sunucu eyleminde zorlanmalı. Arayüz yalnızca
çalışmayacak düğmeyi göstermemek için düzenlenir.

## Moderasyon

`mod_guard_target(target)` üç şeyi engeller: kişinin kendine işlem yapması,
**admin hesabına** işlem yapılması, bir mod'un başka bir mod'a işlem yapması.
Yeni moderasyon fonksiyonu yazarken çağır.

Dikkat: `require_staff()` tek başına yetmez. `mod_delete_entry` uzun süre
yalnızca onu çağırdığı için bir mod admin'in entry'sini silebiliyordu.

Yazarlık eşiği (`writer_entry_threshold()`, 5) `promotion_baseline` ile
hesaplanır. Eşik dolmadan yazarlığı yalnızca admin verebilir.

## Sır sızdırma

Kullanıcı adları herkese açık, e-postalar değil. Kullanıcı adından e-postaya
erişim **yalnızca şifre doğrulandıktan sonra** verilir (`kullanici_email`).
Doğrudan çeviri yapan açık bir fonksiyon, tüm e-postaları toplamaya yarar.

Aynı mantık her yerde: bir uç, sır bilmeyen birine bilgi sızdırmamalı. Şifre
sıfırlama formu adres kayıtlı olsun olmasın aynı cevabı döner.

## Hız sınırlama

Sır doğrulayan her uç sınırlanır: 5 yanlış denemede 5 dakika kilit.

Sayaç **veritabanında** tutulur, çerezde değil. Tehdit modeli "oturumu ele
geçiren kişi" olduğunda o kişi çerezi silip sayacı sıfırlayabilir.

## Grant tuzağı

Supabase, `public` şemasındaki fonksiyonlara varsayılan ayrıcalıklarla
`anon`, `authenticated` ve `service_role` için execute veriyor.
`revoke ... from public` bu açık grant'leri **kaldırmaz**.

Bu yüzden her zaman açıkça yaz:

```sql
revoke execute on function public.fn(...) from public, anon;
grant  execute on function public.fn(...) to authenticated;
```

Tabloya doğrudan erişim gerekmiyorsa `revoke all on table ... from anon,
authenticated` deyip yalnızca `security definer` fonksiyon üzerinden aç.

## Bilinen eksik: güvenlik başlıkları

`next.config.ts` içinde `headers()` tanımlı **değil**. Yani şu an
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` ve CSP yok.

Eklemeye değer, ama CSP'yi körlemesine ekleme: Next'in inline betikleri
(tema betiği `beforeInteractive` ile çalışıyor) ve Supabase alan adı
beyaz listeye girmezse site sessizce bozulur. Önce raporlama modunda
(`Content-Security-Policy-Report-Only`) dene.

## PL/pgSQL

Fonksiyon parametresi ile tablo kolonu **aynı adı taşımasın**. `on conflict
(kullanici)` satırı `42702 ambiguous` verir ve bu hata yalnızca bazı
dallarda ortaya çıktığı için gözden kaçar. Parametreyi farklı adlandır ya da
tabloya takma ad ver.
