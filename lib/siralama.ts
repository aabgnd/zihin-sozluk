// Düz modül: hem sunucu hem istemci bileşenleri buradan okur.
// ("use client" dosyasından dışa aktarılan değerler sunucuda gerçek veri olmaz.)
export const SORT_OPTIONS = [
  { value: "eski", label: "en eski" },
  { value: "yeni", label: "en yeni" },
  { value: "begeni", label: "en beğenilen" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function normalizeSort(value: string | undefined): SortValue {
  return SORT_OPTIONS.some((option) => option.value === value) ? (value as SortValue) : "eski";
}
