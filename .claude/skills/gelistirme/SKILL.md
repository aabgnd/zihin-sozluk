---
name: gelistirme
description: Zihin Sözlük kod tabanında geliştirme yaparken uyulacak sıra ve bu projede bedeli ödenmiş tuzaklar. Next.js 16 App Router, React 19, Tailwind v4 ve Supabase kullanan bu depoda kod yazarken, bileşen eklerken, rota açarken, sunucu eylemi yazarken ya da "şunu ekle / şunu düzelt" denince bu skill'i kullan. Özellikle yeni bir rota, "use client" bileşeni, "use server" dosyası ya da route handler eklemeden önce mutlaka oku — buradaki tuzakların her biri bu projede gerçekten yaşandı ve saatler kaybettirdi.
---

# Zihin Sözlük: geliştirme

## Yığın

- **Next.js 16**, App Router + Turbopack. `middleware.ts` yerine `proxy.ts`.
- **React 19**: `useActionState`, sunucu eylemleri, sunucu/istemci sınırı.
- **Tailwind v4**: CSS-first. `tailwind.config` **yok**; tokenlar
  `app/globals.css` içinde `@theme inline` ile tanımlı.
- **Supabase**: `@supabase/ssr`, RLS, `security definer` fonksiyonlar.
- Windows + PowerShell. Yanıtlar Türkçe.

## Çalışma sırası

```
npx tsc --noEmit        # hızlı tip kontrolü
npm run build           # üretim derlemesi
<ölçüm / doğrulama>     # tasarim ve guvenlik skill'lerine bak
madde başına commit
push
```

Derleme geçmeden commit atma. Ölçmeden "çalışıyor" deme.

## Bu projede bedeli ödenmiş tuzaklar

Aşağıdakiler teorik değil; her biri yaşandı ve zaman kaybettirdi. Yeni kod
yazarken bunlara denk gelirsen ne olduğunu bilmen, tekrar teşhis etmekten
çok daha ucuz.

### `"use client"` dosyasından değer ihraç etme

İstemci modülünden dışa verilen bir sabit, sunucuda **istemci referansına**
dönüşür. Sunucu bileşeni onu import edip kullanınca üretimde 500 alırsın:

```
TypeError: SORT_OPTIONS.some is not a function
```

Paylaşılan sabitleri düz bir modüle koy. `lib/siralama.ts` tam da bu yüzden
var. Aynı hatanın ikinci hâli: bir bileşenin içinden sınıf adı ihraç edip
başka dosyada kullanmak.

### `"use server"` dosyaları

Yalnızca `async` fonksiyon dışa verebilir. Dosyaya sabit ekleyip `export`
koyarsan derleme kırılır. Sabiti `export` etmeden bırak ya da başka dosyaya
taşı.

### Route handler'da oturum çerezleri

Kendi `NextResponse`'unu döndüren bir route handler, `cookies()` üzerinden
yazılan çerezleri **yanıta iliştirmez**. Sonuç sinsi: doğrulama başarılı olur
ama kullanıcı giriş yapmamış olarak siteye düşer.

Çözüm `lib/auth-confirm.ts` içinde: istemci doğrudan isteğe bağlanır, üretilen
çerezler toplanır ve dönen yanıta tek tek yazılır.

### Yeni rota eklerken tip hatası

`PageProps<"/yeni-rota">` tipleri Next tarafından **`next build` sırasında**
üretilir. Yeni rota ekledikten sonra `tsc` çalıştırırsan şunu görürsün:

```
Type '"/yeni-rota"' does not satisfy the constraint 'AppRoutes'
```

Bu gerçek bir hata değil. Önce `npm run build`, sonra `tsc`.

### PowerShell

- `&&` ve `||` **yok**. `A; if ($?) { B }` kullan.
- Bash here-string (`<<'MSG'`) **yok**; PowerShell'de parse hatası verir.
- Uzun commit mesajı için mesajı dosyaya yaz, `git commit -F <dosya>` ile ver.
  Tırnak içeren mesajlar `-m` ile parçalanıyor.
