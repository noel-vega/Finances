import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { LoaderCircleIcon } from "lucide-react";
import type { PosDevice } from "merchant-sdk";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "ui/sheet";
import { Field, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Button } from "ui/button";
import { useUpdatePosDeviceMutation } from "../pos-devices.hooks";
import { LocationSelect } from "../components/location-select";

const EditFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a device name"),
  locationId: z.string().min(1, "Select a location"),
});
type EditForm = z.infer<typeof EditFormSchema>;

export function EditDeviceSheet(props: {
  device: PosDevice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit device</SheetTitle>
          <SheetDescription>
            Rename the device or move it to a different location.
          </SheetDescription>
        </SheetHeader>
        {props.open && props.device && (
          <EditDeviceForm
            device={props.device}
            onDone={() => props.onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// mounted only while the sheet is open, so defaultValues are a fresh snapshot
function EditDeviceForm(props: { device: PosDevice; onDone: () => void }) {
  const updateDevice = useUpdatePosDeviceMutation();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditForm>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      name: props.device.name,
      locationId: String(props.device.locationId),
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      const result = await updateDevice.mutateAsync({
        id: props.device.id,
        name: data.name.trim(),
        locationId: Number(data.locationId),
      });
      if (!result) {
        setError("Couldn't save the changes — try again.");
        return;
      }
      props.onDone();
    } catch {
      setError("Couldn't save the changes — try again.");
    }
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 px-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Device name</FieldLabel>
              <Input autoFocus {...field} />
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="locationId"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Location</FieldLabel>
              <LocationSelect value={field.value} onChange={field.onChange} />
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <SheetFooter className="flex-row justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={updateDevice.isPending}
          onClick={props.onDone}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={updateDevice.isPending}>
          {updateDevice.isPending ? (
            <>
              <LoaderCircleIcon className="animate-spin" /> Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </SheetFooter>
    </form>
  );
}
