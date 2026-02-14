
'use client'
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product } from '@/types';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';

function ProductForm({ 
  product, 
  onSave, 
  onCancel, 
  isSaving,
  categories 
}: { 
  product?: Product | null, 
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void, 
  onCancel: () => void, 
  isSaving: boolean,
  categories: string[]
}) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price ?? 0);
  const [category, setCategory] = useState(product?.category || '');
  const [unit, setUnit] = useState(product?.unit || 'unit');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, price: Number(price), category, unit });
  };
  
  const categoryOptions = useMemo(() => categories.map(cat => ({ value: cat, label: cat })), [categories]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="productName">Product Name</Label>
        <Input id="productName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="productDescription">Description</Label>
        <Textarea id="productDescription" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="productPrice">Price</Label>
            <Input id="productPrice" type="number" step="0.01" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} required />
        </div>
         <div>
            <Label htmlFor="productUnit">Unit (e.g., kg, piece, m3)</Label>
            <Input id="productUnit" value={unit} onChange={(e) => setUnit(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label htmlFor="productCategory">Category</Label>
        <Combobox
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          placeholder="Select or type a category..."
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Product'}</Button>
      </DialogFooter>
    </form>
  );
}


export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const addProductMutation = useAddProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, products]);
  
  const existingCategories = useMemo(() => {
      if (!products) return [];
      const cats = new Set(products.map(p => p.category).filter(Boolean) as string[]);
      return Array.from(cats).sort();
  }, [products]);

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ ...productData, id: editingProduct.id, createdAt: editingProduct.createdAt, updatedAt: new Date().toISOString() });
        toast({ title: 'Product Updated' });
      } else {
        await addProductMutation.mutateAsync(productData);
        toast({ title: 'Product Added' });
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not save product.', variant: 'destructive' });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if(!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      await deleteProductMutation.mutateAsync(productId);
      toast({ title: 'Product Deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete product.', variant: 'destructive' });
    }
  };


  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog."
        actions={
          <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        }
      />
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update the details of your product.' : 'Fill in the details for the new product.'}
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            product={editingProduct} 
            onSave={handleSaveProduct} 
            onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }} 
            isSaving={addProductMutation.isPending || updateProductMutation.isPending}
            categories={existingCategories}
          />
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          {isLoadingProducts ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || 'N/A'}</TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)} disabled={updateProductMutation.isPending}>
                        <Edit3 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteProduct(product.id)} disabled={deleteProductMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground">No products found. Add one to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
