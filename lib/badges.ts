// Eşiklerin tek kaynağı veritabanındaki badge_config() fonksiyonudur (göç 004).
// Buradaki metinler sadece rozetin adı ve açıklamasıdır.
export const BADGES: Record<string, { label: string; description: string }> = {
  cirak: {
    label: "Çırak",
    description: "yazarlığa yükseltilen üyelere verilen ilk rozet.",
  },
  dusunur: {
    label: "Düşünür",
    description: "25 entry yazan yazarlara verilir.",
  },
  bilge_yazar: {
    label: "Bilge Yazar",
    description: "100 entry ve 250 artı oya ulaşan yazarlara verilir.",
  },
  ilk_nesil_filozof: {
    label: "1. Nesil Filozof",
    description: "sözlüğe ilk kaydolan üyelere verilir.",
  },
};

export const SUMMARY_PERIODS = [
  { value: "ay", label: "bu ay" },
  { value: "yil", label: "bu yıl" },
] as const;
