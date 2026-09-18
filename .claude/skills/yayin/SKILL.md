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

**Push'ta takılma.** Oturum etkileşimsiz; Git Credential Manager giriş
penceresi açarsa görünmez ve push zaman aşımına kadar donar. Bu yüzden
`~/.claude/settings.json` içinde `GCM_INTERACTIVE=never` ve
`GIT_TERMINAL_PROMPT=0` tanımlı: kimlik sorunu artık donma değil, anında
hata olarak döner.

- Push'u zaman sınırıyla çalıştır: `timeout 60 git push origin main` (Bash).
- `Authentication failed` / `could not read Username` görürsen **tekrar
  deneme**. Token'ın süresi dolmuştur; kullanıcıya "PC'de bir kez
  `git push` yapıp tarayıcıdan GitHub'a giriş yap" de ve dur.
- Push'tan sonra `git status -sb` ile `origin/main` ile eşit olduğunu
  gör. Görmeden "pushlandı" deme.

**Yeniden yayın için boş commit atma.** "Trigger Vercel redeploy" gibi boş
commit'ler geçmişte atıldı ve işe yaramadı: derleme zaten sıradaydı,
sadece 1-3 dakika sürüyordu. Yayın gecikiyorsa bekle ve ölç; hâlâ eskiyse
kullanıcıya Vercel panelindeki derleme durumuna bakmasını söyle.

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
