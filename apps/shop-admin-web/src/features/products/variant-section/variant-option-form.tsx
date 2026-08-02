import React, { useEffect, useRef, useState } from "react";
import { Button } from "ui/button";
import { Field, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "ui/input-group";
import { Trash2Icon } from "lucide-react";
import { parseValuesText } from "./shared";

/**
 * Name + chip-style value list editor, shared by the design variants that
 * favor a spacious form (accordion row, drawer) over a dense table input.
 */
export function VariantOptionForm(props: {
  name: string;
  valuesText: string;
  onSave: (values: { name: string; valuesText: string }) => void;
  onDelete: () => void;
  deleteLabel?: string;
}) {
  // local draft so the form only becomes dirty once "Done" commits it, not on every keystroke
  const [name, setName] = useState(props.name);
  const [values, setValues] = useState<string[]>(() => {
    const parsed = parseValuesText(props.valuesText);
    return parsed.length > 0 ? [...parsed, ""] : [""];
  });

  const valueRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIndex = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusIndex.current === null) return;
    valueRefs.current[pendingFocusIndex.current]?.focus();
    pendingFocusIndex.current = null;
  });

  const handleValueChange = (index: number, newValue: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[index] = newValue;
      // typing into the trailing empty input opens up a new empty slot
      const isLast = index === prev.length - 1;
      if (isLast && newValue.trim()) {
        next.push("");
      }
      return next;
    });
  };

  const handleValueKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // move to the next already-added empty input, if any
      const nextEmptyIndex = values.findIndex(
        (value, i) => i > index && !value.trim(),
      );
      if (nextEmptyIndex !== -1) {
        valueRefs.current[nextEmptyIndex]?.focus();
      }
      return;
    }

    if (e.key === "Backspace" && !values[index]?.trim()) {
      // the trailing input is the perpetual "add new value" slot — never
      // remove it, just keep focus where it is
      if (index === values.length - 1) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      handleRemoveValue(index);
    }
  };

  const handleRemoveValue = (index: number) => {
    if (values.length <= 1) return;
    pendingFocusIndex.current = Math.max(index - 1, 0);
    setValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClickDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const savedValues = values.map((value) => value.trim()).filter(Boolean);
    props.onSave({ name, valuesText: savedValues.join(", ") });
  };

  const handleClickDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onDelete();
  };

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Option name</FieldLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          onClick={(e) => e.stopPropagation()}
          placeholder="e.g. Color"
        />
      </Field>

      <Field>
        <FieldLabel>Option values</FieldLabel>
        <div className="space-y-2">
          {values.map((value, index) => (
            <InputGroup key={index}>
              <InputGroupInput
                ref={(el) => {
                  valueRefs.current[index] = el;
                }}
                value={value}
                onChange={(e) => handleValueChange(index, e.target.value)}
                onKeyDown={(e) => handleValueKeyDown(index, e)}
                onClick={(e) => e.stopPropagation()}
                placeholder="e.g. Red"
              />
              {index !== values.length - 1 && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label="Remove value"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveValue(index);
                    }}
                  >
                    <Trash2Icon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          ))}
        </div>
      </Field>

      <div className="flex justify-between">
        <Button variant="destructive" type="button" onClick={handleClickDelete}>
          {props.deleteLabel ?? "Delete"}
        </Button>
        <Button type="button" onClick={handleClickDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
