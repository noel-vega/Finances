import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useNavigate } from "@tanstack/react-router";
import { Field, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Button } from "ui/button";
import { useCreateLocationMutation } from "../locations.hooks";

const CreateLocationFormSchema = z.object({
  name: z.string().min(1, "Required"),
});

type CreateLocationForm = z.infer<typeof CreateLocationFormSchema>;

export function CreateLocationView() {
  const navigate = useNavigate();
  const createLocation = useCreateLocationMutation();
  const form = useForm<CreateLocationForm>({
    resolver: zodResolver(CreateLocationFormSchema),
    defaultValues: { name: "" },
  });

  const handleSubmit = form.handleSubmit((data) => {
    createLocation.mutate(data, {
      onSuccess: () => {
        navigate({ to: "/app/locations" });
      },
    });
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create Location</h1>
      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Name</FieldLabel>
              <Input autoFocus placeholder="e.g. Warehouse" {...field} />
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />

        <Button type="submit" disabled={createLocation.isPending}>
          {createLocation.isPending ? "Creating..." : "Create"}
        </Button>
      </form>
    </div>
  );
}
