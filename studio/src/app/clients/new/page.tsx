
'use client';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAddClient } from '@/hooks/use-clients';
import type { Client } from '@/types';
import { Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const clientFormSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().optional(),
  taxId: z.string().optional(),
  company: z.enum(['Trade Evolution', 'Successful Trade', 'Both']),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const addClientMutation = useAddClient();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      address: '',
      taxId: '',
      company: 'Both',
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      await addClientMutation.mutateAsync(data);
      toast({
        title: "Client Created",
        description: `Client "${data.companyName}" has been successfully created.`,
      });
      router.push('/clients');
    } catch (error) {
      toast({
        title: "Error Creating Client",
        description: "An unexpected error occurred.",
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Add New Client"
        description="Fill in the details for the new client."
        actions={
          <Link href="/clients" passHref>
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients</Button>
          </Link>
        }
      />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...form.register('companyName')} />
              {form.formState.errors.companyName && <p className="text-sm text-destructive mt-1">{form.formState.errors.companyName.message}</p>}
            </div>
            <div>
              <Label htmlFor="name">Contact Person Name</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID / RFC</Label>
              <Input id="taxId" {...form.register('taxId')} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...form.register('address')} />
            </div>
            <div>
              <Label htmlFor="company">Associated Company</Label>
              <Controller
                name="company"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="company">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trade Evolution">Trade Evolution</SelectItem>
                      <SelectItem value="Successful Trade">Successful Trade</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={addClientMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> {addClientMutation.isPending ? "Saving..." : "Save Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
