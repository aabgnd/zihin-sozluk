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
    <details open className="rounded-md border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span>çaylak modu</span>
        <span className="text-gold-ink">
          yazarlığa: {done}/{threshold} entry
        </span>
      </summary>

      <div className="space-y-3 px-4 pb-4 text-sm leading-relaxed text-muted">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
        </div>

        <p>
          Zihin Sözlük&apos;e hoş geldin. Şu an çaylaksın: var olan başlıklara entry yazabilirsin,
          ama yeni başlık açamaz ve özel mesaj gönderemezsin.
        </p>

        <div>
          <p className="font-semibold text-ink">Entry nasıl yazılır?</p>
          <p>
            Her entry, başlığın ne olduğunu, ne işe yaradığını, ne anlama geldiğini ya da ne
            hissettirdiğini anlatan bir tanım cümlesiyle yazılır: &quot;...durumudur&quot;,
            &quot;...eylemidir&quot;, &quot;...hissidir&quot;, &quot;...kişidir&quot; gibi.
          </p>
          <p className="mt-1">
            Örnek — başlık: <em>sabır</em> → &quot;olacak olanı telaşa kapılmadan kabul edebilme
            gücüdür.&quot;
          </p>
          <p className="mt-1">
            Başlık altına sohbet yazılmaz. &quot;selam naber&quot;, &quot;bence de kanka&quot; gibi
            mesajlar, başka yazarlara hitap ya da forum tarzı tartışmalar silinir. Entry tek başına
            okunduğunda bir tanım veya analiz olmalıdır.
          </p>
        </div>

        <div>
          <p className="font-semibold text-ink">Yazarlık</p>
          <p>
            Entry&apos;lerin moderasyon tarafından okunur. {threshold} entry&apos;ni tamamladığında
            yazarlık için incelemeye alınırsın; onaylanınca yazar olursun.
          </p>
        </div>

        <div>
          <p className="font-semibold text-ink">Kurallar</p>
          <p>
            Küfür, spam, tehdit veya hakaret içeren entry&apos;ler silinir ve şikayet edilebilir.
            Moderasyon, kuralları çiğneyen üyeyi susturabilir veya siteden uzaklaştırabilir.
          </p>
        </div>
      </div>
    </details>
  );
}
