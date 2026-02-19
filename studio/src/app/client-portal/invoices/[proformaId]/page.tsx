
'use client';
import { useParams, useRouter, useSearchParams, notFound } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Proforma, Client, InvoiceData } from '@/types';
import { InvoiceDocument } from '@/components/invoice/invoice-document';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateInvoiceNumber } from '@/lib/number-generation';
import { useProforma } from '@/hooks/use-proformas';
import { useClients } from '@/hooks/use-clients';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

function InvoiceView() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const proformaId = params.proformaId as string;

  const { data: proforma, isLoading: isLoadingProforma } = useProforma(proformaId);
  const { data: clients, isLoading: isLoadingClients } = useClients();

  const clientIdFromUrl = searchParams.get('clientId');
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);
  
  const client = useMemo(() => {
    if (!clients) return null;
    if (clientIdFromUrl) return clients.find(c => c.id === clientIdFromUrl);
    if (user) return clients.find(c => c.email.toLowerCase() === user.email?.toLowerCase());
    return null;
  }, [clients, user, clientIdFromUrl]);
  
  const isAuthorized = useMemo(() => {
    if (!proforma || !client) return false;
    return proforma.clientId === client.id;
  }, [proforma, client]);

  const invoiceData = useMemo((): InvoiceData | null => {
    if (!isAuthorized || !proforma || !client) return null;

    const finalInvoiceNumber = generateInvoiceNumber(proforma);
    const editableFields = proforma.editableInvoiceSpecificFields;
    const finalIssuedDate = editableFields?.issuedAtDate || proforma.issuedDate;
    const finalPaymentTerms = editableFields?.paymentTerms || proforma.paymentTerms;

    return {
      proformaId: proforma.id,
      invoiceNumber: finalInvoiceNumber,
      issuedAtPlace: proforma.company === 'Successful Trade' ? "" : "Tallinn, Estonia",
      issuedAtDate: finalIssuedDate,
      company: proforma.company as 'Trade Evolution' | 'Successful Trade',
      soldTo: {
        name: client.companyName || proforma.clientName,
        addressLines: (proforma.clientAddress || client.address || 'N/A').split('\n'),
        taxId: proforma.clientTaxId || client.taxId,
      },
      shipTo: {
        name: proforma.shipToName || client.companyName || proforma.clientName,
        addressLines: (proforma.shipToAddress || proforma.clientAddress || client.address || 'N/A').split('\n'),
        taxId: proforma.shipToTaxId || proforma.clientTaxId || client.taxId,
      },
      currency: proforma.currency,
      items: proforma.items.map(item => ({
          ...item,
          description: item.description || item.productName
      })),
      salesDetail: {
        portAtOrigin: proforma.portAtOrigin,
        portOfArrival: proforma.portOfArrival,
        finalDestination: proforma.finalDestination,
        reference: proforma.reference,
        paymentTerms: finalPaymentTerms,
        vessel: proforma.vessel,
        containers: proforma.containers,
        containerNo: proforma.containerNo,
        proformaRefNumber: proforma.proformaNumber,
      },
      subTotal: proforma.subTotal,
      salesTax: proforma.taxAmount ?? 0,
      total: proforma.grandTotal,
      proformaNumber: proforma.proformaNumber,
    };
  }, [proforma, client, isAuthorized]);

  const handlePrint = () => {
    toast({ title: "Printing Invoice...", description: "Your browser's print dialog should appear."});
    window.print();
  };

  const portalLinkQuery = clientIdFromUrl ? `?clientId=${clientIdFromUrl}` : '';
  const portalLink = `/client-portal${portalLinkQuery}`;

  const handleSendEmail = () => {
    if (!invoiceData || !client) {
      toast({ title: "Error", description: "Document or client details missing.", variant: "destructive" });
      return;
    }
    const subject = `Invoice ${invoiceData.invoiceNumber} from Aquarius`;
    const body = `Hello ${client.name},\n\nA new document (Invoice #${invoiceData.invoiceNumber}) is available for you to view in your client portal.\n\nYou can access all your documents here: ${window.location.origin}/client-portal\n\nThank you,\nThe Aquarius Team`;
    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };
  
  const isLoading = isLoadingProforma || isLoadingClients || isLoadingAuth;

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center"><p>Loading Invoice...</p></div>;
  }
  
  if (!isAuthorized || !invoiceData) {
    notFound();
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title={`Invoice ${invoiceData.invoiceNumber}`}
        description={`Associated with Proforma ${invoiceData.proformaNumber}`}
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => router.push(portalLink)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portal
            </Button>
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print / PDF</Button>
            <Button onClick={handleSendEmail} variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Email to Myself
            </Button>
          </div>
        }
      />
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


export default function ClientInvoiceViewPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 text-center"><p>Loading Invoice...</p></div>}>
      <InvoiceView />
    </Suspense>
  )
}
