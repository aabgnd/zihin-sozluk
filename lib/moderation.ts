export const REPORT_REASONS = [
  { value: "kufur_hakaret", label: "küfür / hakaret" },
  { value: "spam_reklam", label: "spam / reklam" },
  { value: "tehdit", label: "tehdit" },
  { value: "kural_disi", label: "kural dışı / tanım değil" },
  { value: "diger", label: "diğer" },
] as const;

export const MUTE_OPTIONS = [
  { value: "1", label: "1 gün" },
  { value: "3", label: "3 gün" },
  { value: "7", label: "7 gün" },
  { value: "suresiz", label: "süresiz" },
] as const;

export const REASON_LABELS: Record<string, string> = Object.fromEntries(
  REPORT_REASONS.map((reason) => [reason.value, reason.label]),
);

export const MOD_ACTION_LABELS: Record<string, string> = {
  entry_silindi: "entry silindi",
  entry_geri_yuklendi: "entry geri yüklendi",
  entry_kalici_silindi: "entry kalıcı silindi",
  baslik_silindi: "başlık silindi",
  baslik_geri_yuklendi: "başlık geri yüklendi",
  baslik_kalici_silindi: "başlık kalıcı silindi",
  susturuldu: "susturuldu",
  susturma_kaldirildi: "susturma kaldırıldı",
  yazar_yapildi: "yazar yapıldı",
  caylaga_dusuruldu: "çaylağa düşürüldü",
  yazarlik_ertelendi: "yazarlık ertelendi",
  hesap_durumu: "hesap durumu değişti",
  sikayet_islem_yapildi: "şikayete işlem yapıldı",
  sikayet_reddedildi: "şikayet reddedildi",
  rol_degisti: "rol değişti",
};

// "süresiz" susturma: çok ileri bir tarih.
export function muteUntilFromOption(option: string): string {
  if (option === "suresiz") return "2999-12-31T00:00:00.000Z";
  const days = Number(option);
  if (!Number.isFinite(days) || days <= 0) return "2999-12-31T00:00:00.000Z";
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export function isPermanentMute(mutedUntil: string) {
  return new Date(mutedUntil).getFullYear() >= 2999;
}
