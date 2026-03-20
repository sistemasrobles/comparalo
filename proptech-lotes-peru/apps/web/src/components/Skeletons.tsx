export function ProjectCardSkeleton() {
  return (
    <div className="card overflow-hidden bg-white animate-pulse">
      <div className="aspect-[16/10] bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 bg-slate-100 rounded-lg" />
          <div className="h-14 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-3 bg-slate-100 rounded w-12" />
          <div className="h-3 bg-slate-100 rounded w-16" />
          <div className="h-3 bg-slate-100 rounded w-14 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function ProjectCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProjectListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden bg-white animate-pulse">
          <div className="flex">
            <div className="w-52 h-40 bg-slate-200 flex-shrink-0" />
            <div className="flex-1 p-5 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map((j) => <div key={j} className="h-12 bg-slate-100 rounded" />)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
