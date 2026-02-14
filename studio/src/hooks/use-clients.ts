
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, getDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Client } from '@/types';

const CLIENTS_COLLECTION = 'clients';

// Fetch all clients
async function fetchClients(): Promise<Client[]> {
  const clientsCollection = collection(db, CLIENTS_COLLECTION);
  const clientSnapshot = await getDocs(clientsCollection);
  const clientList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  return clientList;
}

export function useClients() {
  return useQuery<Client[], Error>({
    queryKey: [CLIENTS_COLLECTION],
    queryFn: fetchClients
  });
}

// Fetch a single client
async function fetchClient(clientId: string): Promise<Client | null> {
    if (!clientId) return null;
    const clientDocRef = doc(db, CLIENTS_COLLECTION, clientId);
    const clientSnapshot = await getDoc(clientDocRef);

    if (clientSnapshot.exists()) {
        return { id: clientSnapshot.id, ...clientSnapshot.data() } as Client;
    }
    return null;
}

export function useClient(clientId: string) {
    return useQuery<Client | null, Error>({
        queryKey: [CLIENTS_COLLECTION, clientId],
        queryFn: () => fetchClient(clientId),
        enabled: !!clientId,
    });
}


// Add a new client
async function addClient(newClientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) {
  const clientsCollection = collection(db, CLIENTS_COLLECTION);
  const docRef = await addDoc(clientsCollection, {
    ...newClientData,
    balance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef;
}

export function useAddClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_COLLECTION] });
    },
  });
}

// Update a client
async function updateClient(client: Client): Promise<void> {
  const { id, ...dataToUpdate } = client;
  const clientDocRef = doc(db, CLIENTS_COLLECTION, id);
  await updateDoc(clientDocRef, {
    ...dataToUpdate,
    updatedAt: new Date().toISOString(),
  });
}

export function useUpdateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateClient,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [CLIENTS_COLLECTION] });
            queryClient.invalidateQueries({ queryKey: [CLIENTS_COLLECTION, variables.id] });
        },
    });
}


// Update a client's balance
async function updateClientBalance({ clientId, balance }: { clientId: string; balance: number }) {
  const clientDoc = doc(db, CLIENTS_COLLECTION, clientId);
  await updateDoc(clientDoc, { balance, updatedAt: new Date().toISOString() });
}

export function useUpdateClientBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientBalance,
    onSuccess: (_, variables) => {
      // Invalidate and refetch the clients query to show the updated data
      queryClient.invalidateQueries({ queryKey: [CLIENTS_COLLECTION] });
      queryClient.invalidateQueries({ queryKey: [CLIENTS_COLLECTION, variables.clientId] });
    },
  });
}
