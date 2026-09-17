/**
 * Şifre yenileme bağlantısıyla açılan oturumu normal oturumdan ayıran çerez.
 *
 * Bağlantıdan gelen kişi kimliğini e-posta kutusuna erişerek kanıtlamıştır,
 * mevcut şifresini bilmesi beklenemez. Normal giriş yapmış biri ise şifre
 * değiştirmek için mevcut şifresini yazmak zorundadır; aksi hâlde açık
 * kalmış bir oturumu ele geçiren kişi şifreyi değiştirebilirdi.
 */
export const YENILEME_COOKIE = "sifre_yenileme";

/** Bağlantıyla açılan izin penceresi: 15 dakika. */
export const YENILEME_SURESI = 60 * 15;
