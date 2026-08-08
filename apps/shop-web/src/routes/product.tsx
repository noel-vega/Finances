import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { storefrontApi } from "../lib/storefront-api-client";
import { Badge } from "ui/badge";
import { Separator } from "ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";

export async function productLoader({ params }: LoaderFunctionArgs) {
  const product = await storefrontApi.products.getById(Number(params.id));
  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }
  return product;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductPage() {
  const product = useLoaderData<typeof productLoader>();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/products" className="text-sm text-muted-foreground hover:underline">
        ← Back to products
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">{product.name}</h1>
          {product.brand && (
            <p className="text-muted-foreground">{product.brand.name}</p>
          )}
        </div>
        <div className="flex gap-2">
          {product.categories.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {product.description && (
        <p className="mt-4 text-sm text-muted-foreground">
          {product.description}
        </p>
      )}

      <Separator className="my-6" />

      <h2 className="text-lg font-medium">Variants</h2>
      <Table className="mt-3">
        <TableHeader>
          <TableRow>
            <TableHead>Options</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {product.variants.map((variant) => (
            <TableRow key={variant.id}>
              <TableCell>
                {variant.optionValues.length > 0
                  ? variant.optionValues
                      .map((ov) => `${ov.optionName}: ${ov.value}`)
                      .join(", ")
                  : "—"}
              </TableCell>
              <TableCell>{variant.sku ?? "—"}</TableCell>
              <TableCell>{formatPrice(variant.priceCents)}</TableCell>
              <TableCell>
                {variant.stock > 0 ? variant.stock : (
                  <span className="text-muted-foreground">Out of stock</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
