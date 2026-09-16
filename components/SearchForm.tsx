export default function SearchForm({
  inputId,
  className,
}: {
  inputId: string;
  className: string;
}) {
  return (
    <form action="/ara" role="search" className={`gap-2 ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        başlık ara
      </label>
      <input
        id={inputId}
        name="q"
        type="search"
        required
        maxLength={100}
        autoComplete="off"
        placeholder="başlık ara"
        className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-base text-ink placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        className="h-11 shrink-0 rounded-lg bg-ink px-4 text-[15px] font-semibold text-page hover:opacity-90"
      >
        getir
      </button>
    </form>
  );
}
