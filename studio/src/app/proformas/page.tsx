
'use client'
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProformas } from '@/hooks/use-proformas';
import { useClients } from '@/hooks/use-clients';
import type { Proforma, ProformaStatus } from '@/types';
import { StatusBadge } from '@/components/status-badge';
import { PlusCircle, ArrowUpRight, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProformasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProformaStatus | 'ALL'>('ALL');
  const [clientFilter, setClientFilter] = useState<string | 'ALL'>('ALL');

  const { data: proformas, isLoading: isLoadingProformas } = useProformas();
  const { data: clients, isLoading: isLoadingClients } = useClients();

  const filteredProformas = useMemo(() => {
    if (!proformas) return [];
    return proformas.filter(proforma => {
      const matchesSearch = searchTerm === '' ||
        proforma.proformaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proforma.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || proforma.status === statusFilter;
      const matchesClient = clientFilter === 'ALL' || proforma.clientId === clientFilter;
      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [searchTerm, statusFilter, clientFilter, proformas]);

  const proformaStatuses: ProformaStatus[] = ["DRAFT", "SENT", "REVIEWED", "APPROVED", "REJECTED"];
  const isLoading = isLoadingProformas || isLoadingClients;

  return (
    <div>
      <PageHeader
        title="Proformas"
        description="View and manage all your proformas."
        actions={
          <Link href="/proformas/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Proforma
            </Button>
          </Link>
        }
      />
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter size={20}/> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="text"
            placeholder="Search by number or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProformaStatus | 'ALL')}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {proformaStatuses.map(status => (
                <SelectItem key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={(value) => setClientFilter(value as string | 'ALL')} disabled={isLoadingClients}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Clients</SelectItem>
              {clients?.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredProformas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proforma #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProformas.map((proforma) => (
                  <TableRow key={proforma.id}>
                    <TableCell className="font-medium">{proforma.proformaNumber}</TableCell>
                    <TableCell>{proforma.clientName}</TableCell>
                    <TableCell>{proforma.issuedDate ? format(parseISO(proforma.issuedDate), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                    <TableCell><StatusBadge status={proforma.status} /></TableCell>
                    <TableCell className="text-right">${proforma.grandTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/proformas/${proforma.id}`} passHref>
                        <Button variant="outline" size="sm">
                          View / Edit <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground">No proformas found matching your criteria.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
