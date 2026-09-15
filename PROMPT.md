Sana sunduğum tüm detaylara ve gereksinimlere göre; Next.js (App Router), Tailwind CSS ve Supabase (Auth, Database, Realtime, Storage & RLS) altyapısını kullanan tam teşekküllü, mesajlaşmalı ve yönetim panelli bir "Zihin Sözlük" (Stoa & Zihinsel Dayanıklılık Sözlüğü) web sitesi kodu yazmanı istiyorum.

---

### 1. PROJE ÖZETİ VE TASARIM DİLİ

- **Site Adı:** Zihin Sözlük (Slogan: Stoa, Psikoloji ve Zihinsel Dayanıklılık Platformu)
- **Tasarım İlhamı:** 2011 dönemi "Uludağ Sözlük Eski Mobil" (m.uludagsozluk.com) arayüzünün minimalist, retro, son derece hafif ve metin odaklı yapısı.
- **Renk Paleti (Antik Roma & Stoa Esintisi):**
  - Vurgu & Rozet Rengi (Antik Roma Sarısı): `#E5B80B` / `#D4AF37`
  - Koyu Tema Arka Planı (Tozlu Antik Taş): `#171513`
  - Açık Tema Arka Planı (Eskitilmiş Papirüs/Mermer): `#F4EFEA`
  - Gövde Metinleri: `#E6E1DA` (Koyu modda Mermer Beyazı)
  - Yardımcı Metinler: `#A09B93` (Toz Gri)

---

### 2. TÜM ÖZEL FONKSİYONLAR VE SİSTEMLER

#### A. Özel Mesajlaşma (DM), Anlık Bildirim & Engelleme Sistemi:

- Kullanıcılar birbirlerinin profillerinden veya entry altındaki kullanıcı adına tıklayarak **Özel Mesaj (DM)** gönderebilmeli ve gelen mesajları okuyup cevaplayabilmelidir. Mesajlar kişi bazında sohbet (konuşma) şeklinde listelenmelidir.
- **Canlı Mesaj Kutucuğu (`[mesajlar]`):** Okunmamış mesaj geldiğinde header'daki mesajlar butonu Antik Roma Sarısı renkte parlamalı ve yanında belirgin şekilde `[mesajlar (+1)]` / `[mesajlar (+3)]` rozeti yanmalıdır. Yeni mesajlar sayfa yenilemeden (Supabase Realtime ile) anında görünmelidir.
- **Özel Mesajları Kapatma:** Her kullanıcı kendi ayarlarından özel mesajlarını kapatıp açabilmelidir (`[özel mesajları kapat]` / `[özel mesajları aç]`). Mesajları kapalı olan kullanıcıya kimse yeni mesaj gönderemez; profilinde ve entry kartında `[mesaj at]` butonu yerine "bu yazar özel mesajlarını kapattı" notu görünür. Önceki mesajlaşmalar silinmez, kullanıcı eski mesajlarını okumaya devam edebilir.
- **Kullanıcı Engelleme (Block):** Kullanıcılar istemedikleri kişileri profillerinden engelleyebilmeli (`[engelle]`) ve istediğinde engeli kaldırabilmelidir (`[engeli kaldır]`). Engellenen kullanıcı diğer kullanıcıya mesaj gönderemez.
- Mesaj gönderme kuralları (engel, kapalı mesaj, banlı/dondurulmuş hesap) sadece arayüzde değil, veritabanında RLS kurallarıyla da zorunlu tutulmalıdır.

#### B. Topluluk Kuralları & Nezaket İlkesi:

- Kayıt olma ekranında ve sitenin alt bilgisinde (footer) belirgin bir **"Stoa Adabı ve Sözlük Kuralları"** uyarısı bulunmalıdır:
  > _"Zihin Sözlük üyeleri birbirine karşı nazik, saygılı ve nezaket kurallarına uygun hareket etmekle yükümlüdür. Hakaret, kışkırtma ve nezaketsiz davranışlarda bulunan hesaplar site yetkilileri tarafından koşulsuz olarak uçurulacaktır (banlanacaktır)."_

#### C. Süper Admin Kontrol Paneli (Gelişmiş Yönetim):

- Admin yetkisi, kodun içine gömülü bir kullanıcı adı/şifre ile DEĞİL, Supabase veritabanında ilgili hesabın `role` alanı elle 'admin' yapılarak verilir.
- Sadece Admin ve Mod yetkisine sahip hesaplara özel, diğer kullanıcıların kesinlikle göremediği ve erişemediği gizli bir `/admin` yönetim paneli olmalıdır. Erişim kontrolü hem sunucu tarafında hem de RLS kurallarıyla yapılmalıdır.
- **Admin Paneli Yetkileri:**
  - **Kullanıcı Uçurma / Banlama:** Sitedeki tüm kullanıcıları listeleme, kurallara uymayan kullanıcıları tek tıkla "uçurma" (banlama) yetkisi. Banlanan kullanıcı siteye giriş yapamaz.
  - **Hesap Dondurma:** Bir kullanıcının hesabını geçici olarak dondurabilme. Dondurulan hesap giriş yapabilir ama entry yazamaz, oy veremez ve mesaj gönderemez.
  - **Hesap Açma:** Banlanmış veya dondurulmuş bir hesabı tek tıkla yeniden aktif hale getirebilme (`[banı kaldır]` / `[hesabı aç]`).
  - **Yetkili Atama:** Admin, istediği kullanıcıya `role: 'mod'` yetkisi verebilir ve bu yetkiyi istediği zaman geri alabilir. Atanan yetkili (mod) de kullanıcı banlama, dondurma ve hesap açma işlemlerini yapabilir; ancak başka birine yetki veremez ve admin hesabına işlem yapamaz.

