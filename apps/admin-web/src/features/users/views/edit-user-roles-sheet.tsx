import { useState } from "react";
import type { User } from "admin-sdk";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "ui/sheet";
import { Checkbox } from "ui/checkbox";
import { Label } from "ui/label";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { LoaderCircleIcon } from "lucide-react";
import { useListRolesQuery } from "../../roles/roles.hooks";
import { useUpdateUserRolesMutation } from "../users.hooks";

export function EditUserRolesSheet(props: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit roles</SheetTitle>
          <SheetDescription>
            {props.user &&
              `Choose which roles ${props.user.firstName} ${props.user.lastName} holds.`}
          </SheetDescription>
        </SheetHeader>
        {props.open && props.user && (
          <EditUserRolesForm user={props.user} onDone={() => props.onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}

// mounted only while the sheet is open, so the initial selection is always a
// fresh snapshot of the user's current roles
function EditUserRolesForm(props: { user: User; onDone: () => void }) {
  const roles = useListRolesQuery();
  const updateUserRoles = useUpdateUserRolesMutation();
  const [selected, setSelected] = useState<number[]>(props.user.roles.map((r) => r.id));
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggle = (id: number, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));
  };

  const handleSave = async () => {
    setSaveError(null);
    const result = await updateUserRoles.mutateAsync({ id: props.user.id, roleIds: selected });
    if (!result) {
      setSaveError("Couldn't save — you may not have permission to make this change.");
      return;
    }
    props.onDone();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-2 px-4">
        {roles.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No roles yet — create one first.</p>
        )}
        {roles.data?.map((role) => (
          <div key={role.id} className="flex items-center gap-2">
            <Checkbox
              checked={selected.includes(role.id)}
              disabled={role.isSystem}
              onCheckedChange={(checked) => toggle(role.id, checked)}
            />
            <Label>{role.name}</Label>
            {role.isSystem && <Badge variant="secondary">System</Badge>}
          </div>
        ))}
      </div>

      {saveError && <p className="px-4 text-sm text-destructive">{saveError}</p>}

      <SheetFooter className="flex-row justify-end">
        <Button type="button" variant="outline" onClick={props.onDone}>
          Cancel
        </Button>
        <Button type="button" disabled={updateUserRoles.isPending} onClick={handleSave}>
          {updateUserRoles.isPending ? (
            <>
              <LoaderCircleIcon className="animate-spin" /> Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </SheetFooter>
    </div>
  );
}
