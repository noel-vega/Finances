import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import type { RoleDetail } from "admin-sdk";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "ui/alert-dialog";
import { Field, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { Button } from "ui/button";
import { LoaderCircleIcon } from "lucide-react";
import {
  useDeleteRoleMutation,
  usePermissionsCatalogSuspenseQuery,
  useUpdateRoleMutation,
} from "../roles.hooks";
import { PermissionChecklist } from "../components/permission-checklist";


const EditRoleFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string(),
  permissionKeys: z.array(z.string()),
});

type EditRoleForm = z.infer<typeof EditRoleFormSchema>;

// mounted only while the sheet is open, so defaultValues are always a fresh
// snapshot of the role
export function EditRoleForm(props: { role: RoleDetail; onDone: () => void }) {
  const updateRole = useUpdateRoleMutation();
  const deleteRole = useDeleteRoleMutation();
  const permissions = usePermissionsCatalogSuspenseQuery();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const form = useForm<EditRoleForm>({
    resolver: zodResolver(EditRoleFormSchema),
    defaultValues: {
      name: props.role.name,
      description: props.role.description ?? "",
      permissionKeys: props.role.permissions.map((p) => p.key),
    },
  });

  const readOnly = props.role.isSystem;

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateRole.mutateAsync({
      id: props.role.id,
      name: data.name,
      description: data.description.trim() || null,
      permissionKeys: data.permissionKeys,
    });
    props.onDone();
  });

  const handleDelete = () => {
    deleteRole.mutate(props.role.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        props.onDone();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 px-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Name</FieldLabel>
              <Input {...field} disabled={readOnly} />
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
              <Textarea {...field} disabled={readOnly} />
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
                disabled={readOnly}
              />
            </Field>
          )}
        />
      </div>

      <div className="flex-row justify-between">
        {readOnly ? (
          <span />
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={deleteRole.isPending}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete role
          </Button>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={props.onDone}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button type="submit" disabled={updateRole.isPending}>
              {updateRole.isPending ? (
                <>
                  <LoaderCircleIcon className="animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{props.role.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Staff assigned this role must be reassigned first. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteRole.isPending}
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
