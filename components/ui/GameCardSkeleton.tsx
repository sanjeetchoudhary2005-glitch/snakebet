export function GameCardSkeleton() {
  return (
    <div className="h-72 w-full animate-pulse overflow-hidden rounded-lg border border-white/5 bg-bv-surface">
      <div className="h-40 bg-white/5" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-3/4 rounded bg-white/10" />
        <div className="h-5 w-1/2 rounded bg-white/10" />
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-3 w-16 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}
