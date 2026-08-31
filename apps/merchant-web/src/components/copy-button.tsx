import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { InputGroupButton } from "ui/input-group";

// Read-only value + inline copy affordance, e.g. inside an <InputGroupAddon>.
// Swaps the icon to a check for 1.5s after a successful copy.
export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard can be unavailable (insecure context / denied permission)
    }
  }

  return (
    <InputGroupButton aria-label={label} onClick={handleCopy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </InputGroupButton>
  );
}
