import { Skeleton } from '@/components/ui/skeleton';

/** Feedback immédiat au clic — la nav du layout reste montée. */
export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="mt-2 h-3 w-24" />
      <Skeleton className="h-14 rounded-lg" />
      <Skeleton className="h-14 rounded-lg" />
      <Skeleton className="h-14 rounded-lg" />
    </div>
  );
}
