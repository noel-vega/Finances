import type { ProductImage } from "admin-sdk";
import { ImageManager } from "../components/image-manager";

export function ProductImagesTab(props: { productId: number; images: ProductImage[] }) {
  return <ImageManager productId={props.productId} images={props.images} />;
}
