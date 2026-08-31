import type { Permission } from "merchant-sdk";
import { Checkbox } from "ui/checkbox";
import { Label } from "ui/label";

function groupByResource(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const list = groups.get(permission.resource) ?? [];
    list.push(permission);
    groups.set(permission.resource, list);
  }
  return groups;
}

export function PermissionChecklist(props: {
  permissions: Permission[];
  value: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}) {
  const groups = groupByResource(props.permissions);

  const toggleOne = (key: string, checked: boolean) => {
    props.onChange(
      checked ? [...props.value, key] : props.value.filter((k) => k !== key),
    );
  };

  const toggleGroup = (keys: string[], checked: boolean) => {
    props.onChange(
      checked
        ? [...new Set([...props.value, ...keys])]
        : props.value.filter((k) => !keys.includes(k)),
    );
  };

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([resource, permissions]) => {
        const keys = permissions.map((p) => p.key);
        const allChecked = keys.every((k) => props.value.includes(k));

        return (
          <div key={resource} className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Checkbox
                checked={allChecked}
                disabled={props.disabled}
                onCheckedChange={(checked) => toggleGroup(keys, checked)}
              />
              <Label className="font-medium capitalize">{resource}</Label>
            </div>
            <div className="space-y-2 pl-6">
              {permissions.map((permission) => (
                <div key={permission.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={props.value.includes(permission.key)}
                    disabled={props.disabled}
                    onCheckedChange={(checked) => toggleOne(permission.key, checked)}
                  />
                  <Label>{permission.description}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
