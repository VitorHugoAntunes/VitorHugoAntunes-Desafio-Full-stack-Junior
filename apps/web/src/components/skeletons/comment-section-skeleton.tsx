import { Skeleton } from "./skeleton";

export function CommentSectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Skeleton  className="h-20 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}