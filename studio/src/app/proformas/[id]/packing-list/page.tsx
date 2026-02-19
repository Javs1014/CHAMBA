
'use client';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Proforma, Client, PackingListData, PackingListContainer, EditablePackingListSpecificFields } from '@/types';
import { PackingListDocument } from '@/components/packing-list/packing-list-document';
import { ArrowLeft, Printer, Edit, Save, XCircle, Mail, Trash2, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { generateInvoiceNumber, generatePackingListName } from '@/lib/number-generation';
import { useProforma, useUpdateProforma } from '@/hooks/use-proformas';
import { useClients } from '@/hooks/use-clients';
import { companyDetails } from '@/config/company-details';

const containerEditSchema = z.object({
  containerNumber: z.string().min(1, "Container # is required"),
  netWeight: z.number().min(0),
  grossWeight: z.number().min(0),
  totalVolumeM3: z.number().min(0),
});

const packingListEditSchema = z.object({
  issuedAtPlace: z.string().optional(),
  productSummary: z.string().optional(),
  packingListNotes: z.string().optional(),
  editedContainers: z.array(containerEditSchema).optional(),
});

type PackingListEditFormValues = z.infer<typeof packingListEditSchema>;

export default function PackingListPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const proformaId = params.id as string;

  const [packingListData, setPackingListData] = useState<PackingListData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: proforma, isLoading: isLoadingProforma } = useProforma(proformaId);
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const updateProformaMutation = useUpdateProforma();

  const client = proforma ? clients?.find(c => c.id === proforma.clientId) : null;

  const form = useForm<PackingListEditFormValues>({
    resolver: zodResolver(packingListEditSchema),
    defaultValues: {
      editedContainers: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "editedContainers",
  });


  const generatePackingListDataFromProforma = (currentProforma: Proforma, currentClient?: Client | null): PackingListData => {
    const foundClient = currentClient || clients?.find(c => c.id === currentProforma.clientId);
    const editableFields = currentProforma.editablePackingListSpecificFields;

    const defaultInvoiceNumber = generateInvoiceNumber(currentProforma);
    const defaultProductSummary = currentProforma.items.map(item => item.productName).join('\n');
    const defaultIssuedAtPlace = currentProforma.company === 'Successful Trade' ? "" : "Tallinn, Estonia";

    let containersData: PackingListContainer[];


    const combinedDescription = currentProforma.items
      .map(item => `${item.productName}${item.description ? '\n' + item.description : ''}`)
      .join('\n\n'); // Unir descripciones con saltos de línea
    const totalQuantity = currentProforma.items.reduce((sum, item) => sum + item.quantity, 0);

    if(editableFields?.editedContainers && editableFields.editedContainers.length > 0){
        containersData = editableFields.editedContainers.map(ec => {
            const correspondingItem = currentProforma.items[0] || { productName: '', description: '', quantity: 0 };
            return {
                ...ec,
                items: [{ descriptionOfGoods: `${correspondingItem.productName}\n${correspondingItem.description || ''}`, piecesXPack: 1 }],
                totalPacks: correspondingItem.quantity,
                totalPieces: correspondingItem.quantity,
            };
        });
    } else {
        containersData = currentProforma.items.map(item => {
            const netWeight = item.unitPrice * item.quantity * 0.90;
            const grossWeight = item.unitPrice * item.quantity * 0.95;
            return {
                containerNumber: currentProforma.containerNo || "TBN",
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

    let rawInvoiceNumber = currentProforma.editableInvoiceSpecificFields?.invoiceNumber || defaultInvoiceNumber;
    if (currentProforma.proformaNumber && rawInvoiceNumber.includes(currentProforma.proformaNumber)) {
        const soIndex = rawInvoiceNumber.indexOf(currentProforma.proformaNumber);
        rawInvoiceNumber = rawInvoiceNumber.substring(0, soIndex).replace(/[-\/\s]+$/, '').trim();
    }


    return {
      packingListName: generatePackingListName(currentProforma),
      proformaId: currentProforma.id,
      company: currentProforma.company as 'Trade Evolution' | 'Successful Trade',
      issuedAtPlace: editableFields?.issuedAtPlace || defaultIssuedAtPlace,
      issuedAtDate: currentProforma.issuedDate,
      billTo: {
        name: foundClient?.companyName || currentProforma.clientName,
        addressLines: (currentProforma.clientAddress || foundClient?.address || 'N/A').split('\n'),
        taxId: currentProforma.clientTaxId || foundClient?.taxId,
      },
      shipTo: {
         name: currentProforma.shipToName || foundClient?.companyName || currentProforma.clientName,
         addressLines: (currentProforma.shipToAddress || currentProforma.clientAddress || foundClient?.address || 'N/A').split('\n'),
         taxId: currentProforma.shipToTaxId || currentProforma.clientTaxId || foundClient?.taxId,
      },
      invoiceRef: currentProforma.editableInvoiceSpecificFields?.invoiceNumber || defaultInvoiceNumber,
      custRef: currentProforma.reference,
      portAtOrigin: currentProforma.portAtOrigin || 'N/A',
      portOfArrival: currentProforma.portOfArrival || 'N/A',
      finalDestination: currentProforma.finalDestination || 'N/A',
      containers: currentProforma.containers || 'N/A',
      piRef: currentProforma.proformaNumber,
      productSummary: editableFields?.productSummary || defaultProductSummary,
      packingListNotes: editableFields?.packingListNotes,
      containerItems: containersData,
      salesOrderNumber: currentProforma.proformaNumber,
      companyName: tradeEvoDetails.name,
      companyTaxId: tradeEvoDetails.taxId,
      companyPhone: tradeEvoDetails.phone,
      companyAddress: tradeEvoDetails.address,
      companyWebsite: tradeEvoDetails.website,
    };
  };

  useEffect(() => {
    if (proforma) {
      const data = generatePackingListDataFromProforma(proforma, client);
      setPackingListData(data);
      form.reset({
        issuedAtPlace: data.issuedAtPlace,
        productSummary: data.productSummary,
        packingListNotes: data.packingListNotes || '',
        editedContainers: data.containerItems.map(ci => ({
            containerNumber: ci.containerNumber,
            netWeight: ci.netWeight,
            grossWeight: ci.grossWeight,
            totalVolumeM3: ci.totalVolumeM3 || 0,
        })),
      });
    }
  }, [proforma, client, form]);

  const handlePrint = () => {
    toast({ title: "Printing Packing List...", description: "Your browser's print dialog should appear."});
    window.print();
  };

  const onEditSubmit = async (values: PackingListEditFormValues) => {
    if (!proforma) return;

    const updatedEditableFields: EditablePackingListSpecificFields = {
      ...proforma.editablePackingListSpecificFields,
      ...values,
    };
    
    await updateProformaMutation.mutateAsync({ ...proforma, editablePackingListSpecificFields: updatedEditableFields });

    toast({ title: "Packing List Updated", description: "Changes to Packing List details have been saved."});
    setIsEditing(false);
  };

  const handleSendEmail = () => {
    if (!packingListData || !client) {
      toast({
        title: "Error",
        description: "Packing List or client details not available to send email.",
        variant: "destructive",
      });
      return;
    }

    const documentUrl = `${window.location.origin}/client-portal/packing-list/${proformaId}`;
    const subject = `Packing List ${packingListData.packingListName} from ${packingListData.company}`;
    const body = `Hello ${client.name},\n\nPlease find your Packing List available at the link below.\n\nDocument: Packing List #${packingListData.packingListName}\nLink: ${documentUrl}\n\nThank you,\nThe ${packingListData.company} Team`;

    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };
  
  const isLoading = isLoadingProforma || isLoadingClients;

  if (isLoading) {
    return <div className="container mx-auto py-8"><div className="flex justify-center items-center h-64"><p>Loading Packing List...</p></div></div>;
  }

  if (!proforma) {
    notFound();
  }

  // Regenerate packingListData with the confirmed valid proforma
  const finalPackingListData = generatePackingListDataFromProforma(proforma, client);

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title={`Packing List ${finalPackingListData.packingListName}`}
        description="Review, edit, and print the Packing List."
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => router.push(`/proformas/${proformaId}`)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Proforma</Button>
            {!isEditing && (
                <Button onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit Packing List</Button>
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
            <CardTitle>Edit Packing List Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="issuedAtPlace">Issued At Place</Label>
                  <Input id="issuedAtPlace" {...form.register('issuedAtPlace')} />
                </div>
                <div>
                  <Label htmlFor="productSummary">Product Summary</Label>
                  <Textarea id="productSummary" {...form.register('productSummary')} rows={3} />
                </div>
                <div>
                  <Label htmlFor="packingListNotes">Packing List Specific Notes</Label>
                  <Textarea id="packingListNotes" {...form.register('packingListNotes')} rows={3} />
                </div>
              </div>

              {/* AQUÍ ESTÁ LA SECCIÓN DE EDICIÓN DE CONTENEDORES CORREGIDA */}
              <div className="space-y-4">
                <CardTitle>Container Details</CardTitle>
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 bg-slate-50 border-slate-200">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <div>
                          <Label>Container #{index + 1}</Label>
                          <Input {...form.register(`editedContainers.${index}.containerNumber`)} placeholder="Container Number" />
                       </div>
                        <div>
                          <Label>Net Weight (kg)</Label>
                          <Input type="number" step="any" {...form.register(`editedContainers.${index}.netWeight`, { valueAsNumber: true })} />
                        </div>
                        <div>
                          <Label>Gross Weight (kg)</Label>
                          <Input type="number" step="any" {...form.register(`editedContainers.${index}.grossWeight`, { valueAsNumber: true })} />
                        </div>
                        <div>
                          <Label>Volume (m3)</Label>
                          <Input type="number" step="any" {...form.register(`editedContainers.${index}.totalVolumeM3`, { valueAsNumber: true })} />
                        </div>
                     </div>
                     <Button type="button" variant="destructive" size="sm" className="mt-4" onClick={() => remove(index)}>
                        <Trash2 className="mr-2 h-4 w-4"/> Remove Container
                      </Button>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ containerNumber: '', netWeight: 0, grossWeight: 0, totalVolumeM3: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Container
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
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
      <div className="packing-list-document-area">
        <PackingListDocument data={finalPackingListData} />
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