#### D. 1. Nesil – Kurucu Filozof & Rozetler:

- İlk kaydolan kullanıcılar otomatik olarak `generation: '1. Nesil'` ve `title: 'Kurucu Filozof'` unvanı alır. Bu ünvan entry'lerde yazar adının yanında altın sarısı rozetle gösterilir.

#### E. Canlı Bildirimler & Favoriler:

- Entry'si artılandığında, favorilendiğinde veya cevap geldiğinde `[bildirimler (sayı)]` uyarısı çıkar.
- Her kullanıcının profilinde beğendiği entry'leri topladığı `[favoriler]` sekmesi yer alır.

---

### 3. MOBİL VE WEB (MASAÜSTÜ) UYUMU

- **Tek site, iki ekran:** Mobil ve masaüstü ayrı siteler değil, aynı kod tabanından çalışan tek bir responsive site olmalıdır.
- **Aynı görünüm:** Mobil ve masaüstü sürümleri birbirine çok benzemelidir; aynı renkler, aynı yazı tipi, aynı menü düzeni ve aynı Uludağ Mobil tarzı sade yapı. Masaüstünde içerik ekranın ortasında, okunaklı genişlikte (max-width) bir sütunda durur; ekrana yayılmaz.
- **Eksiksiz özellik:** Mobilde hiçbir özellik kısıtlanmamalıdır. Mesajlaşma, bildirimler, favoriler, ayarlar ve `/admin` yönetim paneli dahil her şey telefonda da tam çalışmalıdır.
- **Bağlı ve senkron:** Aynı hesapla telefondan ve bilgisayardan aynı anda giriş yapılabilmelidir. Bir cihazda gönderilen mesaj, yazılan entry, okunan bildirim veya değiştirilen ayar diğer cihazda sayfa yenilemeden anında güncellenmelidir (Supabase Realtime).
- **Güçlü ve hızlı:** Sayfalar mobil internette de hızlı açılmalı; gereksiz ağır görsel ve kütüphane kullanılmamalı, butonlar parmakla rahat tıklanacak büyüklükte olmalıdır.

---

### 4. ARAYÜZ VE MENÜ YAPISI (Uludağ Mobil Stili)

- **Header (Üst Bar):**
  - Sol: `ZİHİN SÖZLÜK` logosu.
  - Sağ (Giriş Yapılmışsa): `[ben]` | `[mesajlar (+1)]` | `[bildirimler]` | `[favoriler]` | `[ayarlar]` | `[çıkış]`. (Admin veya Mod ise ek olarak sarı renkli `[yönetim]`). Mobilde bu bağlantılar alt alta taşmadan, sade bir satırda veya açılır menüde gösterilir.
  - Alt Bar: `[bugün]` `[gündem]` `[dün]` `[rastgele]` sekmeleri + Arama kutusu ve `[getir]` butonu.

- **Entry Kartı:**
  - Mikro avatar + Yazar Nick'i + `(1. nesil – kurucu filozof)` unvan rozeti.
  - Entry metni.
  - Alt bar: `[+]` `[-]` oylama, `[favorile]`, `[mesaj at]` (yazarın mesajları kapalıysa gizlenir), Tarih/Saat.

- **Ayarlar Sayfası (`[ayarlar]`):**
  - Avatar değiştirme.
  - `[özel mesajları kapat]` / `[özel mesajları aç]` anahtarı.
  - Engellenen kullanıcılar listesi ve `[engeli kaldır]` butonları.

---

### 5. SUPABASE VERİTABANI ŞEMASI (SQL)

Aşağıdaki veritabanı tablolarını ve RLS güvenlik kurallarını içeren SQL kodunu üret:

1. **`profiles`:** `id`, `username`, `email`, `avatar_url`, `role` ('admin', 'mod', 'user'), `generation`, `title`, `is_banned` (BOOLEAN), `is_frozen` (BOOLEAN), `allow_messages` (BOOLEAN, varsayılan: true), `created_at`.
2. **`topics`:** `id`, `title`, `slug`, `youtube_url`, `created_by`, `created_at`.
3. **`entries`:** `id`, `topic_id`, `user_id`, `content`, `upvotes`, `downvotes`, `created_at`.
4. **`messages`:** `id`, `sender_id`, `receiver_id`, `content`, `is_read` (BOOLEAN), `created_at`.
5. **`blocks`:** `id`, `blocker_id`, `blocked_id`, `created_at`.
6. **`favorites`:** `id`, `user_id`, `entry_id`, `created_at`.
7. **`notifications`:** `id`, `user_id`, `actor_id`, `type`, `entry_id`, `is_read` (BOOLEAN), `created_at`.

`messages` tablosuna yeni kayıt ekleme kuralı; gönderen banlı veya dondurulmuşsa, alıcı `allow_messages = false` ise veya iki kullanıcı arasında engel varsa mesajı reddetmelidir.

---

### 6. BEKLENEN ÇIKTI

Lütfen bana:

1. Güncellenmiş Supabase SQL veritabanı kurulum scriptini (Storage bucket yetkileriyle birlikte),
2. Next.js Tailwind konfigürasyonunu ve Antik Roma Sarısı renk tanımlamalarını,
3. Mesajlaşma (DM + `+1` Rozeti + Mesajları Kapatma), Engelleme, Ayarlar Sayfası, Mikro Avatar Destekli Entry Kartı, Canlı Bildirimler ve Gizli `/admin` Yönetim Paneli (banlama, dondurma, hesap açma, mod atama) bileşenlerini,
4. Mobil ve masaüstünde aynı görünen, tüm cihazlarda anlık senkron çalışan responsive yapıyı,
5. E-posta ile Kayıt/Giriş ve Yetkilendirme (Auth & RLS) kodlarını eksiksiz şekilde yazıp sun.
