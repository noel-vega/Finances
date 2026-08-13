import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useNavigate } from "@tanstack/react-router";
import { Field, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { Button } from "ui/button";
import { useCreateRoleMutation, usePermissionsCatalogQuery } from "../roles.hooks";
import { PermissionChecklist } from "../components/permission-checklist";

const CreateRoleFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string(),
  permissionKeys: z.array(z.string()),
});

type CreateRoleForm = z.infer<typeof CreateRoleFormSchema>;

export function CreateRoleView() {
  const navigate = useNavigate();
  const createRole = useCreateRoleMutation();
  const permissions = usePermissionsCatalogQuery();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CreateRoleForm>({
    resolver: zodResolver(CreateRoleFormSchema),
    defaultValues: { name: "", description: "", permissionKeys: [] },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setSubmitError(null);
    createRole.mutate(
      {
        name: data.name,
        description: data.description.trim() || undefined,
        permissionKeys: data.permissionKeys,
      },
      {
        onSuccess: (result) => {
          if (!result) {
            setSubmitError("Couldn't create the role — check the permissions you're assigning.");
            return;
          }
          navigate({ to: "/app/roles" });
        },
      },
    );
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create Role</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Name</FieldLabel>
              <Input autoFocus {...field} />
              {fieldState.error && (
                <p className="text-sm text-destructive">{fieldState.error.message}</p>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field }) => (
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea {...field} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="permissionKeys"
          render={({ field }) => (
            <Field>
              <FieldLabel>Permissions</FieldLabel>
              <PermissionChecklist
                permissions={permissions.data ?? []}
                value={field.value}
                onChange={field.onChange}
              />
            </Field>
          )}
        />

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button type="submit" disabled={createRole.isPending}>
          {createRole.isPending ? "Creating..." : "Create role"}
        </Button>
      </form>
    </div>
  );
}
