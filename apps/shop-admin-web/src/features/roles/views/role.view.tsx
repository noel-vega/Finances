import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
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
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { ArrowLeftIcon, LoaderCircleIcon, Trash2Icon } from "lucide-react";
import {
  useDeleteRoleMutation,
  usePermissionsCatalogQuery,
  useRoleSuspenseQuery,
  useUpdateRoleMutation,
} from "../roles.hooks";
import { PermissionChecklist } from "../components/permission-checklist";

const EditRoleFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string(),
  permissionKeys: z.array(z.string()),
});

type EditRoleForm = z.infer<typeof EditRoleFormSchema>;

export function RoleView({ id }: { id: number }) {
  const navigate = useNavigate();
  const { data } = useRoleSuspenseQuery(id);
  const updateRole = useUpdateRoleMutation();
  const deleteRole = useDeleteRoleMutation();
  const permissions = usePermissionsCatalogQuery();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<EditRoleForm>({
    resolver: zodResolver(EditRoleFormSchema),
    defaultValues:
       {
          name: data.name,
          description: data.description ?? "",
          permissionKeys: data.permissions.map((x) => x.key),
        }
  });

  useEffect(() => {
    if (!data) return;
    // don't clobber in-progress edits with a background refetch
    if (form.formState.isDirty) return;
    form.reset({
      name: data.name,
      description: data.description ?? "",
      permissionKeys: data.permissions.map((p) => p.key),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (!data) {
    return null;
  }

  const readOnly = data.isSystem;

  const handleSubmit = form.handleSubmit(async (values) => {
    setSaveError(null);
    const result = await updateRole.mutateAsync({
      id,
      name: values.name,
      description: values.description.trim() || null,
      permissionKeys: values.permissionKeys,
    });
    if (!result) {
      setSaveError(
        "Couldn't save — check the permissions you're assigning and try again.",
      );
    }
  });

  const handleDelete = () => {
    setDeleteError(null);
    deleteRole.mutate(id, {
      onSuccess: (result) => {
        if (!result) {
          setDeleteError(
            "Couldn't delete — it may still be assigned to staff.",
          );
          return;
        }
        navigate({ to: "/app/roles" });
      },
    });
  };

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <Link to="/app/roles">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Back to roles"
            >
              <ArrowLeftIcon />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              {data.name}
              {data.isSystem && <Badge variant="secondary">System</Badge>}
            </h1>
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Delete role"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Name</FieldLabel>
              <Input {...field} disabled={readOnly} />
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

        {saveError && <p className="text-sm text-destructive">{saveError}</p>}

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
      </form>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{data.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Staff assigned this role must be reassigned first. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
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
    </div>
  );
}
