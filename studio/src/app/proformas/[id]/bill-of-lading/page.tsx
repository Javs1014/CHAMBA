
'use client';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Upload, File, Trash2, Send } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useProforma, useUpdateProforma } from '@/hooks/use-proformas';
import { useClients } from '@/hooks/use-clients';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from '@/lib/firebase';

const storage = getStorage(app);

export default function BillOfLadingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const proformaId = params.id as string;

  const { data: proforma, isLoading: isLoadingProforma } = useProforma(proformaId);
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const updateProformaMutation = useUpdateProforma();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const client = proforma ? clients?.find(c => c.id === proforma.clientId) : null;
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !proforma) return;
    
    setIsUploading(true);

    const storageRef = ref(storage, `bills-of-lading/${proformaId}/${selectedFile.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await updateProformaMutation.mutateAsync({ 
        ...proforma, 
        uploadedBillOfLadingUrl: downloadURL,
        editableBillOfLadingSpecificFields: {
          ...proforma.editableBillOfLadingSpecificFields,
          blNo: selectedFile.name,
          // Store the full path for deletion purposes
          storagePath: snapshot.ref.fullPath,
        }
      });
      
      toast({
        title: "Upload Successful",
        description: `"${selectedFile.name}" has been linked to proforma ${proforma.proformaNumber}.`,
      });
      
      setSelectedFile(null);
    } catch (error) {
        console.error("Upload error:", error);
        toast({
            title: "Upload Failed",
            description: "Could not upload the file.",
            variant: "destructive"
        });
    } finally {
        setIsUploading(false);
    }
  };

  const handleDeleteFile = async () => {
     if (!proforma || !proforma.editableBillOfLadingSpecificFields?.storagePath) return;

    if(!window.confirm("Are you sure you want to replace the current Bill of Lading? The existing file will be deleted.")) return;

    const storagePath = proforma.editableBillOfLadingSpecificFields.storagePath;
    const fileRef = ref(storage, storagePath);

    try {
        await deleteObject(fileRef);

        await updateProformaMutation.mutateAsync({ 
            ...proforma, 
            uploadedBillOfLadingUrl: undefined,
            editableBillOfLadingSpecificFields: {
                ...proforma.editableBillOfLadingSpecificFields,
                blNo: undefined,
                storagePath: undefined,
            }
        });
        
        toast({
            title: "File Removed",
            description: `The Bill of Lading has been removed. You can now upload a new file.`,
        });
    } catch (error) {
        console.error("Deletion error:", error);
        toast({
            title: "Deletion Failed",
            description: "Could not remove the existing file from storage.",
            variant: "destructive"
        });
    }
  }

  const handleSendEmail = () => {
    if (!proforma?.uploadedBillOfLadingUrl) {
      toast({ title: "Error", description: "No uploaded Bill of Lading to send.", variant: "destructive"});
      return;
    }
    
    if (!client) {
      toast({ title: "Error", description: "Client details not found.", variant: "destructive"});
      return;
    }
    const subject = `Bill of Lading for Proforma ${proforma.proformaNumber}`;
    const body = `Hello ${client.name},\n\nThe Bill of Lading for Proforma ${proforma.proformaNumber} is available.\n\nYou can view and download it directly using this link:\n${proforma.uploadedBillOfLadingUrl}\n\nThank you,\nThe ${proforma.company} Team`;

    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const isLoading = isLoadingProforma || isLoadingClients;

  if (isLoading) {
    return <div className="container mx-auto py-8"><div className="flex justify-center items-center h-64"><p>Loading Bill of Lading...</p></div></div>;
  }

  if (!proforma) {
    notFound();
  }

  const fileName = proforma.editableBillOfLadingSpecificFields?.blNo || (proforma.uploadedBillOfLadingUrl ? 'Uploaded Document' : '');

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title={`Bill of Lading for Proforma ${proforma.proformaNumber}`}
        description="Upload and manage the Bill of Lading document for this order."
        actions={
            <Button variant="outline" onClick={() => router.push(`/proformas/${proformaId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Proforma
            </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Manage Document</CardTitle>
          <CardDescription>
            {proforma.uploadedBillOfLadingUrl 
                ? "A Bill of Lading has been uploaded for this proforma." 
                : "No Bill of Lading has been uploaded yet."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proforma.uploadedBillOfLadingUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                      <File className="h-6 w-6 text-primary" />
                      <span className="font-medium text-sm">{fileName}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={proforma.uploadedBillOfLadingUrl} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDeleteFile} disabled={updateProformaMutation.isPending}><Trash2 className="mr-2 h-4 w-4" /> Replace</Button>
                  </div>
              </div>
               <Button onClick={handleSendEmail} disabled={!client}>
                  <Send className="mr-2 h-4 w-4" /> Send to Client
               </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bol-upload" className="mb-2 block">Select Document (PDF, PNG, JPG)</Label>
                <Input id="bol-upload" type="file" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
              </div>
              {selectedFile && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
                  <Button onClick={handleUpload} disabled={isUploading || updateProformaMutation.isPending}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
