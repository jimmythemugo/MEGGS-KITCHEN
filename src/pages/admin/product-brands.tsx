// ============================================================================
// MEGGS KITCHEN — PRODUCT BRANDS MANAGEMENT
// File: src/pages/admin/product-brands.tsx
// Phase: 7 (Supabase Storage & Media Architecture)
// ============================================================================

import { useState, useEffect } from "react";
import { AdminLayout } from './dashboard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ui/image-upload";
import { STORAGE_BUCKETS, deleteFromStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

type ProductBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
};

export default function ProductBrands() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logo_url: "",
    website_url: "",
    description: "",
    display_order: "0",
    is_active: true,
  });
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBrands = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('product_brands')
      .select('*')
      .order('display_order');
    if (data) {
      setBrands(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", slug: "", logo_url: "", website_url: "", description: "", display_order: "0", is_active: true });
    setOpen(true);
  };

  const openEdit = (brand: ProductBrand) => {
    setEditId(brand.id);
    setForm({
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url || "",
      website_url: brand.website_url || "",
      description: brand.description || "",
      display_order: String(brand.display_order),
      is_active: brand.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const data = {
      name: form.name,
      slug: form.slug,
      logo_url: form.logo_url || null,
      website_url: form.website_url || null,
      description: form.description || null,
      display_order: Number(form.display_order),
      is_active: form.is_active,
    };

    try {
      if (editId) {
        await supabase.from('product_brands').update(data).eq('id', editId);
        toast({ title: "Brand updated" });
      } else {
        await supabase.from('product_brands').insert(data);
        toast({ title: "Brand created" });
      }
      fetchBrands();
      setOpen(false);
    } catch {
      toast({ title: "Failed to save brand", variant: "destructive" });
    }
  };

  const handleDelete = async (brand: ProductBrand) => {
    if (!confirm("Delete this brand?") || !supabase) return;
    try {
      await supabase.from('product_brands').delete().eq('id', brand.id);
      if (brand.logo_url) {
        deleteFromStorage(STORAGE_BUCKETS.BRAND_IMAGES, brand.logo_url).catch(() => {});
      }
      toast({ title: "Brand deleted" });
      fetchBrands();
    } catch {
      toast({ title: "Failed to delete brand", variant: "destructive" });
    }
  };

  const setF = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Product Brands">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-sans font-medium mb-1">Catalog</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Manufacturer Brands</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage brand partner logos stored in the brand-images Supabase Storage bucket.</p>
        </div>
        <Button onClick={openCreate} className="rounded-sm font-sans uppercase tracking-widest text-xs h-9">
          <Plus className="h-3.5 w-3.5 mr-2" /> Add Brand
        </Button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search brands..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-sm text-sm" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-sm" />)}</div>
        ) : filteredBrands.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Brand & Logo</th>
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Slug</th>
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Website</th>
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Status</th>
                  <th className="text-left py-3 px-6 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBrands.map(brand => (
                  <tr key={brand.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{brand.name}</p>
                          {brand.description && <p className="text-muted-foreground font-light text-xs mt-0.5 line-clamp-1">{brand.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-light text-xs font-mono">{brand.slug}</td>
                    <td className="py-4 px-6 text-muted-foreground font-light text-xs">
                      {brand.website_url ? (
                        <a href={brand.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {brand.website_url}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-sm text-xs font-sans border ${brand.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                        {brand.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-sm" onClick={() => openEdit(brand)} title="Edit Brand"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-sm text-destructive hover:text-destructive" onClick={() => handleDelete(brand)} title="Delete Brand"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-muted-foreground font-light text-sm">
            No brands found.{" "}
            <button className="text-primary underline font-medium" onClick={openCreate}>Add one.</button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-sm">
          <DialogHeader>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-sans font-medium mb-1">Catalog</p>
            <DialogTitle className="font-display text-xl">{editId ? "Edit Brand" : "New Brand"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest font-sans">Name *</Label>
              <Input 
                value={form.name} 
                onChange={e => { setF("name", e.target.value); if (!editId) setF("slug", toSlug(e.target.value)); }} 
                className="mt-1 rounded-sm" 
                required 
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest font-sans">Slug *</Label>
              <Input value={form.slug} onChange={e => setF("slug", e.target.value)} className="mt-1 rounded-sm" required />
            </div>
            <div>
              <ImageUpload
                label="Brand Logo"
                value={form.logo_url}
                onChange={url => setF("logo_url", url)}
                bucket={STORAGE_BUCKETS.BRAND_IMAGES}
                folder="brands"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest font-sans">Website URL</Label>
              <Input value={form.website_url} onChange={e => setF("website_url", e.target.value)} className="mt-1 rounded-sm" placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest font-sans">Description</Label>
              <Input value={form.description} onChange={e => setF("description", e.target.value)} className="mt-1 rounded-sm" placeholder="Brand description" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest font-sans">Display Order</Label>
              <Input type="number" value={form.display_order} onChange={e => setF("display_order", e.target.value)} className="mt-1 rounded-sm" min={0} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setF("is_active", v)} id="is_active" />
              <Label htmlFor="is_active" className="text-sm">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-sm font-sans uppercase tracking-widest text-xs">Cancel</Button>
              <Button type="submit" className="rounded-sm font-sans uppercase tracking-widest text-xs">
                {editId ? "Save Changes" : "Add Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
