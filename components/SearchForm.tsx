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
        className="h-10 min-w-0 flex-1 rounded-sm border border-line bg-surface px-3 text-base text-ink focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        className="h-10 rounded-sm bg-bar px-4 text-[15px] text-on-bar hover:text-gold lg:bg-bar-2"
      >
        getir
      </button>
    </form>
  );
}
