// Rütbe sisteminin tek ayar noktası. Bu sayıyı değiştirmen yeterli:
// tüm kullanıcıların rütbesi entry sayısından anlık hesaplandığı için
// eşik değişince herkesin rütbesi kendiliğinden yeniden hesaplanır.
export const RUTBE_ESIGI = 100;

export const RUTBELER = ["çırak", "kalfa", "usta", "sanatçı"] as const;
export type Rutbe = (typeof RUTBELER)[number];

/*
 * Seviye yükseldikçe rozet belirginleşir: gri çerçeve → sarı çerçeve →
 * yumuşak sarı dolgu → dolu sarı.
 *
 * Yazı her seviyede KOYU. Sarı yalnızca çerçeve ve dolgu olarak kullanılır;
 * sarı yazı beyaz zeminde 1,61:1 ile okunmuyor, soluk sarı zemin üzerinde
 * sarı yazı ise neredeyse hiç okunmuyordu (kalfa ve usta bu yüzden bozuktu).
 */
export const RUTBE_STILLERI: Record<Rutbe, string> = {
  çırak: "border-line text-muted",
  kalfa: "border-gold text-ink",
  usta: "border-gold bg-gold/25 text-ink",
  sanatçı: "border-gold bg-gold text-on-gold",
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
