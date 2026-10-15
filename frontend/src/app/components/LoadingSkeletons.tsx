// Reusable skeleton loaders so list/grid/stat sections show a shaped
// placeholder instead of a bare spinner while data loads. Keeps the loading
// state consistent across dashboards (Stage 6).

import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

/** Grid of card placeholders — matches the discover/posts/fundraiser grids. */
export function CardGridSkeleton({ count = 6, withImage = true }: { count?: number; withImage?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {withImage && <Skeleton className="h-40 w-full" />}
          <div className="p-6 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Vertical list of row placeholders — matches supporters/transactions lists. */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Row of stat-card placeholders — matches the overview stat cards. */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
