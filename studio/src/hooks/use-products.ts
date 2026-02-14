'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';

const PRODUCTS_COLLECTION = 'products';

// Fetch all products
async function fetchProducts(): Promise<Product[]> {
  const productsCollection = collection(db, PRODUCTS_COLLECTION);
  const snapshot = await getDocs(productsCollection);
  const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  return productList.sort((a, b) => a.name.localeCompare(b.name));
}

export function useProducts() {
  return useQuery<Product[], Error>({
    queryKey: [PRODUCTS_COLLECTION],
    queryFn: fetchProducts,
  });
}

// Add a new product
async function addProduct(newProductData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const productsCollection = collection(db, PRODUCTS_COLLECTION);
  const docRef = await addDoc(productsCollection, {
    ...newProductData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef;
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_COLLECTION] });
    },
  });
}

// Update a product
async function updateProduct(product: Product) {
    const { id, ...dataToUpdate } = product;
    const productDocRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productDocRef, dataToUpdate);
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PRODUCTS_COLLECTION] });
        },
    });
}

// Delete a product
async function deleteProduct(productId: string) {
    const productDocRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(productDocRef);
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PRODUCTS_COLLECTION] });
        },
    });
}
