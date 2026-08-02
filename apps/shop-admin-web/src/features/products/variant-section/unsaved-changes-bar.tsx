import { Button } from "ui/button";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import { cn } from "ui/utils";

export function UnsavedChangesBar(props: {
  isDirty: boolean;
  isSaving: boolean;
  onReset: () => void;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-50 grid transition-[grid-template-rows] duration-300 ease-out",
        props.isDirty ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-t bg-popover px-4 py-3 shadow-lg">
          <span className="text-sm text-muted-foreground">
            You have unsaved changes
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={props.isSaving}
              onClick={props.onReset}
            >
              Reset
            </Button>
            <Button type="submit" disabled={props.isSaving}>
              {props.isSaving ? (
                <>
                  <LoaderCircleIcon className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <PlusIcon /> Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
