
'use client'
import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProformas } from '@/hooks/use-proformas';
import { Download, BarChart3, Users, CheckCircle, DollarSign, FileClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Proforma } from '@/types';

export default function StatsPage() {
  const { toast } = useToast();
  const { data: proformas, isLoading } = useProformas();

  const stats = useMemo(() => {
    if (!proformas) return null;

    const totalProformas = proformas.length;
    const approvedProformas = proformas.filter(p => p.status === 'APPROVED');
    const draftProformas = proformas.filter(p => p.status === 'DRAFT');
    const totalBilledAmount = approvedProformas.reduce((sum, p) => sum + p.grandTotal, 0);
    const draftAmount = draftProformas.reduce((sum, p) => sum + p.grandTotal, 0);

    const proformasByClient = proformas.reduce((acc, proforma) => {
        if (!acc[proforma.clientName]) {
            acc[proforma.clientName] = { count: 0, totalValue: 0, balance: 0, company: proforma.company };
        }
        acc[proforma.clientName].count++;
        acc[proforma.clientName].totalValue += proforma.grandTotal;
        const paid = proforma.payments?.reduce((s, p) => s + p.amount, 0) || 0;
        acc[proforma.clientName].balance += (proforma.grandTotal - paid);
        return acc;
    }, {} as Record<string, { count: number; totalValue: number; balance: number, company: Proforma['company'] }>);

    const treBalance = Object.values(proformasByClient).filter(c => c.company === 'Trade Evolution').reduce((sum, c) => sum + c.balance, 0);
    const stBalance = Object.values(proformasByClient).filter(c => c.company === 'Successful Trade').reduce((sum, c) => sum + c.balance, 0);

    return {
        totalProformas,
        approvedProformasCount: approvedProformas.length,
        draftProformasCount: draftProformas.length,
        totalBilledAmount,
        draftAmount,
        proformasByClient,
        treBalance,
        stBalance
    };
  }, [proformas]);


  const handleExportCSV = () => {
    console.log('Exporting CSV data...', proformas);
    toast({
      title: "CSV Export Started",
      description: "Your data is being prepared for download.",
    });
  };

  if (isLoading || !stats) {
    return (
      <div>
        <PageHeader
          title="Billing Statistics"
          description="Overview of your proforma billings and activities."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>)}
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All Proformas Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const { totalProformas, approvedProformasCount, draftProformasCount, totalBilledAmount, draftAmount, proformasByClient, treBalance, stBalance } = stats;

  return (
    <div>
      <PageHeader
        title="Billing Statistics"
        description="Overview of your proforma billings and activities."
        actions={
          <Button onClick={handleExportCSV} disabled={!proformas || proformas.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export as CSV
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Proformas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProformas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Approved Proformas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedProformasCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Draft Proformas</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftProformasCount}</div>
            <p className="text-xs text-muted-foreground">Value: ${draftAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Billed (Approved)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBilledAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
            <CardHeader><CardTitle>Total Balance (Trade Evolution)</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-600">${treBalance.toFixed(2)}</p></CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle>Total Balance (Successful Trade)</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-600">${stBalance.toFixed(2)}</p></CardContent>
        </Card>
      </div>
      
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>Balance by Client</CardTitle>
          <CardDescription>Summary of balance due for each client, separated by company.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="font-semibold mb-2">Trade Evolution</h3>
                <Table>
                    <TableHeader><TableRow><TableHead>Client</TableHead><TableHead className="text-right">Balance Due</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {Object.entries(proformasByClient).filter(([,data]) => data.company === 'Trade Evolution').map(([client, data]) => (
                        <TableRow key={client}><TableCell>{client}</TableCell><TableCell className="text-right">${data.balance.toFixed(2)}</TableCell></TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
             <div>
                <h3 className="font-semibold mb-2">Successful Trade</h3>
                <Table>
                    <TableHeader><TableRow><TableHead>Client</TableHead><TableHead className="text-right">Balance Due</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {Object.entries(proformasByClient).filter(([,data]) => data.company === 'Successful Trade').map(([client, data]) => (
                        <TableRow key={client}><TableCell>{client}</TableCell><TableCell className="text-right">${data.balance.toFixed(2)}</TableCell></TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Proformas Data</CardTitle>
          <CardDescription>Detailed list of all proformas included in statistics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proforma #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proformas?.map((proforma) => (
                <TableRow key={proforma.id}>
                  <TableCell className="font-medium">{proforma.proformaNumber}</TableCell>
                  <TableCell>{proforma.clientName}</TableCell>
                  <TableCell><StatusBadge status={proforma.status} /></TableCell>
                  <TableCell className="text-right">${proforma.grandTotal.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
