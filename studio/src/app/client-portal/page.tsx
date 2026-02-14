
import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientPortalContent from './client-portal-content';

function ClientPortalLoading() {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Welcome"
          description="Loading your documents..."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
                <CardHeader><Skeleton className="h-4 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
            </Card>
        </div>
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Your Documents</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
}


export default function ClientPortalPage() {
  return (
    <Suspense fallback={<ClientPortalLoading />}>
        <ClientPortalContent />
    </Suspense>
  );
}
