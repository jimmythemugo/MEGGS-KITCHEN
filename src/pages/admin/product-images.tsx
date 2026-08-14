// ============================================================================
// MEGGS KITCHEN — PRODUCT IMAGES MANAGEMENT PAGE
// File: src/pages/admin/product-images.tsx
// Phase: 7 (Supabase Storage & Media Architecture)
// ============================================================================

import { useState, useEffect } from "react";
import { AdminLayout } from './dashboard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Image as ImageIcon,
  Star,
  Maximize2,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ui/image-upload";
import { STORAGE_BUCKETS, setPrimaryProductImage, deleteProductImage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  product_name?: string;
};

export default function ProductImages() {
  const [search, setSearch] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    product_id: "",
    image_url: "",
    alt_text: "",
    display_order: "0",
    is_primary: false,
  });
  const [images, setImages] = useState<ProductImage[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchImages = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('product_images')
      .select('*, products!inner(name)')
      .order('display_order');
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setImages(data.map((img: any) => ({
        ...img,
        product_name: img.products?.name,
      })));
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (data) setProducts(data);
  };

  useEffect(() => {
    fetchImages();
    fetchProducts();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({
      product_id: products[0]?.id || "",
      image_url: "",
      alt_text: "",
      display_order: "0",
      is_primary: false,
    });
    setOpen(true);
  };

  const openEdit = (img: ProductImage) => {
    setEditId(img.id);
    setForm({
      product_id: img.product_id,
      image_url: img.image_url,
      alt_text: img.alt_text || "",
      display_order: String(img.display_order),
      is_primary: img.is_primary,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (!form.product_id) {
      toast({ title: "Please select a product", variant: "destructive" });
      return;
    }
    if (!form.image_url) {
      toast({ title: "Please upload or provide an image", variant: "destructive" });
      return;
    }

    const data = {
      product_id: form.product_id,
      image_url: form.image_url,
      alt_text: form.alt_text || null,
      display_order: Number(form.display_order),
      is_primary: form.is_primary,
    };

    try {
      if (editId) {
        if (form.is_primary) {
          await supabase
            .from('product_images')
            .update({ is_primary: false })
            .eq('product_id', form.product_id);
          await supabase
            .from('products')
            .update({ image_url: form.image_url })
            .eq('id', form.product_id);
        }
        await supabase.from('product_images').update(data).eq('id', editId);
        toast({ title: "Image updated" });
      } else {
        if (form.is_primary) {
          await supabase
            .from('product_images')
            .update({ is_primary: false })
            .eq('product_id', form.product_id);
          await supabase
            .from('products')
            .update({ image_url: form.image_url })
            .eq('id', form.product_id);
        }
        await supabase.from('product_images').insert(data);
        toast({ title: "Image added to product" });
      }
      fetchImages();
      setOpen(false);
    } catch {
      toast({ title: "Failed to save image", variant: "destructive" });
    }
  };

  const handleDelete = async (img: ProductImage) => {
    if (!confirm("Delete this image?") || !supabase) return;
    try {
      await deleteProductImage(img.id, img.product_id, img.image_url);
      toast({ title: "Image deleted" });
      fetchImages();
    } catch {
      toast({ title: "Failed to delete image", variant: "destructive" });
    }
  };

  const handleMakePrimary = async (img: ProductImage) => {
    try {
      await setPrimaryProductImage(img.product_id, img.id, img.image_url);
      toast({ title: "Cover image set" });
      fetchImages();
    } catch {
      toast({ title: "Failed to set cover image", variant: "destructive" });
    }
  };

  const handleReorder = async (img: ProductImage, delta: number) => {
    const newOrder = Math.max(0, img.display_order + delta);
    await supabase.from('product_images').update({ display_order: newOrder }).eq('id', img.id);
    fetchImages();
  };

  const setF = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const filteredImages = images.filter(img => {
    const matchesSearch =
      img.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      img.alt_text?.toLowerCase().includes(search.toLowerCase());
    const matchesProduct =
      selectedProductFilter === 'all' || img.product_id === selectedProductFilter;
    return matchesSearch && matchesProduct;
  });

  return (
    <AdminLayout title="Product Images">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-sans font-medium mb-1">Catalog Media</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Product Images</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage high-resolution photography stored in the product-images Supabase Storage bucket.</p>
        </div>
        <Button onClick={openCreate} className="rounded-sm font-sans uppercase tracking-widest text-xs h-9">
          <Plus className="h-3.5 w-3.5 mr-2" /> Add Image
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search images or captions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-sm text-sm"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedProductFilter} onValueChange={setSelectedProductFilter}>
            <SelectTrigger className="rounded-sm text-sm">
              <SelectValue placeholder="Filter by product..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-sm" />)}</div>
        ) : filteredImages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Image</th>
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Product</th>
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Caption / Alt Text</th>
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Order</th>
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Primary</th>
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredImages.map(img => (
                  <tr key={img.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-6">
                      <div
                        className="relative group h-16 w-16 rounded-sm bg-muted flex items-center justify-center overflow-hidden border border-border cursor-pointer"
                        onClick={() => setPreviewUrl(img.image_url)}
                      >
                        {img.image_url ? (
                          <img src={img.image_url} alt={img.alt_text || ""} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-foreground">{img.product_name || "—"}</td>
                    <td className="py-4 px-6 text-muted-foreground text-xs">{img.alt_text || <span className="italic text-muted-foreground/50">No caption</span>}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{img.display_order}</span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleReorder(img, -1)}
                            className="p-0.5 hover:text-primary text-muted-foreground"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(img, 1)}
                            className="p-0.5 hover:text-primary text-muted-foreground"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {img.is_primary ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-xs font-sans border bg-primary/10 text-primary border-primary/30 font-medium">
                          <Star className="w-3 h-3 fill-primary" /> Cover Photo
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMakePrimary(img)}
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" /> Make Cover
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-sm" onClick={() => openEdit(img)} title="Edit / Replace">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-sm text-destructive hover:text-destructive" onClick={() => handleDelete(img)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-muted-foreground font-light text-sm">
            No product images found matching your search.{" "}
            <button className="text-primary underline font-medium" onClick={openCreate}>Add an image.</button>
          </div>
        )}
      </div>

      {/* Lightbox Preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white hover:bg-black rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewUrl} alt="High resolution preview" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

      {/* Upload / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-sm">
          <DialogHeader>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-sans font-medium mb-1">Catalog Media</p>
            <DialogTitle className="font-display text-xl">{editId ? "Edit Product Image" : "Upload Product Image"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest font-sans">Product *</Label>
              <Select value={form.product_id} onValueChange={v => setF("product_id", v)}>
                <SelectTrigger className="mt-1 rounded-sm"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ImageUpload
                label="Product Photo *"
                value={form.image_url}
                onChange={url => setF("image_url", url)}
                bucket={STORAGE_BUCKETS.PRODUCT_IMAGES}
                folder={`products/${form.product_id || 'general'}`}
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest font-sans">Caption / Alt Text</Label>
              <Input
                value={form.alt_text}
                onChange={e => setF("alt_text", e.target.value)}
                className="mt-1 rounded-sm"
                placeholder="Descriptive caption (e.g. 'Stainless steel countertop angle shot')"
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest font-sans">Display Order</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={e => setF("display_order", e.target.value)}
                className="mt-1 rounded-sm"
                min={0}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_primary} onCheckedChange={v => setF("is_primary", v)} id="is_primary" />
              <Label htmlFor="is_primary" className="text-sm cursor-pointer">Set as Primary Cover Image</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-sm font-sans uppercase tracking-widest text-xs">Cancel</Button>
              <Button type="submit" className="rounded-sm font-sans uppercase tracking-widest text-xs">
                {editId ? "Save Changes" : "Save Image"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
