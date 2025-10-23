import { Skeleton } from "./skeleton";

export function TaskDetailsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-10 w-24 mb-4" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 space-y-6">
        <div className="flex items-start justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="flex flex-col gap-5 pb-5 border-b">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>

        <div className="p-4 bg-muted rounded-md space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}