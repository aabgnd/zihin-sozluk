// Yükleme iskeletleri: tıklandığı anda sayfanın şekli görünsün diye.
function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface-2 ${className}`} />;
}

export function TitleSkeleton() {
  return (
    <div className="border-b border-line pb-3">
      <Bar className="h-7 w-52" />
    </div>
  );
}

export function RowsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="flex items-center justify-between gap-3 border-b border-line py-4"
        >
          <Bar className="h-4 w-[min(60%,18rem)]" />
          <Bar className="h-3 w-6" />
        </li>
      ))}
    </ul>
  );
}

export function EntriesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-2 border-b border-line py-6">
          <Bar className="h-4 w-40" />
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-[92%]" />
          <Bar className="h-3 w-[70%]" />
          <div className="flex items-center justify-between pt-2">
            <Bar className="h-9 w-32" />
            <Bar className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
