import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProposalCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-6 w-3/4 max-w-[200px]" />
          <Skeleton className="h-5 w-16 flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-4" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 flex-shrink-0" />
            <Skeleton className="h-3 w-24 max-w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4">
        <div className="w-full space-y-2">
          {/* Vote Counts Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
            <div>
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
            <div>
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          </div>
          
          {/* Total Votes */}
          <div className="text-center pt-2 border-t">
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
} 