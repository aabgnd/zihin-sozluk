// Ortadan kesilmiş yarım ceviz: içi beyne benzer, "zihin"in simgesi.
// Kabuk yazı rengini (currentColor) alır; iç tek sarıyla dolar ve çizgileri
// her iki temada koyu kalır ki sarı üzerinde okunsun.
export default function CevizLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Kabuk: iki ucu sivri */}
      <path
        strokeWidth="1.9"
        d="M16 1.6C22.2 3.2 27.6 8.6 27.6 16S22.2 28.8 16 30.4C9.8 28.8 4.4 23.4 4.4 16S9.8 3.2 16 1.6Z"
      />

      {/* İç: iki lob */}
      <g className="fill-gold stroke-on-gold" strokeWidth="1.2">
        <path d="M15 5.2C13 5.2 11.4 6 10.6 7.4 8.8 7.6 7.6 9 7.8 10.8 6.4 12 6.2 14 7.2 15.4 6.2 17 6.4 19.2 7.8 20.4 7.8 22.4 9.2 23.8 11 24 11.8 25.6 13.4 26.6 15 26.6Z" />
        <path d="M17 5.2C19 5.2 20.6 6 21.4 7.4 23.2 7.6 24.4 9 24.2 10.8 25.6 12 25.8 14 24.8 15.4 25.8 17 25.6 19.2 24.2 20.4 24.2 22.4 22.8 23.8 21 24 20.2 25.6 18.6 26.6 17 26.6Z" />
      </g>

      {/* Kıvrımlar: bilerek düzensiz */}
      <g className="stroke-on-gold" strokeWidth="1">
        <path d="M9.8 10.6C11.2 10 12.6 10.8 12.4 12.2" />
        <path d="M8.8 15.6C10.4 15.8 11.2 16.8 12.8 16.2" />
        <path d="M9.6 20.4C10.8 19.6 12.2 20.2 12.4 21.6" />
        <path d="M13.4 7.8C13.2 9 13.8 9.8 14.4 10" />
        <path d="M22.4 9.4C21.2 10.2 21 11.6 22 12.4" />
        <path d="M24.2 14.6C22.6 14.2 21.4 15 21.2 16.4" />
        <path d="M19.2 18.6C20 19.6 21.4 19.8 22.4 19" />
        <path d="M21.2 22.8C20.6 22 19.4 21.8 18.6 22.4" />
      </g>
    </svg>
  );
}
