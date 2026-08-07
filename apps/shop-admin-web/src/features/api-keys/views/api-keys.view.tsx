import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "ui/input-group";
import { useListApiKeysQuery } from "../api-keys.hooks";

function CopyKeyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <InputGroupButton aria-label="Copy key" onClick={handleCopy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </InputGroupButton>
  );
}

export function ApiKeysView() {
  const apiKeys = useListApiKeysQuery();
  const keys = apiKeys.data ?? [];

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Storefront API key</CardTitle>
          <CardDescription>
            Use this key to identify your shop when calling the storefront
            API — e.g. initializing the storefront SDK on your site. It's
            safe to include in client-side code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {!apiKeys.isLoading && keys.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No API key found for your shop yet.
            </p>
          )}

          {keys.map((apiKey) => (
            <div key={apiKey.id} className="space-y-1">
              <InputGroup>
                <InputGroupInput readOnly value={apiKey.key} />
                <InputGroupAddon align="inline-end">
                  <CopyKeyButton value={apiKey.key} />
                </InputGroupAddon>
              </InputGroup>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
