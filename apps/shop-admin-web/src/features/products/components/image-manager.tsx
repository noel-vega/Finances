import { useRef } from "react";
import type { ChangeEvent } from "react";
import { Card } from "ui/card";
import { Button } from "ui/button";
import { ImageUpIcon, ChevronLeftIcon, ChevronRightIcon, Trash2Icon, LoaderCircleIcon } from "lucide-react";
import type { ProductImage } from "admin-sdk";
import {
  useUploadProductImageMutation,
  useReorderProductImagesMutation,
  useDeleteProductImageMutation,
} from "../products.hooks";

// used both for a product's own gallery (no variantId) and for one variant's
// override gallery (variantId set) — same UI, different scope
export function ImageManager(props: {
  productId: number;
  variantId?: number;
  images: ProductImage[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadProductImageMutation(props.productId);
  const reorder = useReorderProductImagesMutation(props.productId);
  const remove = useDeleteProductImageMutation(props.productId);

  const images = [...props.images].sort((a, b) => a.position - b.position);

  function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      upload.mutate({ file, variantId: props.variantId });
    }
    e.target.value = "";
  }

  function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    reorder.mutate(reordered.map((image) => image.id));
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={upload.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        {upload.isPending ? (
          <>
            <LoaderCircleIcon className="animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <ImageUpIcon /> Upload images
          </>
        )}
      </Button>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">No images yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <Card key={image.id} className="overflow-hidden">
              <img src={image.url} alt="" className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === 0 || reorder.isPending}
                    aria-label="Move earlier"
                    onClick={() => move(index, -1)}
                  >
                    <ChevronLeftIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === images.length - 1 || reorder.isPending}
                    aria-label="Move later"
                    onClick={() => move(index, 1)}
                  >
                    <ChevronRightIcon />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={remove.isPending}
                  aria-label="Delete image"
                  onClick={() => remove.mutate(image.id)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
