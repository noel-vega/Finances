import type { OrderDetail } from "admin-sdk";
import { Badge } from "ui/badge";

type FulfillmentStatus = OrderDetail["fulfillmentStatus"];

const STATUS_LABEL: Record<FulfillmentStatus, string> = {
  unfulfilled: "Unfulfilled",
  partially_fulfilled: "Partially fulfilled",
  fulfilled: "Fulfilled",
};

const STATUS_VARIANT: Record<FulfillmentStatus, "outline" | "secondary" | "default"> = {
  unfulfilled: "outline",
  partially_fulfilled: "secondary",
  fulfilled: "default",
};

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
