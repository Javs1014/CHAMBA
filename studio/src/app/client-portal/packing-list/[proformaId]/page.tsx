
'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Proforma, Client, PackingListData, PackingListContainer } from '@/types';
import { PackingListDocument } from '@/components/packing-list/packing-list-document';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateInvoiceNumber, generatePackingListName } from '@/lib/number-generation';
import { useProforma } from '@/hooks/use-proformas';
import { useClients } from '@/hooks/use-clients';
import { companyDetails } from '@/config/company-details';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

function PackingListView() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const proformaId = params.proformaId as string;

  const [packingListData, setPackingListData] = useState<PackingListData | null>(null);

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
    if(!clients) return null;
    if(clientIdFromUrl) return clients.find(c => c.id === clientIdFromUrl);
    if(user) return clients.find(c => c.email.toLowerCase() === user.email?.toLowerCase());
    return null;
  }, [clients, user, clientIdFromUrl]);
  
  const generatePackingListDataFromProforma = (currentProforma: Proforma, currentClient?: Client | null): PackingListData => {
    const foundClient = currentClient || clients?.find(c => c.id === currentProforma.clientId);
    const editableFields = currentProforma.editablePackingListSpecificFields;

    const defaultInvoiceNumber = generateInvoiceNumber(currentProforma);
    const defaultProductSummary = currentProforma.items.map(item => item.productName).join('\n');
    const defaultIssuedAtPlace = currentProforma.company === 'Successful Trade' ? "" : "Tallinn, Estonia";

    const containersData: PackingListContainer[] = currentProforma.items.map(item => {
        const netWeight = item.unitPrice * item.quantity * 0.90;
        const grossWeight = item.unitPrice * item.quantity * 0.95;
        return {
            containerNumber: currentProforma.containerNo || "TBN",
            netWeight: netWeight,
            grossWeight: grossWeight,
            items: [{ descriptionOfGoods: `${item.productName}\n${item.description || ''}`, piecesXPack: 1 }],
            totalPacks: item.quantity,
            totalPieces: item.quantity,
            totalVolumeM3: parseFloat((item.quantity * 0.05).toFixed(3)),
        }
    });
    
    const tradeEvoDetails = companyDetails['Trade Evolution'];

    return {
      packingListName: generatePackingListName(currentProforma),
      proformaId: currentProforma.id, 
      company: currentProforma.company as 'Trade Evolution' | 'Successful Trade',
      issuedAtPlace: editableFields?.issuedAtPlace || defaultIssuedAtPlace, issuedAtDate: currentProforma.issuedDate,
      billTo: { name: foundClient?.companyName || currentProforma.clientName, addressLines: (currentProforma.clientAddress || foundClient?.address || 'N/A').split('\n'), taxId: currentProforma.clientTaxId || foundClient?.taxId },
      shipTo: { name: currentProforma.shipToName || foundClient?.companyName || currentProforma.clientName, addressLines: (currentProforma.shipToAddress || currentProforma.clientAddress || foundClient?.address || 'N/A').split('\n'), taxId: currentProforma.shipToTaxId || currentProforma.clientTaxId || foundClient?.taxId },
      invoiceRef: currentProforma.editableInvoiceSpecificFields?.invoiceNumber || defaultInvoiceNumber,
      custRef: currentProforma.reference, portAtOrigin: currentProforma.portAtOrigin || 'N/A', portOfArrival: currentProforma.portOfArrival || 'N/A',
      finalDestination: currentProforma.finalDestination || 'N/A', containers: currentProforma.containers || 'N/A', piRef: currentProforma.proformaNumber,
      productSummary: editableFields?.productSummary || defaultProductSummary, packingListNotes: editableFields?.packingListNotes,
      containerItems: containersData, salesOrderNumber: currentProforma.proformaNumber, 
      companyName: tradeEvoDetails.name, companyTaxId: tradeEvoDetails.taxId, companyPhone: tradeEvoDetails.phone, companyAddress: tradeEvoDetails.address, companyWebsite: tradeEvoDetails.website,
    };
  };

  useEffect(() => {
    if (proforma && (client || clientIdFromUrl) && (proforma.clientId === client?.id || clientIdFromUrl)) {
      const data = generatePackingListDataFromProforma(proforma, client);
      setPackingListData(data);
    }
  }, [proforma, client, clientIdFromUrl, clients]);
  
  const portalLinkQuery = clientIdFromUrl ? `?clientId=${clientIdFromUrl}` : '';
  const portalLink = `/client-portal${portalLinkQuery}`;

  const handlePrint = () => {
    toast({ title: "Printing Packing List...", description: "Your browser's print dialog should appear."});
    window.print();
  };

  const handleSendEmail = () => {
    if (!packingListData || !client) {
      toast({ title: "Error", description: "Document or client details missing.", variant: "destructive" });
      return;
    }
    const subject = `Packing List ${packingListData.packingListName} from Aquarius`;
    const body = `Hello ${client.name},\n\nA new document (Packing List #${packingListData.packingListName}) is available for you to view in your client portal.\n\nYou can access all your documents here: ${window.location.origin}/client-portal\n\nThank you,\nThe Aquarius Team`;
    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };
  
  const isLoading = isLoadingProforma || isLoadingClients || isLoadingAuth;

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center"><p>Loading Packing List...</p></div>;
  }
  
  if (!proforma || !packingListData) {
      return (
          <div className="container mx-auto py-8">
              <PageHeader title="Packing List Not Found" />
              <p>This Packing List could not be loaded or you do not have permission to view it.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push(portalLink)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portal
              </Button>
          </div>
      );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title={`Packing List ${packingListData.packingListName}`}
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
      <div className="packing-list-document-area">
        <PackingListDocument data={packingListData} />
      </div>
       <style jsx global>{`
        @page {
            size: auto;
            margin: 0;
        }
        @media print {
          body * { visibility: hidden; }
          .packing-list-document-area, .packing-list-document-area * { visibility: visible; }
          .packing-list-document-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
}

export default function ClientPackingListViewPage() {
    return (
        <Suspense fallback={<div className="container mx-auto py-8 text-center"><p>Loading Packing List...</p></div>}>
            <PackingListView />
        </Suspense>
    )
}
