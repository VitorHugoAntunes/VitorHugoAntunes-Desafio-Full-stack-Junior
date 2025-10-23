import { Skeleton } from "./skeleton";

export function NotificationSkeleton() {
  return (
    <div className="w-96 p-0">
      <div className="flex items-center justify-between p-4 border-b">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border-b">
            <div className="flex items-start gap-3">
              <Skeleton className="w-2 h-2 rounded-full mt-2" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t bg-gray-50">
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>
    </div>
  );
}