import { Skeleton } from "./skeleton";

export function TaskHistorySkeleton() {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-l-2 border-blue-500 px-4 py-3 bg-gray-50 rounded-r">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2 mt-1.5">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-3 w-40 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}