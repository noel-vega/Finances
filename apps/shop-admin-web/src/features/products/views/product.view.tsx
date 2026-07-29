import { Separator } from "ui/separator";
import { useProductQuery } from "../products.hooks";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { DataTable } from "../../../components/data-table";
import { Button } from "ui/button";
import {PlusIcon} from 'lucide-react'

export function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{value}</CardContent>
    </Card>
  );
}

export function ProductView({ id }: { id: number }) {
  const { data } = useProductQuery(id);

  if (!data) {
    return null;
  }
  return (
    <div className="max-w-6xl mx-auto w-full">
      <header className="flex gap-4 mb-4">
        <div className="size-20 bg-secondary rounded-lg" />
        <h1 className="text-lg font-semibold">{data.name}</h1>
      </header>
      <section className="flex gap-4">
        <MetricCard title="Variants" value={10} />
        <MetricCard title="Total Stock" value={500} />
        <MetricCard title="Price Range" value={"$89 - $94"} />
        <MetricCard title="Needs Attention" value={3} />
      </section>
      <Separator className="my-8" />

      <section className="space-y-4">
        <div className="flex justify-between">
          <h2 className="font-semibold">Variants</h2>
          <Button><PlusIcon /> Variant</Button>
        </div>
        <DataTable columns={[]} data={[]} />
      </section>
    </div>
  );
}
