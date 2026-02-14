
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, getDoc, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Proforma } from '@/types';

// Fetch all proformas
async function fetchProformas(): Promise<Proforma[]> {
  const proformasCollection = collection(db, 'proformas');
  const proformaSnapshot = await getDocs(proformasCollection);
  const proformaList = proformaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proforma));
  return proformaList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function useProformas() {
  return useQuery<Proforma[], Error>({
    queryKey: ['proformas'],
    queryFn: fetchProformas,
  });
}

// Fetch a single proforma
async function fetchProforma(proformaId: string): Promise<Proforma | null> {
    if (!proformaId) return null;
    const proformaDocRef = doc(db, 'proformas', proformaId);
    const proformaSnapshot = await getDoc(proformaDocRef);

    if (proformaSnapshot.exists()) {
        return { id: proformaSnapshot.id, ...proformaSnapshot.data() } as Proforma;
    }
    return null;
}

export function useProforma(proformaId: string) {
    const queryClient = useQueryClient();
    return useQuery<Proforma | null, Error>({
        queryKey: ['proforma', proformaId],
        queryFn: () => fetchProforma(proformaId),
        enabled: !!proformaId, // Only run the query if proformaId is available
        // When a proforma is updated, we might want to refresh its single view
        // The invalidation happens in useUpdateProforma, but this ensures stale data is cleared.
        onSuccess: (data) => {
          if (data) {
            queryClient.setQueryData(['proforma', proformaId], data);
          }
        }
    });
}

// Add a new proforma
async function addProforma(newProformaData: Omit<Proforma, 'id'>) {
    const proformasCollection = collection(db, 'proformas');
    const docRef = await addDoc(proformasCollection, newProformaData);
    return docRef;
}

export function useAddProforma() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addProforma,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proformas'] });
        },
    });
}

// Update a proforma
async function updateProforma(proforma: Proforma) {
    const { id, ...dataToUpdate } = proforma;
    const proformaDocRef = doc(db, 'proformas', id);
    await updateDoc(proformaDocRef, dataToUpdate);
    // Return the updated object to be used in onSuccess
    return proforma;
}

export function useUpdateProforma() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProforma,
        onSuccess: (updatedProforma) => {
            // Invalidate the list of all proformas
            queryClient.invalidateQueries({ queryKey: ['proformas'] });
            // Directly update the cache for the single proforma view to avoid a refetch
            queryClient.setQueryData(['proforma', updatedProforma.id], updatedProforma);
        },
    });
}

// Delete a proforma
async function deleteProforma(proformaId: string) {
    const proformaDocRef = doc(db, 'proformas', proformaId);
    await deleteDoc(proformaDocRef);
}

export function useDeleteProforma() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProforma,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proformas'] });
        },
    });
}