- `Set-Content -Encoding utf8` BOM ekler; JSON yazarken
  `[System.IO.File]::WriteAllText` kullan.
- Bash aracı da mevcut (Git Bash); heredoc gerekiyorsa onu kullan.

### Biçimlendirme kancası

`~/.claude/settings.json` içindeki `PostToolUse` kancası her yazımdan sonra
Prettier ve `eslint --fix` çalıştırır. Prettier projenin bağımlılığı değil,
npx önbelleğinden gelir; kanca onu `--no-install` ile çağırır, önbellekte
yoksa sessizce atlar (indirmeye çalışıp donmaz). Kanca 30 sn'de kesilir.
Bu yüzden:

- Her yazım ~15-20 sn sürer; bu donma değil, ESLint'in açılışı.
- Yazdıktan hemen sonra alınan tanılama (diagnostics) **eski** olabilir;
  panikleme, `tsc` ile teyit et.
- Bir `Edit`'in `old_string`'i tutmuyorsa dosya yeniden biçimlenmiş olabilir;
  önce oku.
- `git status` bir dosyayı değişmiş gösterip `git diff` boş dönüyorsa fark
  yalnızca satır sonudur (LF/CRLF); gerçek değişiklik değil.

### JSX'te yorum

`return (` ile eleman arasına `{/* */}` koyma: ikinci bir çocuk sayılır ve
`TS2657: JSX expressions must have one parent element` verir. Yorumu
`return`'ün üstüne al.

Öznitelik listesinin içindeki `//` yorumu ise **geçerlidir** (tsc ile
doğrulandı). Bu dosyanın eski bir sürümü aksini söylüyordu; yanlıştı.

## Supabase kalıpları

- Gömülü ilişki (`topic:topics!fk(...)`) tip olarak dizi görünür; tek satır
  bekliyorsan `as unknown as Satir` ile daralt.
- `getViewer()` `cache()`li: istek başına bir kez çalışır, çağırmaktan
  çekinme.
- Sorgular `Promise.all` ile paralel yapılır; ardışık `await` zinciri her
  biri için ağ gecikmesi ekler.
- Yeni kolon eklerken dağıtım güvenliği için **guvenlik** skill'ine bak.

## Proje haritası

```
app/          rotalar, sunucu eylemleri (actions.ts)
components/   paylaşılan bileşenler
lib/          yardımcılar, tipler, supabase istemcileri
supabase/migrations/   numaralı SQL dosyaları
```

Gerçek tablolar — varsayma, bunlar:

| Tablo                                  | İçerik                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `profiles`                             | kullanıcı (auth.users'a bağlı). e-posta burada **değil**                    |
| `topics` / `entries`                   | başlık ve entry. entry'de `user_id`, `topic_id`, `content`                  |
| `entry_votes` / `favorites`            | oy ve favori                                                                |
| `messages`                             | özel mesaj. `sender_deleted_at`/`receiver_deleted_at` ile tek taraflı silme |
| `notifications` / `follows` / `blocks` | bildirim, takip, engel                                                      |
| `reports` / `mod_log`                  | şikayet ve moderasyon kaydı (RLS ile kapalı)                                |
| `user_badges` / `badge_config`         | rozetler                                                                    |
| `topic_stats`                          | görünüm: `entry_count`, `today_count`, `last_entry_at`                      |

`users`, `likes`, `private_messages`, `audit_logs` diye tablolar **yoktur**.
Entry'de onay (`approved`) akışı da yoktur; yazarlık çaylak sistemiyle
yürür.

Entry numarası = `entries.id`. Ayrı bir numara kolonu yok, olmasına da gerek
yok: id 1'den başlar, yazılma sırasındadır, değişmez ve silinince boşluk
bırakır.

Adlandırma Türkçe (`referanslariBagla`, `yonlendir`, `korumali`). Yorumlar da
Türkçe ve **niçin**'i anlatır, ne olduğunu değil.
