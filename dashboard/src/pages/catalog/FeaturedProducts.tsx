import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  PackagePlus,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  featuredProductsApi,
  productsApi,
  type FeaturedProductItem,
  type ProductRow,
} from "@/api/products";
import { categoriesApi } from "@/api/catalog";
import { errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { SortableList } from "@/components/shared/Sortable";
import { Thumb } from "@/components/shared/Thumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { money } from "@/lib/format";
import { tr } from "@/i18n";
import { CardListSkeleton } from "@/components/shared/skeletons";
import { useProductNameDisplay } from "@/lib/productName";

const MAX_FEATURED = 18;

export default function FeaturedProducts() {
  const qc = useQueryClient();
  const { format: formatName } = useProductNameDisplay();

  const { data: serverItems, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: featuredProductsApi.list,
  });

  const [items, setItems] = useState<FeaturedProductItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  // Sync server items to local state
  useEffect(() => {
    if (serverItems) {
      setItems(serverItems);
    }
  }, [serverItems]);

  // Check if items have changed from server state
  const hasChanges = useMemo(() => {
    if (!serverItems) return false;
    if (serverItems.length !== items.length) return true;
    return items.some((item, idx) => item.id !== serverItems[idx]?.id);
  }, [serverItems, items]);

  const saveMutation = useMutation({
    mutationFn: (ids: string[]) => featuredProductsApi.update(ids),
    onSuccess: (updated) => {
      setItems(updated);
      void qc.invalidateQueries({ queryKey: ["featured-products"] });
      toast.success(tr("18 Featured products saved successfully!"));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // Reorder handler from SortableList
  const handleReorder = (newIds: string[]) => {
    const map = new Map(items.map((i) => [i.id, i]));
    const next = newIds.map((id) => map.get(id)!).filter(Boolean);
    setItems(next);
  };

  // Remove handler
  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  // Add handler
  const handleAdd = (product: ProductRow) => {
    if (items.length >= MAX_FEATURED) {
      toast.error(tr(`Maximum ${MAX_FEATURED} products can be featured.`));
      return;
    }
    const newItem: FeaturedProductItem = {
      id: product.id,
      name: product.name,
      nameBn: product.nameBn,
      slug: product.slug,
      productCode: product.productCode,
      regularPrice: Number(product.regularPrice),
      sellingPrice: Number(product.sellingPrice),
      stock: Number(product.stock),
      trackStock: product.trackStock,
      status: product.status,
      isFeatured: true,
      categoryName: product.categoryName,
      mainImage: product.mainImage,
      unit: product.unit,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Products query for modal search
  const { data: searchResult, isLoading: searching } = useQuery({
    queryKey: ["product-picker-search", searchTerm, selectedCat],
    queryFn: () =>
      productsApi.list({
        search: searchTerm,
        categoryId: selectedCat || undefined,
        status: "ACTIVE",
        limit: 30,
      }),
    enabled: modalOpen,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    enabled: modalOpen,
  });

  const featuredIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const outOfStockCount = useMemo(
    () =>
      items.filter(
        (i) => i.status !== "ACTIVE" || (i.trackStock && i.stock <= 0),
      ).length,
    [items],
  );

  if (isLoading) {
    return (
      <CardListSkeleton
        title={tr("Featured Products (আজকের তাজা বাজার)")}
        text={tr("Loading featured items...")}
        action=""
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="size-6 text-brand-fresh" />
            <span>{tr("Featured Products (আজকের তাজা বাজার)")}</span>
          </div>
        }
        description={tr(
          "Curate and order the exact 18 products shown on the customer homepage.",
        )}
        actions={
          <div className="flex items-center gap-3">
            <Badge
              variant={items.length === MAX_FEATURED ? "success" : "neutral"}
              className="text-xs px-3 py-1 font-bold"
            >
              {items.length} / {MAX_FEATURED} {tr("Selected")}
            </Badge>

            <Button
              type="button"
              variant="outline"
              disabled={items.length >= MAX_FEATURED}
              onClick={() => setModalOpen(true)}
              className="gap-2"
            >
              <Plus className="size-4" />
              {tr("Add Product")}
            </Button>

            <Button
              type="button"
              disabled={!hasChanges || saveMutation.isPending}
              onClick={() => saveMutation.mutate(items.map((i) => i.id))}
              className="gap-2 bg-brand-fresh hover:bg-brand-fresh/90 text-on-fresh font-bold"
            >
              <Save className="size-4" />
              {saveMutation.isPending ? tr("Saving...") : tr("Save Changes")}
            </Button>
          </div>
        }
      />

      {/* Out of stock banner */}
      {outOfStockCount > 0 && (
        <div className="flex items-center gap-3 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            <strong>{outOfStockCount}</strong>{" "}
            {tr(
              "featured product(s) are currently out of stock or inactive. Consider replacing them with available fresh items.",
            )}
          </p>
        </div>
      )}

      {/* Main Sortable List */}
      {items.length === 0 ? (
        <EmptyState
          icon={<PackagePlus className="size-12 text-muted-foreground" />}
          title={tr("No featured products selected yet")}
          description={tr(
            "Add up to 18 products to be displayed prominently in 'আজকের তাজা বাজার' on the customer storefront.",
          )}
          action={
            <Button
              type="button"
              onClick={() => setModalOpen(true)}
              className="gap-2 bg-brand-fresh text-on-fresh"
            >
              <Plus className="size-4" />
              {tr("Add First Product")}
            </Button>
          }
        />
      ) : (
        <div className="rounded border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground px-2">
            <span>{tr("Drag rows using the handle to reorder (Slot 1 to 18)")}</span>
            <span>{tr("Changes take effect immediately on save")}</span>
          </div>

          <SortableList items={items} onReorder={handleReorder}>
            {(item) => {
              const idx = items.findIndex((p) => p.id === item.id) + 1;
              const isOOS = item.status !== "ACTIVE" || (item.trackStock && item.stock <= 0);
              const isDailyFresh = !item.trackStock;
              const nameInfo = formatName(item);

              return (
                <div className="flex items-center justify-between gap-4 p-2 sm:p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Position Number Pill */}
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-foreground">
                      #{idx}
                    </div>

                    <Thumb src={item.mainImage} alt={nameInfo.primary} className="size-12 shrink-0" />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm text-foreground">
                        {nameInfo.primary}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[
                          nameInfo.secondary,
                          item.productCode,
                          item.categoryName,
                          item.unit?.shortLabel ? `per ${item.unit.shortLabel}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Stock Status Badge */}
                    {isOOS ? (
                      <Badge variant="danger" className="gap-1 text-[11px] font-bold">
                        <AlertTriangle className="size-3" />
                        {tr("Out of Stock")}
                      </Badge>
                    ) : isDailyFresh ? (
                      <Badge variant="success" className="text-[11px] font-semibold">
                        {tr("Daily Fresh")}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                        {item.stock} {tr("in stock")}
                      </span>
                    )}

                    {/* Price */}
                    <div className="text-right min-w-[70px]">
                      <p className="text-sm font-bold text-foreground">
                        {money(item.sellingPrice)}
                      </p>
                      {item.regularPrice > item.sellingPrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          {money(item.regularPrice)}
                        </p>
                      )}
                    </div>

                    {/* Remove Action */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.id)}
                      className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title={tr("Remove from featured")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            }}
          </SortableList>
        </div>
      )}

      {/* Add Product Modal Dialog */}
      {modalOpen && (
        <Dialog open onOpenChange={(o) => !o && setModalOpen(false)}>
          <DialogContent size="lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{tr("Add Product to 'আজকের তাজা বাজার'")}</DialogTitle>
                <Badge variant="neutral" className="mr-6">
                  {items.length} / {MAX_FEATURED}
                </Badge>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-4">
              {/* Search & Filter Inputs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder={tr("Search by product name, barcode or code...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {categories && categories.length > 0 && (
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="h-9 rounded border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-brand-fresh"
                  >
                    <option value="">{tr("All Categories")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn || c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Product Results */}
              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {searching ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {tr("Searching products...")}
                  </div>
                ) : !searchResult?.data || searchResult.data.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {tr("No products found matching your search.")}
                  </div>
                ) : (
                  searchResult.data.map((prod: ProductRow) => {
                    const isAdded = featuredIds.has(prod.id);
                    const isFull = items.length >= MAX_FEATURED;
                    const nameInfo = formatName(prod);

                    return (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between gap-3 rounded border border-border p-2.5 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Thumb src={prod.mainImage} alt={nameInfo.primary} className="size-10 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {nameInfo.primary}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[
                                nameInfo.secondary,
                                prod.productCode,
                                prod.categoryName,
                                money(prod.sellingPrice),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isAdded ? (
                            <Badge
                              variant="outline"
                              className="gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            >
                              <Check className="size-3" />
                              {tr("Added")}
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isFull}
                              onClick={() => handleAdd(prod)}
                              className="gap-1.5 h-8 text-xs font-semibold hover:border-brand-fresh hover:text-brand-fresh"
                            >
                              <Plus className="size-3.5" />
                              {tr("Add")}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" onClick={() => setModalOpen(false)}>
                {tr("Done")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
