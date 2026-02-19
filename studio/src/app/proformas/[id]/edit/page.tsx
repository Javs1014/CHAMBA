'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts } from '@/hooks/use-products';
import { useClients } from '@/hooks/use-clients';
import { useProforma, useUpdateProforma } from '@/hooks/use-proformas';
import type { ProformaItem, Product, Proforma } from '@/types';
import { PlusCircle, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { portOptions } from '@/config/ports';
import { Combobox } from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';

const proformaItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"), 
  productName: z.string(),
  description: z.string().optional(),
  unit: z.string(),
  totalPrice: z.number(),
});

const proformaFormSchema = z.object({
  company: z.enum(['Trade Evolution', 'Successful Trade']),
  clientId: z.string().min(1, "Client is required"),
  issuedDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date" }),
  expiryDate: z.string().optional(),
  proformaNumber: z.string().min(1, "Proforma number is required"),
  
  clientAddress: z.string().optional(),
  clientTaxId: z.string().optional(),
  shipToName: z.string().optional(),
  shipToAddress: z.string().optional(),
  shipToTaxId: z.string().optional(),
  shipToClientId: z.string().optional(),

  currency: z.string().min(1, "Currency is required").default("USD DOLLAR"),
  
  portAtOrigin: z.string().optional(),
  portOfArrival: z.string().optional(),
  finalDestination: z.string().optional(),
  reference: z.string().optional(),
  paymentTerms: z.string().optional(),
  delivery: z.string().optional(),
  vessel: z.string().optional(),
  containers: z.string().optional(),
  containerNo: z.string().optional(),

  items: z.array(proformaItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional().default(0),
  customerSignatoryName: z.string().optional(),
});

type ProformaFormValues = z.infer<typeof proformaFormSchema>;

export default function EditProformaPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const proformaId = params.id as string;

  const { data: proformaToEdit, isLoading: isLoadingProforma } = useProforma(proformaId);
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const updateProformaMutation = useUpdateProforma();

  const [selectedProductToAdd, setSelectedProductToAdd] = useState<Product | null>(null);
  
  const form = useForm<ProformaFormValues>({
    resolver: zodResolver(proformaFormSchema),
    defaultValues: {
        items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedClientId = form.watch('clientId');
  const watchedCompany = form.watch('company');
  const watchedShipToClientId = form.watch('shipToClientId');

  useEffect(() => {
    if (proformaToEdit && clients) {
        const formValues: ProformaFormValues = {
            ...proformaToEdit,
            company: proformaToEdit.company,
            clientId: proformaToEdit.clientId,
            issuedDate: proformaToEdit.issuedDate.split('T')[0],
            expiryDate: proformaToEdit.expiryDate?.split('T')[0] || '',
            proformaNumber: proformaToEdit.proformaNumber,
            clientAddress: proformaToEdit.clientAddress || '',
            clientTaxId: proformaToEdit.clientTaxId || '',
            shipToName: proformaToEdit.shipToName || '',
            shipToAddress: proformaToEdit.shipToAddress || '',
            shipToTaxId: proformaToEdit.shipToTaxId || '',
            shipToClientId: proformaToEdit.shipToClientId || proformaToEdit.clientId,
            currency: proformaToEdit.currency,
            portAtOrigin: proformaToEdit.portAtOrigin || '',
            portOfArrival: proformaToEdit.portOfArrival || '',
            finalDestination: proformaToEdit.finalDestination || '',
            reference: proformaToEdit.reference || '',
            paymentTerms: proformaToEdit.paymentTerms || '',
            delivery: proformaToEdit.delivery || '',
            vessel: proformaToEdit.vessel || '',
            containers: proformaToEdit.containers || '',
            containerNo: proformaToEdit.containerNo || '',
            items: proformaToEdit.items.map(item => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
            notes: proformaToEdit.notes || '',
            taxRate: proformaToEdit.subTotal > 0 && proformaToEdit.taxAmount ? proformaToEdit.taxAmount / proformaToEdit.subTotal : 0,
            customerSignatoryName: proformaToEdit.customerSignatoryName || '',
        };
        form.reset(formValues);
    }
}, [proformaToEdit, clients, form]);

  const watchedItems = form.watch('items') || [];
  const watchedTaxRate = form.watch('taxRate') || 0;

  const subTotal = watchedItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0);
  const taxAmount = subTotal * watchedTaxRate;
  const grandTotal = subTotal + taxAmount;

   // Lógica para actualizar dirección SOLO si cambia el cliente manualmente
   // Evita sobrescribir datos al cargar la página si ya existen
   useEffect(() => {
    if (watchedClientId && clients) { 
      // Solo actualizamos si el formulario ya ha sido inicializado y el usuario cambia el cliente
      if (form.formState.isDirty) {
          const client = clients.find(c => c.id === watchedClientId);
          if (client) {
            form.setValue('clientAddress', client.address || '');
            form.setValue('clientTaxId', client.taxId || '');
            form.setValue('customerSignatoryName', client.companyName || client.name);
            
            // Auto set ShipTo if not set or same as client
            const currentShipTo = form.getValues('shipToClientId');
            if(!currentShipTo || currentShipTo === watchedClientId) {
                form.setValue('shipToClientId', client.id);
                form.setValue('shipToName', client.companyName || client.name);
                form.setValue('shipToAddress', client.address || '');
                form.setValue('shipToTaxId', client.taxId || '');
            }
          }
      }
    }
  }, [form, watchedClientId, clients]);

  useEffect(() => {
    if(watchedShipToClientId && clients && form.formState.isDirty) {
        const client = clients.find(c => c.id === watchedShipToClientId);
        if (client) {
            form.setValue('shipToName', client.companyName || client.name);
            form.setValue('shipToAddress', client.address || '');
            form.setValue('shipToTaxId', client.taxId || '');
        }
    }
  }, [form, watchedShipToClientId, clients]);


  const onSubmit = async (data: ProformaFormValues) => {
    if (!proformaToEdit) {
        toast({ title: "Error", description: "Original proforma not found.", variant: "destructive" });
        return;
    }

    const client = clients?.find(c => c.id === data.clientId);
    
    const finalSubTotal = data.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0);
    const finalTaxAmount = finalSubTotal * (data.taxRate || 0);
    const finalGrandTotal = finalSubTotal + finalTaxAmount;

    const updatedProforma: Proforma = {
      ...proformaToEdit,
      ...data,
      clientName: client?.companyName || client?.name || proformaToEdit.clientName, // Fallback to existing name
      subTotal: finalSubTotal,
      taxAmount: finalTaxAmount,
      grandTotal: finalGrandTotal,
      updatedAt: new Date().toISOString(),
    };
    
    await updateProformaMutation.mutateAsync(updatedProforma);
    
    toast({
      title: "Proforma Updated",
      description: `Proforma ${data.proformaNumber} has been successfully updated.`,
    });
    router.push(`/proformas/${proformaId}`);
  };

  const handleAddProductItem = () => {
    if (selectedProductToAdd) {
      const quantity = 1;
      const unitPrice = selectedProductToAdd.price;
      append({
        productId: selectedProductToAdd.id,
        productName: selectedProductToAdd.name,
        quantity: quantity,
        unitPrice: unitPrice,
        unit: selectedProductToAdd.unit,
        description: selectedProductToAdd.description,
        totalPrice: quantity * unitPrice,
      });
      setSelectedProductToAdd(null); 
    }
  };
  
  const handleItemValueChange = (index: number) => {
    const items = form.getValues('items');
    const item = items[index];
    if (item) {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      items[index] = {
        ...item,
        totalPrice: isNaN(quantity) || isNaN(unitPrice) ? 0 : quantity * unitPrice,
      };
      replace(items);
    }
  };

  const isLoading = isLoadingProforma || isLoadingClients || isLoadingProducts;

  if (isLoading) {
    return (
       <div>
        <PageHeader title="Loading Proforma..." />
        <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  // CORRECCIÓN CLIENTES: Filtramos, pero si la lista está vacía o el cliente actual no está, NO bloqueamos el select.
  const availableClients = clients?.filter(c => c.company === watchedCompany || c.company === 'Both') || [];

  return (
    <div>
      <PageHeader 
        title={`Edit Proforma ${form.getValues('proformaNumber') || ''}`} 
        description="Modify the details of the proforma."
        actions={
            <Link href={`/proformas/${proformaId}`} passHref>
                <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Proforma</Button>
            </Link>
        }
      />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Company</Label>
               <Controller
                name="company"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} >
                    <SelectTrigger id="company">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trade Evolution">Trade Evolution</SelectItem>
                      <SelectItem value="Successful Trade">Successful Trade</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="proformaNumber">Proforma Number</Label>
              <Input id="proformaNumber" {...form.register('proformaNumber')} />
              {form.formState.errors.proformaNumber && <p className="text-sm text-destructive mt-1">{form.formState.errors.proformaNumber.message}</p>}
            </div>
            <div>
              <Label htmlFor="issuedDate">Issued Date</Label>
              <Input id="issuedDate" type="date" {...form.register('issuedDate')} />
              {form.formState.errors.issuedDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.issuedDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input id="expiryDate" type="date" {...form.register('expiryDate')} />
            </div>
             <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" {...form.register('currency')} />
              {form.formState.errors.currency && <p className="text-sm text-destructive mt-1">{form.formState.errors.currency.message}</p>}
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate (e.g., 0.05 for 5%)</Label>
              <Input id="taxRate" type="number" step="0.01" {...form.register('taxRate', { valueAsNumber: true })} />
               {form.formState.errors.taxRate && <p className="text-sm text-destructive mt-1">{form.formState.errors.taxRate.message}</p>}
            </div>
             <div>
              <Label htmlFor="reference">Reference (e.g. PO Number)</Label>
              <Input id="reference" {...form.register('reference')} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader><CardTitle>Client Details (Sold To)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="clientId">Client</Label>
              <Controller
                name="clientId"
                control={form.control}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    // CORRECCIÓN: Eliminado disabled={availableClients.length === 0} para evitar bloqueo
                  >
                    <SelectTrigger id="clientId">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClients.length > 0 ? (
                          availableClients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.companyName} ({client.name})</SelectItem>
                          ))
                      ) : (
                          <SelectItem value="loading" disabled>No clients found for this company</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.clientId && <p className="text-sm text-destructive mt-1">{form.formState.errors.clientId.message}</p>}
            </div>
             <div>
              <Label htmlFor="clientTaxId">Client Tax ID</Label>
              <Input id="clientTaxId" {...form.register('clientTaxId')} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="clientAddress">Client Address</Label>
              <Textarea id="clientAddress" {...form.register('clientAddress')} placeholder="Client full address"/>
            </div>
             <div className="md:col-span-2">
                <Label htmlFor="customerSignatoryName">Customer Signatory Name (for document footer)</Label>
                <Input id="customerSignatoryName" {...form.register('customerSignatoryName')} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Shipping Details (Ship To)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="shipToClientId">Ship To Client (if different)</Label>
              <Controller
                name="shipToClientId"
                control={form.control}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    // CORRECCIÓN: Eliminado disabled para evitar bloqueo
                  >
                    <SelectTrigger id="shipToClientId">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName} ({client.name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="shipToName">Ship To Name</Label>
              <Input id="shipToName" {...form.register('shipToName')} />
            </div>
            <div>
              <Label htmlFor="shipToTaxId">Ship To Tax ID</Label>
              <Input id="shipToTaxId" {...form.register('shipToTaxId')} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="shipToAddress">Ship To Address</Label>
              <Textarea id="shipToAddress" {...form.register('shipToAddress')} placeholder="Shipping full address"/>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader><CardTitle>Sales &amp; Delivery Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* CORRECCIÓN: Uso de Combobox para Puertos */}
             <div>
              <Label htmlFor="portAtOrigin">Port at Origin</Label>
              <Controller
                name="portAtOrigin"
                control={form.control}
                render={({ field }) => (
                  <Combobox
                    options={portOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select or type a port..."
                  />
                )}
              />
            </div>
            <div>
              <Label htmlFor="portOfArrival">Port of Arrival</Label>
              <Controller
                name="portOfArrival"
                control={form.control}
                render={({ field }) => (
                  <Combobox
                    options={portOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select or type a port..."
                  />
                )}
              />
            </div>
            <div>
              <Label htmlFor="finalDestination">Final Destination</Label>
              <Controller
                name="finalDestination"
                control={form.control}
                render={({ field }) => (
                  <Combobox
                    options={portOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select or type a destination..."
                  />
                )}
              />
            </div>
            <div><Label htmlFor="vessel">Vessel</Label><Input id="vessel" {...form.register('vessel')} /></div>
            <div><Label htmlFor="containers">Containers</Label><Input id="containers" {...form.register('containers')} /></div>
            <div><Label htmlFor="containerNo">Container No.</Label><Input id="containerNo" {...form.register('containerNo')} /></div>
            <div className="md:col-span-2"><Label htmlFor="paymentTerms">Payment Terms</Label><Textarea id="paymentTerms" {...form.register('paymentTerms')} /></div>
            <div className="md:col-span-2"><Label htmlFor="delivery">Delivery Details</Label><Textarea id="delivery" {...form.register('delivery')} /></div>
          </CardContent>
        </Card>

        {/* ... (El resto del formulario de productos se mantiene igual) ... */}
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Proforma Items</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 mb-4">
              <div className="flex-grow">
                <Label htmlFor="productToAdd">Select Product to Add</Label>
                 <Select onValueChange={(productId) => setSelectedProductToAdd(products?.find(p => p.id === productId) || null)}>
                  <SelectTrigger id="productToAdd">
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map(product => (
                      <SelectItem key={product.id} value={product.id}>{product.name} (${product.price.toFixed(2)}) - Unit: {product.unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" onClick={handleAddProductItem} disabled={!selectedProductToAdd}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
            {form.formState.errors.items && typeof form.formState.errors.items === 'object' && !Array.isArray(form.formState.errors.items) && <p className="text-sm text-destructive mb-2">{form.formState.errors.items.message}</p>}
            
            {fields.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Product</TableHead>
                    <TableHead className="w-[30%]">Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const item = watchedItems[index]; 
                    if (!item) return null; 
                    return (
                      <TableRow key={field.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>
                            <Textarea 
                                {...form.register(`items.${index}.description`)} 
                                rows={2}
                                placeholder="Item specific description"
                            />
                        </TableCell>
                        <TableCell>
                           <Input
                                type="number"
                                step="any"
                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                                onBlur={() => handleItemValueChange(index)}
                                className="w-24"
                            />
                           {form.formState.errors.items?.[index]?.quantity && <p className="text-sm text-destructive mt-1">{form.formState.errors.items?.[index]?.quantity?.message}</p>}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                           <Input
                                type="number"
                                step="any"
                                {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                onBlur={() => handleItemValueChange(index)}
                                className="w-24"
                            />
                           {form.formState.errors.items?.[index]?.unitPrice && <p className="text-sm text-destructive mt-1">{form.formState.errors.items?.[index]?.unitPrice?.message}</p>}
                        </TableCell>
                        <TableCell>${(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader><CardTitle>Summary &amp; Notes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <h3 className="text-lg font-semibold">Totals</h3>
                    <div className="space-y-1 mt-2 text-sm">
                        <p>Subtotal: <span className="font-medium">${subTotal.toFixed(2)}</span></p>
                        <p>Tax ({ (watchedTaxRate * 100).toFixed(0) }%): <span className="font-medium">${taxAmount.toFixed(2)}</span></p>
                        <p className="text-lg font-bold">Grand Total: <span className="text-primary">${grandTotal.toFixed(2)}</span></p>
                    </div>
                </div>
                <div>
                    <Label htmlFor="notes">Notes (Optional - for large box in document)</Label>
                    <Textarea id="notes" {...form.register('notes')} placeholder="Any additional notes for the client, terms, conditions etc." rows={5} />
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={updateProformaMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> {updateProformaMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}