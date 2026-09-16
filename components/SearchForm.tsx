import { SearchIcon } from "./icons";

export default function SearchForm({
  inputId,
  className,
  autoFocus = false,
}: {
  inputId: string;
  className: string;
  autoFocus?: boolean;
}) {
  return (
    <form action="/ara" role="search" className={className}>
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
        autoFocus={autoFocus}
        placeholder="başlık, #entry, @yazar"
        className="h-11 min-w-0 flex-1 rounded-l-md border border-r-0 border-line bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        aria-label="ara"
        className="grid h-11 w-12 shrink-0 place-items-center rounded-r-md bg-gold text-on-gold hover:brightness-95"
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
}
