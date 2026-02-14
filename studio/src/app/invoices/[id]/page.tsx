
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Proforma, Client, InvoiceData, EditableInvoiceSpecificFields } from '@/types';
import { InvoiceDocument } from '@/components/invoice/invoice-document';
import { ArrowLeft, Printer, Edit, Save, XCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { generateInvoiceNumber } from '@/lib/number-generation';
import { useProforma, useUpdateProforma } from '@/hooks/use-proformas';
import { useClients } from '@/hooks/use-clients';

const invoiceEditSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issuedAtDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
  paymentTerms: z.string().optional(),
});
type InvoiceEditFormValues = z.infer<typeof invoiceEditSchema>;

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const proformaId = params.id as string;

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: proforma, isLoading: isLoadingProforma } = useProforma(proformaId);
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const updateProformaMutation = useUpdateProforma();

  const client = proforma ? clients?.find(c => c.id === proforma.clientId) : null;

  const form = useForm<InvoiceEditFormValues>({
    resolver: zodResolver(invoiceEditSchema),
  });

  const generateInvoiceDataFromProforma = (currentProforma: Proforma, currentClient?: Client | null): InvoiceData => {
    const foundClient = currentClient || clients?.find(c => c.id === currentProforma.clientId);

    const finalInvoiceNumber = generateInvoiceNumber(currentProforma);
    const editableFields = currentProforma.editableInvoiceSpecificFields;
    const finalIssuedDate = editableFields?.issuedAtDate || currentProforma.issuedDate;
    const finalPaymentTerms = editableFields?.paymentTerms || currentProforma.paymentTerms;

    return {
      proformaId: currentProforma.id,
      invoiceNumber: finalInvoiceNumber,
      issuedAtPlace: "Tallinn, Estonia", // This might need to be dynamic per company
      issuedAtDate: finalIssuedDate,
      company: currentProforma.company,
      soldTo: {
        name: foundClient?.companyName || currentProforma.clientName,
        addressLines: (currentProforma.clientAddress || foundClient?.address || 'N/A').split('\n'),
        taxId: currentProforma.clientTaxId || foundClient?.taxId,
      },
      shipTo: {
        name: currentProforma.shipToName || foundClient?.companyName || currentProforma.clientName,
        addressLines: (currentProforma.shipToAddress || currentProforma.clientAddress || foundClient?.address || 'N/A').split('\n'),
        taxId: currentProforma.shipToTaxId || currentProforma.clientTaxId || foundClient?.taxId,
      },
      currency: currentProforma.currency,
      items: currentProforma.items.map(item => ({
          ...item,
          description: item.description || item.productName
      })),
      salesDetail: {
        portAtOrigin: currentProforma.portAtOrigin,
        portOfArrival: currentProforma.portOfArrival,
        finalDestination: currentProforma.finalDestination,
        reference: currentProforma.reference,
        paymentTerms: finalPaymentTerms,
        vessel: currentProforma.vessel,
        containers: currentProforma.containers,
        containerNo: currentProforma.containerNo,
        proformaRefNumber: currentProforma.proformaNumber,
      },
      subTotal: currentProforma.subTotal,
      salesTax: currentProforma.taxAmount ?? 0,
      total: currentProforma.grandTotal,
      proformaNumber: currentProforma.proformaNumber,
    };
  };

  useEffect(() => {
    if (proforma) {
      const data = generateInvoiceDataFromProforma(proforma, client);
      setInvoiceData(data);
      form.reset({
        invoiceNumber: data.invoiceNumber,
        issuedAtDate: data.issuedAtDate.split('T')[0],
        paymentTerms: data.salesDetail.paymentTerms || '',
      });
    }
  }, [proforma, client, form]);

  const handlePrint = () => {
    toast({ title: "Printing Invoice...", description: "Your browser's print dialog should appear."});
    window.print();
  };

  const onEditSubmit = async (values: InvoiceEditFormValues) => {
    if (!proforma) return;

    const updatedEditableFields: EditableInvoiceSpecificFields = {
      ...proforma.editableInvoiceSpecificFields,
      invoiceNumber: values.invoiceNumber,
      issuedAtDate: values.issuedAtDate,
      paymentTerms: values.paymentTerms,
    };
    
    await updateProformaMutation.mutateAsync({ ...proforma, editableInvoiceSpecificFields: updatedEditableFields });

    toast({ title: "Invoice Updated", description: "Changes to invoice details have been saved."});
    setIsEditing(false);
  };

  const handleSendEmail = () => {
    if (!invoiceData || !client) {
      toast({
        title: "Error",
        description: "Invoice or client details not available to send email.",
        variant: "destructive",
      });
      return;
    }

    const documentUrl = `${window.location.origin}/client-portal/invoices/${proformaId}`;
    const subject = `Invoice ${invoiceData.invoiceNumber} from ${invoiceData.company}`;
    const body = `Hello ${client.name},\n\nPlease find your invoice attached or available at the link below.\n\nDocument: Invoice #${invoiceData.invoiceNumber}\nLink: ${documentUrl}\n\nThank you,\nThe ${invoiceData.company} Team`;

    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const isLoading = isLoadingProforma || isLoadingClients;

  if (isLoading) {
    return <div className="container mx-auto py-8"><div className="flex justify-center items-center h-64"><p>Loading Invoice...</p></div></div>;
  }

  if (!invoiceData || !proforma) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader title="Invoice Not Found" />
        <p>Could not generate Invoice for Proforma ID: {proformaId}.</p>
        <Link href={`/proformas/${proformaId}`} passHref>
          <Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Proforma</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title={`Invoice ${invoiceData.invoiceNumber}`}
        description={`For Proforma ${invoiceData.proformaNumber || proforma.proformaNumber}`}
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => router.push(`/proformas/${proformaId}`)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Proforma</Button>
            {!isEditing && (
                <Button onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit Invoice Details</Button>
            )}
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print / PDF</Button>
            <Button onClick={handleSendEmail} variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Send by Email
            </Button>
          </div>
        }
      />

      {isEditing && (
        <Card className="my-6 shadow-lg print:hidden">
          <CardHeader>
            <h3 className="text-lg font-semibold leading-none tracking-tight">Edit Invoice Details</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input id="invoiceNumber" {...form.register('invoiceNumber')} />
                {form.formState.errors.invoiceNumber && <p className="text-sm text-destructive mt-1">{form.formState.errors.invoiceNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="issuedAtDate">Issued Date</Label>
                <Input id="issuedAtDate" type="date" {...form.register('issuedAtDate')} />
                {form.formState.errors.issuedAtDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.issuedAtDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Textarea id="paymentTerms" {...form.register('paymentTerms')} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditing(false);
                  if (invoiceData) {
                    form.reset({
                      invoiceNumber: invoiceData.invoiceNumber,
                      issuedAtDate: invoiceData.issuedAtDate.split('T')[0],
                      paymentTerms: invoiceData.salesDetail.paymentTerms || '',
                    });
                  }
                }}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" disabled={updateProformaMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" /> {updateProformaMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="invoice-document-area">
        <InvoiceDocument data={invoiceData} />
      </div>
       <style jsx global>{`
        @page {
            size: auto;
            margin: 0;
        }
        @media print {
          body * { visibility: hidden; }
          .invoice-document-area, .invoice-document-area * { visibility: visible; }
          .invoice-document-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
}
