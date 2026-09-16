// Rütbe sisteminin tek ayar noktası. Bu sayıyı değiştirmen yeterli:
// tüm kullanıcıların rütbesi entry sayısından anlık hesaplandığı için
// eşik değişince herkesin rütbesi kendiliğinden yeniden hesaplanır.
export const RUTBE_ESIGI = 100;

export const RUTBELER = ["çırak", "kalfa", "usta", "sanatçı"] as const;
export type Rutbe = (typeof RUTBELER)[number];

// Seviye yükseldikçe rozet daha gösterişli: çırak en sade, sanatçı dolu altın.
export const RUTBE_STILLERI: Record<Rutbe, string> = {
  çırak: "border-line bg-page text-ink",
  kalfa: "border-gold/60 bg-gold/20 text-gold-ink",
  usta: "border-gold bg-gold/40 text-gold-ink",
  sanatçı: "border-gold bg-gold text-on-gold shadow-sm",
};

export function rutbeSeviyesi(entryCount: number) {
  const safeCount = Math.max(0, Math.trunc(entryCount));
  return Math.min(Math.floor(safeCount / RUTBE_ESIGI), RUTBELER.length - 1);
}

export function rutbeBul(entryCount: number): Rutbe {
  return RUTBELER[rutbeSeviyesi(entryCount)];
}

// "usta'ya 37 entry kaldı" · en üst rütbede null döner.
export function rutbeIlerlemesi(entryCount: number): string | null {
  const level = rutbeSeviyesi(entryCount);
  if (level >= RUTBELER.length - 1) return null;

  const sonraki = RUTBELER[level + 1];
  const kalan = (level + 1) * RUTBE_ESIGI - Math.max(0, Math.trunc(entryCount));
  return `${sonraki}'ya ${kalan} entry kaldı`;
}
