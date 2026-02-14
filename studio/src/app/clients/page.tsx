
'use client'
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Client, Proforma } from '@/types';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';
import { PlusCircle, ArrowUpRight, Mail, Building, ExternalLink, DollarSign, Pencil, Edit, FileText, HandCoins } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useClients, useUpdateClientBalance } from '@/hooks/use-clients';
import { useProformas } from '@/hooks/use-proformas';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');

  const { toast } = useToast();
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const { data: proformas, isLoading: isLoadingProformas } = useProformas();
  const updateBalanceMutation = useUpdateClientBalance();

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchTerm) return clients;
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.companyName && client.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, clients]);

  const getClientProformas = (clientId: string): Proforma[] => {
    if (!proformas) return [];
    return proformas.filter(p => p.clientId === clientId);
  };
  
  const getClientFinancials = (clientId: string) => {
    const clientProformas = getClientProformas(clientId);
    const totalBilled = clientProformas.reduce((sum, p) => sum + p.grandTotal, 0);
    const totalPaid = clientProformas.reduce((sum, p) => sum + (p.payments?.reduce((pSum, payment) => pSum + payment.amount, 0) || 0), 0);
    return { totalBilled, totalPaid };
  }

  const handleOpenEditBalance = (client: Client) => {
    setEditingClient(client);
    setNewBalance(client.balance?.toString() ?? '0');
    setIsEditBalanceOpen(true);
  };

  const handleSaveBalance = async () => {
    if (!editingClient) return;

    try {
      await updateBalanceMutation.mutateAsync({
        clientId: editingClient.id,
        balance: parseFloat(newBalance) || 0,
      });
      toast({ title: 'Balance Updated', description: `Balance for ${editingClient.companyName} has been saved.` });
      setIsEditBalanceOpen(false);
      setEditingClient(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update balance.', variant: 'destructive' });
    }
  };

  const handleViewClientPortal = () => {
    sessionStorage.setItem('isAdmin', 'true');
  };

  const isLoading = isLoadingClients || isLoadingProformas;

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage your clients and view their proformas."
        actions={
          <Link href="/clients/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Client
            </Button>
          </Link>
        }
      />
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
           <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="space-y-6">
          {filteredClients.map((client: Client) => {
            const { totalBilled, totalPaid } = getClientFinancials(client.id);
            return (
                <Card key={client.id} className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                    <div>
                        <CardTitle className="text-2xl text-primary flex items-center gap-2">
                        {client.companyName || client.name}
                        <Link href={`/clients/${client.id}/edit`} passHref>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                            <Edit size={16} />
                            <span className="sr-only">Edit Client</span>
                            </Button>
                        </Link>
                        </CardTitle>
                        <CardDescription>{client.name}</CardDescription>
                    </div>
                    <Link href={`/client-portal?clientId=${client.id}`} passHref>
                        <Button variant="outline" size="sm" className="mt-2 sm:mt-0" onClick={handleViewClientPortal}>
                            <ExternalLink className="mr-2 h-4 w-4" /> View Client Portal
                        </Button>
                    </Link>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"> <Mail size={16}/> {client.email}</div>
                        {client.address && <div className="flex items-center gap-2"><Building size={16}/> {client.address.split(',')[0]}</div>}
                        <div className="flex items-center gap-2">
                            <FileText size={16} />
                            <span>Total Billed: ${totalBilled.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <HandCoins size={16} />
                            <span>Total Paid: ${totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 pt-1 col-span-full md:col-span-1">
                            <DollarSign size={16} />
                            <span>Manual Balance: ${client.balance?.toFixed(2) ?? '0.00'}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenEditBalance(client)}>
                            <Pencil size={14} />
                            <span className="sr-only">Edit Balance</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Recent Proformas</h3>
                    {getClientProformas(client.id).length > 0 ? (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Proforma #</TableHead>
                            <TableHead>Issued Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {getClientProformas(client.id).slice(0,3).map((proforma) => (
                            <TableRow key={proforma.id}>
                            <TableCell className="font-medium">{proforma.proformaNumber}</TableCell>
                            <TableCell>{proforma.issuedDate ? format(parseISO(proforma.issuedDate), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                            <TableCell><StatusBadge status={proforma.status} /></TableCell>
                            <TableCell className="text-right">${proforma.grandTotal.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                <Link href={`/proformas/${proforma.id}`} passHref>
                                <Button variant="outline" size="sm">
                                    View <ArrowUpRight className="ml-1 h-4 w-4" />
                                </Button>
                                </Link>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    ) : (
                    <p className="text-muted-foreground">No proformas found for this client.</p>
                    )}
                </CardContent>
                </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No clients found. Have you run the seed script?</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditBalanceOpen} onOpenChange={setIsEditBalanceOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Balance for {editingClient?.companyName}</DialogTitle>
            <DialogDescription>
              Update the client's account balance. This is a manual override.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">Balance ($)</Label>
              <Input
                id="balance"
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditBalanceOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSaveBalance} disabled={updateBalanceMutation.isPending}>
              {updateBalanceMutation.isPending ? 'Saving...' : 'Save Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
