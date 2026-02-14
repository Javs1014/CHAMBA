
'use client'
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Proforma, Client, Payment, ProformaStatus } from '@/types';
import { StatusBadge } from '@/components/status-badge';
import { ArrowLeft, Printer, FileText as InvoiceIcon, Anchor as BillOfLadingIcon, Package as PackingListIcon, Edit, Mail, PlusCircle, Trash2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ProformaDocument } from '@/components/proforma/proforma-document';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import { useProforma, useUpdateProforma, useDeleteProforma } from '@/hooks/use-proformas';
import { useClients } from '@/hooks/use-clients';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ProformaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const proformaId = params.id as string;

  const { data: proforma, isLoading: isLoadingProforma } = useProforma(proformaId);
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const updateProformaMutation = useUpdateProforma();
  const deleteProformaMutation = useDeleteProforma();

  const [client, setClient] = useState<Client | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPaymentNotes, setNewPaymentNotes] = useState('');

  const proformaStatuses: ProformaStatus[] = ["DRAFT", "SENT", "REVIEWED", "APPROVED", "REJECTED"];

  useEffect(() => {
    if (proforma && clients) {
      const foundClient = clients.find(c => c.id === proforma.clientId);
      setClient(foundClient || null);
    }
  }, [proforma, clients]);

  const handleStatusChange = async (newStatus: ProformaStatus) => {
    if (!proforma) return;
    
    await updateProformaMutation.mutateAsync({ ...proforma, status: newStatus });
    
    toast({
      title: "Status Updated",
      description: `Proforma status changed to ${newStatus}.`,
    });
  };

  const resetPaymentForm = () => {
    setNewPaymentAmount('');
    setNewPaymentDate(new Date().toISOString().split('T')[0]);
    setNewPaymentNotes('');
    setEditingPayment(null);
  }

  const handleOpenAddDialog = () => {
    resetPaymentForm();
    setIsPaymentDialogOpen(true);
  };
  
  const handleOpenEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setNewPaymentAmount(payment.amount.toString());
    setNewPaymentDate(payment.date.split('T')[0]);
    setNewPaymentNotes(payment.notes || '');
    setIsPaymentDialogOpen(true);
  };

  const handleSavePayment = async () => {
    const amount = parseFloat(newPaymentAmount);
    if (!proforma || isNaN(amount) || amount <= 0 || !newPaymentDate) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount and date.",
        variant: "destructive",
      });
      return;
    }
    
    let updatedPayments: Payment[];

    if (editingPayment) {
      // Editing an existing payment
      updatedPayments = (proforma.payments || []).map(p => 
        p.id === editingPayment.id
          ? { ...p, amount, date: new Date(newPaymentDate).toISOString(), notes: newPaymentNotes }
          : p
      );
      toast({
        title: "Payment Updated",
        description: `Successfully updated payment.`,
      });
    } else {
      // Adding a new payment
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        amount,
        date: new Date(newPaymentDate).toISOString(),
        notes: newPaymentNotes,
      };
      updatedPayments = [...(proforma.payments || []), newPayment];
      toast({
        title: "Payment Added",
        description: `Successfully recorded payment of $${amount.toFixed(2)}.`,
      });
    }

    await updateProformaMutation.mutateAsync({ ...proforma, payments: updatedPayments });

    setIsPaymentDialogOpen(false);
    resetPaymentForm();
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!proforma) return;

    if (!window.confirm("Are you sure you want to delete this payment record?")) return;

    const updatedPayments = (proforma.payments || []).filter(p => p.id !== paymentId);
    await updateProformaMutation.mutateAsync({ ...proforma, payments: updatedPayments });

    toast({
      title: "Payment Removed",
      description: "The selected payment has been deleted.",
    });
  }

  const handleDeleteProforma = async () => {
      await deleteProformaMutation.mutateAsync(proformaId);
      toast({
          title: "Proforma Deleted",
          description: `Proforma ${proforma?.proformaNumber} has been permanently deleted.`
      });
      router.push('/proformas');
  }

  const handlePrintProforma = () => {
    toast({ title: "Printing Proforma...", description: "Your browser's print dialog should appear."});
    window.print();
  };

  const handleSendEmail = () => {
    if (!proforma || !client) {
      toast({
        title: "Error",
        description: "Proforma or client details not available to send email.",
        variant: "destructive",
      });
      return;
    }

    const documentUrl = `${window.location.origin}/client-portal/proformas/${proforma.id}`;
    const subject = `Proforma ${proforma.proformaNumber} from ${proforma.company}`;
    const body = `Hello ${client.name},\n\nPlease find your proforma invoice available at the link below.\n\nDocument: Proforma #${proforma.proformaNumber}\nLink: ${documentUrl}\n\nThank you,\nThe ${proforma.company} Team`;
    
    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const isLoading = isLoadingProforma || isLoadingClients;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading proforma details...</p>
        </div>
      </div>
    );
  }

  if (!proforma) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader title="Proforma Not Found" />
        <p>The requested proforma could not be found.</p>
        <Link href="/proformas" passHref>
          <Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Proformas</Button>
        </Link>
      </div>
    );
  }

  const amountPaid = proforma.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = proforma.grandTotal - amountPaid;

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title={`Proforma ${proforma.proformaNumber}`}
        description={
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 pl-2 pr-1 h-auto py-0.5" disabled={updateProformaMutation.isPending}>
                  <StatusBadge status={proforma.status} />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {proformaStatuses.map(status => (
                  <DropdownMenuItem
                    key={status}
                    onSelect={() => handleStatusChange(status)}
                    disabled={proforma.status === status}
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        actions={
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Link href={`/proformas/${proforma.id}/edit`} passHref>
              <Button><Edit className="mr-2 h-4 w-4" /> Edit Proforma</Button>
            </Link>
            <Button onClick={handlePrintProforma}><Printer className="mr-2 h-4 w-4" /> Print Proforma</Button>
            <Button onClick={handleSendEmail} variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Send by Email
            </Button>
            <Link href={`/invoices/${proforma.id}`} passHref>
                <Button variant="secondary"><InvoiceIcon className="mr-2 h-4 w-4" /> View Invoice</Button>
            </Link>
            <Link href={`/proformas/${proforma.id}/bill-of-lading`} passHref>
                <Button variant="secondary"><BillOfLadingIcon className="mr-2 h-4 w-4" /> View B/L</Button>
            </Link>
            <Link href={`/proformas/${proforma.id}/packing-list`} passHref>
                <Button variant="secondary"><PackingListIcon className="mr-2 h-4 w-4" /> View Packing List</Button>
            </Link>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the proforma
                        <span className="font-bold"> {proforma.proformaNumber}</span> and all associated payment data.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProforma} disabled={deleteProformaMutation.isPending}>
                        {deleteProformaMutation.isPending ? 'Deleting...' : 'Continue'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="proforma-document-area">
         <ProformaDocument proforma={proforma} client={client || undefined} />
      </div>

      <Card className="mt-6 print:hidden">
        <CardHeader>
            <CardTitle>Payments & Balance</CardTitle>
            <CardDescription>Track payments made against this proforma.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Grand Total</p>
                    <p className="text-2xl font-bold">${proforma.grandTotal.toFixed(2)}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600">${amountPaid.toFixed(2)}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Balance Due</p>
                    <p className="text-2xl font-bold text-red-600">${balanceDue.toFixed(2)}</p>
                </Card>
            </div>
            
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg">Payment History</h4>
                <Button onClick={handleOpenAddDialog}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Payment
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {proforma.payments && proforma.payments.length > 0 ? (
                    proforma.payments.map(payment => (
                        <TableRow key={payment.id}>
                        <TableCell>{format(parseISO(payment.date), 'MM/dd/yyyy')}</TableCell>
                        <TableCell>${payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{payment.notes}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(payment)} disabled={updateProformaMutation.isPending}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit Payment</span>
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(payment.id)} disabled={updateProformaMutation.isPending}>
                            <Trash2 className="h-4 w-4" />
                             <span className="sr-only">Delete Payment</span>
                           </Button>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        No payments recorded yet.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingPayment ? 'Edit Payment' : 'Add New Payment'}</DialogTitle>
                  <DialogDescription>
                      {editingPayment 
                        ? `Update the payment details for proforma ${proforma.proformaNumber}.`
                        : `Record a new payment for proforma ${proforma.proformaNumber}.`
                      }
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="paymentAmount" className="text-right">Amount ($)</Label>
                      <Input id="paymentAmount" type="number" step="any" value={newPaymentAmount} onChange={e => setNewPaymentAmount(e.target.value)} className="col-span-3"/>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="paymentDate" className="text-right">Date</Label>
                      <Input id="paymentDate" type="date" value={newPaymentDate} onChange={e => setNewPaymentDate(e.target.value)} className="col-span-3"/>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="paymentNotes" className="text-right">Notes</Label>
                      <Input id="paymentNotes" type="text" value={newPaymentNotes} onChange={e => setNewPaymentNotes(e.target.value)} placeholder="Optional" className="col-span-3"/>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSavePayment} disabled={updateProformaMutation.isPending}>
                    {updateProformaMutation.isPending ? 'Saving...' : 'Save Payment'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <style jsx global>{`
        @page {
            size: auto;
            margin: 0;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .proforma-document-area, .proforma-document-area * {
            visibility: visible;
          }
          .proforma-document-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .print\:hidden {
            display: none;
          }
          /* Hide Next.js development overlay */
          nextjs-portal {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
