
'use client'
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Client, Proforma } from '@/types';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';
import { Eye, FileText, Anchor, Package, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useClients } from '@/hooks/use-clients';
import { useProformas } from '@/hooks/use-proformas';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const { data: proformas, isLoading: isLoadingProformas } = useProformas();

  const [client, setClient] = useState<Client | null>(null);
  const [clientProformas, setClientProformas] = useState<Proforma[]>([]);
  
  const clientIdFromUrl = searchParams.get('clientId');

  useEffect(() => {
    // This marks the session for layout logic. A bit of a workaround.
    if(clientIdFromUrl) {
      sessionStorage.setItem('isAdmin', 'true');
    } else {
      sessionStorage.removeItem('isAdmin');
    }

    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [clientIdFromUrl]);

  useEffect(() => {
    if (clients) {
      if(clientIdFromUrl){
        const foundClient = clients.find(c => c.id === clientIdFromUrl);
        setClient(foundClient || null);
      } else if (user) {
        // Find the client record that matches the logged-in user's email
        const foundClient = clients.find(c => c.email.toLowerCase() === user.email?.toLowerCase());
        setClient(foundClient || null);
      }
    }
  }, [user, clients, clientIdFromUrl]);

  useEffect(() => {
    if (client && proformas) {
      const filteredProformas = proformas.filter(p => p.clientId === client.id);
      setClientProformas(filteredProformas);
    }
  }, [client, proformas]);
  
  const portalLinkQuery = clientIdFromUrl ? `?clientId=${clientIdFromUrl}` : '';

  const getBalanceDue = (proforma: Proforma): number => {
    const amountPaid = proforma.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    return proforma.grandTotal - amountPaid;
  };
  
  const totalBalanceDue = useMemo(() => {
    return clientProformas.reduce((total, proforma) => total + getBalanceDue(proforma), 0);
  }, [clientProformas]);

  const isLoading = isLoadingClients || isLoadingProformas || (clientIdFromUrl ? false : !user);


  if (isLoading) {
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

  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader title="Client Account Not Found" />
        <p>We could not find a client account associated with the email <span className="font-semibold">{user?.email}</span>.</p>
        <p className="text-muted-foreground mt-2">Please contact your account manager for assistance.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title={`Welcome, ${client.companyName || client.name}`}
        description="View and manage your documents below."
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Balance Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalBalanceDue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all proformas</p>
          </CardContent>
        </Card>
      </div>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>Below is a list of all documents associated with your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {clientProformas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proforma #</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-center">View Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientProformas.map((proforma) => (
                  <TableRow key={proforma.id}>
                    <TableCell className="font-medium">{proforma.proformaNumber}</TableCell>
                    <TableCell>{proforma.issuedDate ? format(parseISO(proforma.issuedDate), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                    <TableCell><StatusBadge status={proforma.status} /></TableCell>
                    <TableCell className="text-right">${proforma.grandTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">${getBalanceDue(proforma).toFixed(2)}</TableCell>
                    <TableCell className="text-center space-x-1">
                       <Link href={`/client-portal/proformas/${proforma.id}${portalLinkQuery}`} passHref>
                        <Button variant="ghost" size="icon" title="View Proforma">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/client-portal/invoices/${proforma.id}${portalLinkQuery}`} passHref>
                        <Button variant="ghost" size="icon" title="View Invoice">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      {proforma.uploadedBillOfLadingUrl && (
                        <a href={proforma.uploadedBillOfLadingUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" title="View Bill of Lading">
                            <Anchor className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Link href={`/client-portal/packing-list/${proforma.id}${portalLinkQuery}`} passHref>
                        <Button variant="ghost" size="icon" title="View Packing List">
                          <Package className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground">No documents found for your account.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
