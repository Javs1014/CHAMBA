'use client'
import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Product } from '@/types'
import { PlusCircle, Edit3, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from '@/components/ui/textarea'
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/use-products'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Combobox } from '@/components/ui/combobox'

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
  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [price, setPrice] = useState(product?.price ?? 0)
  const [category, setCategory] = useState(product?.category || '')
  const [unit, setUnit] = useState(product?.unit || 'unit')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, description, price: Number(price), category, unit })
  }
  
  const categoryOptions = useMemo(() => categories.map(cat => ({ value: cat, label: cat })), [categories])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="productName">Nombre del producto</Label>
        <Input id="productName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="productDescription">Descripción</Label>
        <Textarea id="productDescription" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="productPrice">Precio</Label>
          <Input id="productPrice" type="number" step="0.01" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} required />
        </div>
        <div>
          <Label htmlFor="productUnit">Unidad (ej. kg, pieza, m³)</Label>
          <Input id="productUnit" value={unit} onChange={(e) => setUnit(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label>Categoría</Label>
        <Combobox
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          placeholder="Selecciona o escribe una categoría..."
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Producto'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [exactPrice, setExactPrice] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const { toast } = useToast()
  const { data: products, isLoading: isLoadingProducts } = useProducts()
  const addProductMutation = useAddProduct()
  const updateProductMutation = useUpdateProduct()
  const deleteProductMutation = useDeleteProduct()

  const existingCategories = useMemo(() => {
    if (!products) return []
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [products])

  const categoryOptions = useMemo(() => 
    existingCategories.map(cat => ({ value: cat, label: cat })), 
    [existingCategories]
  )

  const filteredProducts = useMemo(() => {
    if (!products) return []

    let result = [...products]

    // Filtro por texto (nombre o categoría)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      )
    }

    // Filtro por categoría (si está seleccionada)
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory)
    }

    // Filtro por precio
    const exact = parseFloat(exactPrice)
    const min = parseFloat(minPrice)
    const max = parseFloat(maxPrice)

    if (!isNaN(exact)) {
      // Si hay precio exacto → ignora rango
      result = result.filter(p => p.price === exact)
    } else if (!isNaN(min) || !isNaN(max)) {
      // Filtro por rango (si al menos uno de los dos está definido)
      result = result.filter(p => {
        if (!isNaN(min) && p.price < min) return false
        if (!isNaN(max) && p.price > max) return false
        return true
      })
    }

    return result
  }, [products, searchTerm, selectedCategory, exactPrice, minPrice, maxPrice])

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ 
          ...productData, 
          id: editingProduct.id, 
          createdAt: editingProduct.createdAt, 
          updatedAt: new Date().toISOString() 
        })
        toast({ title: 'Producto Actualizado' })
      } else {
        await addProductMutation.mutateAsync(productData)
        toast({ title: 'Producto Agregado' })
      }
      setIsFormOpen(false)
      setEditingProduct(null)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el producto.', variant: 'destructive' })
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }
  
  const handleDeleteProduct = async (productId: string) => {
    if(!window.confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) return
    try {
      await deleteProductMutation.mutateAsync(productId)
      toast({ title: 'Producto Eliminado' })
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive' })
    }
  }

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Administra tu catálogo de productos."
        actions={
          <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true) }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Producto
          </Button>
        }
      />

      
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Buscador existente */}
          <div>
            <Input
              placeholder="Buscar por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          
          <div>
            <Combobox
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Todas las categorías"
            />
          </div>

          
          <div>
            <Input
              type="number"
              step="0.01"
              placeholder="Precio exacto"
              value={exactPrice}
              onChange={(e) => {
                setExactPrice(e.target.value)
                if (e.target.value) {
                  setMinPrice('')
                  setMaxPrice('')
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value)
                if (e.target.value) setExactPrice('')
              }}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Máx $"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value)
                if (e.target.value) setExactPrice('')
              }}
            />
          </div>
        </div>

        
        {(searchTerm || selectedCategory || exactPrice || minPrice || maxPrice) && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('')
              setExactPrice('')
              setMinPrice('')
              setMaxPrice('')
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} modal={false}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Actualiza los detalles del producto.' : 'Completa los datos para el nuevo producto.'}
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            product={editingProduct} 
            onSave={handleSaveProduct} 
            onCancel={() => { setIsFormOpen(false); setEditingProduct(null) }} 
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
          ) : filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
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
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteProduct(product.id)} disabled={deleteProductMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron productos con los filtros actuales.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}