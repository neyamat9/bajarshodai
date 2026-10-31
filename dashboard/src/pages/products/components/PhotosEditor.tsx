import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { assetUrl, errorMessage } from "@/api/client";
import { productsApi, type ProductImage } from "@/api/products";
import { useAct } from "@/hooks/useAct";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { UploadProgressBar } from "@/components/shared/UploadProgressBar";
import { tr } from "@/i18n";

// create mode: files are only collected (`staged`) and uploaded after the product exists.
export function PhotosEditor({
  productId,
  images,
  staged,
  onStage,
  stagedProgress,
}: {
  productId?: string;
  images?: ProductImage[];
  staged: File[];
  onStage: (f: File[]) => void;
  stagedProgress?: number | null;
}) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [del, setDel] = useState<ProductImage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadCount, setUploadCount] = useState<number>(0);

  const inv = [["product", productId], ["products"]];
  const main = useAct((id: string) => productsApi.updateImage(productId!, id, { isMain: true }), { invalidate: inv });
  const order = useAct((ids: string[]) => productsApi.reorderImages(productId!, ids), { invalidate: inv });
  const remove = useAct((id: string) => productsApi.removeImage(productId!, id), { success: tr("Photo removed"), invalidate: inv, onSuccess: () => setDel(null) });

  const activeProgress = uploadProgress !== null ? uploadProgress : stagedProgress ?? null;
  const isUploading = activeProgress !== null;

  const pick = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    if (productId) {
      setUploadCount(files.length);
      setUploadProgress(0);
      try {
        await productsApi.uploadImages(productId, files, undefined, (pct) => setUploadProgress(pct));
        toast.success(tr("Photos added"));
        qc.invalidateQueries({ queryKey: ["product", productId] });
        qc.invalidateQueries({ queryKey: ["products"] });
      } catch (e) {
        toast.error(errorMessage(e, "Upload failed"));
      } finally {
        setUploadProgress(null);
        setUploadCount(0);
        if (input.current) input.current.value = "";
      }
    } else {
      onStage([...staged, ...files].slice(0, 10));
      if (input.current) input.current.value = "";
    }
  };
  const move = (i: number, d: number) => {
    const ids = (images ?? []).map((x) => x.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    order.mutate(ids);
  };

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted-foreground">{tr("JPG, PNG, WebP or GIF, up to 10 MB each. The first (starred) photo is the one shown in lists.")}</p>

      {activeProgress !== null && (
        <UploadProgressBar
          progress={activeProgress}
          label={
            uploadCount > 1
              ? tr("Uploading {{count}} photos…", { count: uploadCount })
              : tr("Uploading photo…")
          }
          processingLabel={tr("Optimizing photos & saving to storage…")}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {(images ?? []).map((im, i) => (
          <div key={im.id} className="group relative overflow-hidden rounded border border-border bg-muted">
            <img src={assetUrl(im.url)} alt={im.alt ?? ""} className="aspect-square w-full object-cover" />
            {im.isMain && <span className="absolute left-1.5 top-1.5 rounded bg-fresh-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{tr("MAIN")}</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 p-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
              <div className="flex gap-1">
                <Button size="icon-xs" variant="secondary" aria-label={tr("Move left")} disabled={i === 0 || isUploading} onClick={() => move(i, -1)}><ArrowLeft /></Button>
                <Button size="icon-xs" variant="secondary" aria-label={tr("Move right")} disabled={i === (images?.length ?? 0) - 1 || isUploading} onClick={() => move(i, 1)}><ArrowRight /></Button>
              </div>
              <div className="flex gap-1">
                {!im.isMain && <Button size="icon-xs" variant="secondary" aria-label={tr("Make main")} disabled={isUploading} onClick={() => main.mutate(im.id)}><Star /></Button>}
                <Button size="icon-xs" variant="destructive" aria-label={tr("Delete")} disabled={isUploading} onClick={() => setDel(im)}><Trash2 /></Button>
              </div>
            </div>
          </div>
        ))}
        {staged.map((f, i) => (
          <div key={f.name + i} className="relative overflow-hidden rounded border border-dashed border-fresh-400 bg-muted">
            <img src={URL.createObjectURL(f)} alt="" className="aspect-square w-full object-cover" />
            <span className="absolute left-1.5 top-1.5 rounded bg-forest-800 px-1.5 py-0.5 text-[10px] font-bold text-white">{i === 0 ? "MAIN · " : ""}uploads on save</span>
            <Button size="icon-xs" variant="destructive" className="absolute right-1.5 top-1.5" aria-label={tr("Remove")} disabled={isUploading} onClick={() => onStage(staged.filter((_, j) => j !== i))}><Trash2 /></Button>
          </div>
        ))}
        {isUploading && (
          <div className="relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-fresh-400 bg-fresh-500/5 p-2 text-center">
            <Loader2 className="size-6 animate-spin text-fresh-600 dark:text-fresh-400" />
            <span className="font-mono text-xs font-bold text-fresh-600 dark:text-fresh-400">
              {activeProgress}%
            </span>
            <span className="text-[10px] text-muted-foreground truncate max-w-full">
              {activeProgress < 100 ? tr("Uploading…") : tr("Processing…")}
            </span>
          </div>
        )}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => input.current?.click()}
          className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-border text-xs font-medium text-muted-foreground hover:border-fresh-400 hover:text-fresh-600 disabled:pointer-events-none disabled:opacity-50"
        >
          <ImagePlus className="size-6" />
          {isUploading ? tr("Uploading…") : tr("Add photos")}
        </button>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => void pick(e.target.files)} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={tr("Delete this photo?")} confirmLabel={tr("Delete")} destructive loading={remove.isPending} onConfirm={() => del && remove.mutate(del.id)} />
    </div>
  );
}
