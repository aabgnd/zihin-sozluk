export default function CaylakBox({
  entryCount,
  threshold,
}: {
  entryCount: number;
  threshold: number;
}) {
  const done = Math.min(entryCount, threshold);
  const percent = Math.round((done / threshold) * 100);

  return (
    <details
      open
      className="rounded-xl border border-gold bg-surface shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-bold [&::-webkit-details-marker]:hidden">
        <span>Çaylak Modu</span>
        <span className="text-sm font-semibold text-gold-ink">
          Yazarlığa: {done}/{threshold} entry
        </span>
      </summary>

      <div className="space-y-3 px-4 pb-4 text-sm leading-relaxed text-muted">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-page">
          <div
            className="h-full rounded-full bg-gold"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p>
          Zihin Sözlük&apos;e hoş geldin. Şu an çaylaksın: var olan başlıklara
          entry yazabilirsin, ama yeni başlık açamaz ve özel mesaj
          gönderemezsin.
        </p>

        <div>
          <p className="font-bold text-ink">Entry nasıl yazılır?</p>
          <p>
            Her entry, başlığın ne olduğunu, ne işe yaradığını, ne anlama
            geldiğini ya da ne hissettirdiğini anlatan bir tanım cümlesiyle
            yazılır: &quot;...durumudur&quot;, &quot;...eylemidir&quot;,
            &quot;...hissidir&quot;, &quot;...kişidir&quot; gibi.
          </p>
          <p className="mt-1">
            Örnek — başlık: <em>sabır</em> → &quot;olacak olanı telaşa
            kapılmadan kabul edebilme gücüdür.&quot;
          </p>
          <p className="mt-1">
            Başlık altına sohbet yazılmaz. &quot;selam naber&quot;, &quot;bence
            de kanka&quot; gibi mesajlar, başka yazarlara hitap ya da forum
            tarzı tartışmalar silinir. Entry tek başına okunduğunda bir tanım
            veya analiz olmalıdır.
          </p>
        </div>

        <div>
          <p className="font-bold text-ink">Yazarlık</p>
          <p>
            Entry&apos;lerin moderasyon tarafından okunur. {threshold}{" "}
            entry&apos;ni tamamladığında yazarlık için incelemeye alınırsın;
            onaylanınca yazar olursun.
          </p>
        </div>

        <div>
          <p className="font-bold text-ink">Kurallar</p>
          <p>
            Küfür, spam, tehdit veya hakaret içeren entry&apos;ler silinir ve
            şikayet edilebilir. Moderasyon, kuralları çiğneyen üyeyi
            susturabilir veya siteden uzaklaştırabilir.
          </p>
        </div>
      </div>
    </details>
  );
}
