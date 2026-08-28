import { useState } from "react";
import { LoaderCircleIcon, RefreshCwIcon } from "lucide-react";
import type { PosDevicePairing } from "admin-sdk";
import { Button } from "ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "ui/input-group";
import { SheetFooter, SheetHeader, SheetTitle, SheetDescription } from "ui/sheet";
import { CopyButton } from "../../../components/copy-button";
import { useRotatePairingMutation } from "../pos-devices.hooks";
import { PairingCountdown } from "./pairing-countdown";

// 8-char code -> "XXXX XXXX" for readability
function group(code: string) {
  return code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
}

export function PairingCodeReveal(props: {
  pairing: PosDevicePairing;
  locationName?: string | null;
  onDone: () => void;
}) {
  const [pairing, setPairing] = useState(props.pairing);
  const rotate = useRotatePairingMutation();
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    setError(null);
    try {
      const result = await rotate.mutateAsync(pairing.id);
      if (!result) {
        setError("Couldn't generate a new code — try again.");
        return;
      }
      setPairing(result);
    } catch {
      setError("Couldn't generate a new code — try again.");
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Pairing code for {pairing.name}</SheetTitle>
        <SheetDescription>
          {props.locationName
            ? `This device will sell from ${props.locationName}. `
            : ""}
          The code is single-use and expires shortly.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
        <div
          className="font-mono text-3xl font-semibold tracking-[0.3em] select-all"
          aria-label={`Pairing code ${pairing.pairingCode}`}
        >
          {group(pairing.pairingCode)}
        </div>

        <InputGroup className="max-w-xs">
          <InputGroupInput readOnly value={pairing.pairingCode} />
          <InputGroupAddon align="inline-end">
            <CopyButton value={pairing.pairingCode} label="Copy pairing code" />
          </InputGroupAddon>
        </InputGroup>

        <PairingCountdown expiresAt={pairing.pairingExpiresAt} />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={regenerate}
          disabled={rotate.isPending}
        >
          {rotate.isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <RefreshCwIcon />
          )}
          Generate new code
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="max-w-xs text-center text-sm text-muted-foreground">
          On the POS tablet: open the app, tap <strong>Pair</strong>, and enter
          this code.
        </p>
      </div>

      <SheetFooter className="flex-row justify-end">
        <Button type="button" onClick={props.onDone}>
          Done
        </Button>
      </SheetFooter>
    </>
  );
}
