
'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Proforma, Client } from '@/types';
import { ProformaDocument } from '@/components/proforma/proforma-document';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProforma } from '@/hooks/use-proformas';
import { useClients } from '@/hooks/use-clients';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

function ProformaView() {
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
    if(!clients) return null;
    if(clientIdFromUrl) return clients.find(c => c.id === clientIdFromUrl);
    if(user) return clients.find(c => c.email.toLowerCase() === user.email?.toLowerCase());
    return null;
  }, [clients, user, clientIdFromUrl]);

  const handlePrint = () => {
    toast({ title: "Printing Proforma...", description: "Your browser's print dialog should appear."});
    window.print();
  };
  
  const portalLinkQuery = clientIdFromUrl ? `?clientId=${clientIdFromUrl}` : '';
  const portalLink = `/client-portal${portalLinkQuery}`;

  const handleSendEmail = () => {
    if (!proforma || !client) {
      toast({
        title: "Error",
        description: "Document or client details not available to send email.",
        variant: "destructive",
      });
      return;
    }

    const subject = `Proforma ${proforma.proformaNumber} from Aquarius`;
    const body = `Hello ${client.name},\n\nA new document (Proforma #${proforma.proformaNumber}) is available for you to view in your client portal.\n\nYou can access all your documents here: ${window.location.origin}/client-portal\n\nThank you,\nThe Aquarius Team`;
    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };
  
  const isLoading = isLoadingProforma || isLoadingClients || isLoadingAuth;
  
  if (isLoading) {
    return <div className="container mx-auto py-8 text-center"><p>Loading Proforma...</p></div>;
  }

  const isAuthorized = proforma && client && proforma.clientId === client.id;
  
  if (!proforma || !isAuthorized) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader title="Proforma Not Found" />
        <p>This proforma could not be found or you do not have permission to view it.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push(portalLink)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title={`Proforma ${proforma.proformaNumber}`}
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
      <div className="proforma-document-area">
         <ProformaDocument proforma={proforma} client={client || undefined} />
      </div>
       <style jsx global>{`
        @page {
            size: auto;
            margin: 0;
        }
        @media print {
          body * { visibility: hidden; }
          .proforma-document-area, .proforma-document-area * { visibility: visible; }
          .proforma-document-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
}


export default function ClientProformaViewPage() {
    return (
        <Suspense fallback={<div className="container mx-auto py-8 text-center"><p>Loading Proforma...</p></div>}>
            <ProformaView />
        </Suspense>
    )
}
