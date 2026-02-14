
'use client'
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FileText, Users, BarChartBig, ArrowUpRight } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProformas } from '@/hooks/use-proformas';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: proformas, isLoading } = useProformas();

  const totalProformas = proformas?.length ?? 0;
  const approvedProformas = proformas?.filter(p => p.status === 'APPROVED') ?? [];
  const totalBilled = approvedProformas.reduce((sum, p) => sum + p.grandTotal, 0);
  
  const approvalRate = totalProformas > 0 
    ? (approvedProformas.length / totalProformas) * 100
    : 0;
  
  const recentProformas = proformas?.slice(0, 3) ?? [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Dashboard"
          description="Welcome to Aquarius. Here's an overview of your activities."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Recent Proformas</CardTitle></CardHeader>
          <CardContent><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Dashboard"
        description="Welcome to Aquarius. Here's an overview of your activities."
        actions={
          <Link href="/proformas/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Proforma
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Proformas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProformas}</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Billed (Approved)</CardTitle>
            <BarChartBig className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBilled.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From approved proformas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Approval Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Based on current statuses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Proformas</CardTitle>
          <CardDescription>A quick look at your latest proformas.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentProformas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proforma #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProformas.map((proforma) => (
                  <TableRow key={proforma.id}>
                    <TableCell className="font-medium">{proforma.proformaNumber}</TableCell>
                    <TableCell>{proforma.clientName}</TableCell>
                    <TableCell><StatusBadge status={proforma.status} /></TableCell>
                    <TableCell className="text-right">${proforma.grandTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                       <Link href={`/proformas/${proforma.id}`} passHref>
                        <Button variant="outline" size="sm">
                          View <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No recent proformas to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
