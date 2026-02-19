
'use client';
import { useParams, useRouter, useSearchParams, notFound } from 'next/navigation';
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

  const packingListData = useMemo((): PackingListData | null => {
    if (!isAuthorized || !proforma || !client) return null;

    const editableFields = proforma.editablePackingListSpecificFields;
    const defaultInvoiceNumber = generateInvoiceNumber(proforma);
    const defaultProductSummary = proforma.items.map(item => item.productName).join('\n');
    const defaultIssuedAtPlace = proforma.company === 'Successful Trade' ? "" : "Tallinn, Estonia";

    let containersData: PackingListContainer[];

    const combinedDescription = proforma.items
      .map(item => `${item.productName}${item.description ? '\n' + item.description : ''}`)
      .join('\n\n');
    const totalQuantity = proforma.items.reduce((sum, item) => sum + item.quantity, 0);



    if (editableFields?.editedContainers && editableFields.editedContainers.length > 0) {
      containersData = editableFields.editedContainers.map(ec => {
        const correspondingItem = proforma.items[0] || { productName: '', description: '', quantity: 0 };
        return {
          ...ec,
          items: [{ descriptionOfGoods: `${correspondingItem.productName}\n${correspondingItem.description || ''}`, piecesXPack: 1 }],
          totalPacks: correspondingItem.quantity,
          totalPieces: correspondingItem.quantity,
        };
      });
    } else {
      containersData = proforma.items.map(item => {
        const netWeight = item.unitPrice * item.quantity * 0.90;
        const grossWeight = item.unitPrice * item.quantity * 0.95;
        return {
          containerNumber: proforma.containerNo || "TBN",
          netWeight: netWeight,
          grossWeight: grossWeight,
          items: [{ descriptionOfGoods: `${item.productName}\n${item.description || ''}`, piecesXPack: 1 }],
          totalPacks: item.quantity,
          totalPieces: item.quantity,
          totalVolumeM3: parseFloat((item.quantity * 0.05).toFixed(3)), // Example calculation
        }
      });
    }

    const tradeEvoDetails = companyDetails['Trade Evolution'];

    let rawInvoiceNumber = editableFields?.invoiceNumber || defaultInvoiceNumber;
    if (proforma.proformaNumber && rawInvoiceNumber.includes(proforma.proformaNumber)) {
        const soIndex = rawInvoiceNumber.indexOf(proforma.proformaNumber);
        rawInvoiceNumber = rawInvoiceNumber.substring(0, soIndex).replace(/[-\/\s]+$/, '').trim();
    }



    return {
      packingListName: generatePackingListName(proforma),
      proformaId: proforma.id,
      company: proforma.company as 'Trade Evolution' | 'Successful Trade',
      issuedAtPlace: editableFields?.issuedAtPlace || defaultIssuedAtPlace,
      issuedAtDate: proforma.issuedDate,
      billTo: { name: client.companyName || proforma.clientName, addressLines: (proforma.clientAddress || client.address || 'N/A').split('\n'), taxId: proforma.clientTaxId || client.taxId },
      shipTo: { name: proforma.shipToName || client.companyName || proforma.clientName, addressLines: (proforma.shipToAddress || proforma.clientAddress || client.address || 'N/A').split('\n'), taxId: proforma.shipToTaxId || proforma.clientTaxId || client.taxId },
      invoiceRef: proforma.editableInvoiceSpecificFields?.invoiceNumber || defaultInvoiceNumber,
      custRef: proforma.reference, portAtOrigin: proforma.portAtOrigin || 'N/A', portOfArrival: proforma.portOfArrival || 'N/A',
      finalDestination: proforma.finalDestination || 'N/A', containers: proforma.containers || 'N/A', piRef: proforma.proformaNumber,
      productSummary: editableFields?.productSummary || defaultProductSummary, packingListNotes: editableFields?.packingListNotes,
      containerItems: containersData, salesOrderNumber: proforma.proformaNumber,
      companyName: tradeEvoDetails.name, companyTaxId: tradeEvoDetails.taxId, companyPhone: tradeEvoDetails.phone, companyAddress: tradeEvoDetails.address, companyWebsite: tradeEvoDetails.website,
    };
  }, [proforma, client, isAuthorized]);

  const portalLinkQuery = clientIdFromUrl ? `?clientId=${clientIdFromUrl}` : '';
  const portalLink = `/client-portal${portalLinkQuery}`;

  const handlePrint = () => {
    toast({ title: "Printing Packing List...", description: "Your browser's print dialog should appear." });
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

  if (!isAuthorized || !packingListData) {
    notFound();
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
